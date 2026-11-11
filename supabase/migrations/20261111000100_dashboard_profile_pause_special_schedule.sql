-- Panou restaurant: profil, pauză comenzi, program special, încărcări în folderul propriu.
-- NU modifică datele existente. Toate coloanele noi au valori implicite sigure.
--
-- 1) Profil restaurant: copertă și rețele sociale (logo, culoare, telefon, adresă există deja).
-- 2) restaurant_settings: program special (sărbători) + pauză comenzi.
-- 3) Funcția update_restaurant_profile: administratorul își poate edita DOAR câmpurile de profil
--    (tabelul restaurants rămâne editabil direct doar de super_admin, ca acum).
-- 4) Storage: fiecare administrator poate scrie doar în folderul restaurantului său.
-- 5) Comenzile noi sunt refuzate de server cât timp restaurantul este în pauză.

-- 1) ------------------------------------------------------------------------
alter table public.restaurants
  add column if not exists cover_image_url text,
  add column if not exists facebook_url text not null default '',
  add column if not exists instagram_url text not null default '';

-- 2) ------------------------------------------------------------------------
alter table public.restaurant_settings
  add column if not exists special_schedule jsonb not null default '[]'::jsonb,
  add column if not exists orders_paused boolean not null default false,
  add column if not exists orders_paused_until timestamptz;

alter table public.restaurant_settings
  drop constraint if exists restaurant_settings_special_schedule_array;
alter table public.restaurant_settings
  add constraint restaurant_settings_special_schedule_array
  check (jsonb_typeof(special_schedule) = 'array');

-- 3) ------------------------------------------------------------------------
create or replace function public.update_restaurant_profile(
  p_restaurant_id uuid,
  p_profile jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.app_role := public.current_user_role();
  v_restaurant public.restaurants%rowtype;
  v_name text := trim(coalesce(p_profile->>'name', ''));
  v_color text := trim(coalesce(p_profile->>'primary_color', ''));
  v_phone text := trim(coalesce(p_profile->>'phone', ''));
  v_address text := trim(coalesce(p_profile->>'address', ''));
  v_logo text := nullif(trim(coalesce(p_profile->>'logo_url', '')), '');
  v_cover text := nullif(trim(coalesce(p_profile->>'cover_image_url', '')), '');
  v_facebook text := trim(coalesce(p_profile->>'facebook_url', ''));
  v_instagram text := trim(coalesce(p_profile->>'instagram_url', ''));
begin
  if auth.uid() is null then
    raise exception 'Acces interzis.';
  end if;

  select * into v_restaurant from public.restaurants where id = p_restaurant_id;
  if not found then
    raise exception 'Restaurant inexistent.';
  end if;

  if not (
    v_role = 'super_admin'
    or (v_role = 'restaurant_owner' and public.current_user_restaurant_id() = p_restaurant_id)
  ) then
    raise exception 'Acces interzis.';
  end if;

  if v_role <> 'super_admin' and (
    v_restaurant.status in ('suspended', 'deleted')
    or (v_restaurant.trial_active and v_restaurant.trial_expires_at is not null
        and v_restaurant.trial_expires_at < now())
  ) then
    raise exception 'Accesul restaurantului este suspendat. Contactează ALL4HORECA pentru reactivare.';
  end if;

  if v_name = '' or length(v_name) > 120 then
    raise exception 'Numele afișat este obligatoriu (maximum 120 de caractere).';
  end if;
  if v_color !~ '^#[0-9A-Fa-f]{6}$' then
    raise exception 'Culoarea principală trebuie să fie în format #RRGGBB.';
  end if;
  if length(v_phone) > 40 or length(v_address) > 300 then
    raise exception 'Telefonul sau adresa sunt prea lungi.';
  end if;
  if v_logo is not null and v_logo !~ '^(https://|/)' then
    raise exception 'Adresa logo-ului nu este validă.';
  end if;
  if v_cover is not null and v_cover !~ '^(https://|/)' then
    raise exception 'Adresa imaginii de copertă nu este validă.';
  end if;
  if (v_facebook <> '' and v_facebook !~* '^https?://') or length(v_facebook) > 300 then
    raise exception 'Link-ul de Facebook trebuie să înceapă cu https://';
  end if;
  if (v_instagram <> '' and v_instagram !~* '^https?://') or length(v_instagram) > 300 then
    raise exception 'Link-ul de Instagram trebuie să înceapă cu https://';
  end if;

  update public.restaurants
     set name = v_name,
         primary_color = v_color,
         phone = v_phone,
         address = v_address,
         logo_url = v_logo,
         cover_image_url = v_cover,
         facebook_url = v_facebook,
         instagram_url = v_instagram
   where id = p_restaurant_id;
end
$$;

revoke all on function public.update_restaurant_profile(uuid, jsonb) from public, anon;
grant execute on function public.update_restaurant_profile(uuid, jsonb) to authenticated;

-- 4) ------------------------------------------------------------------------
-- Înainte: orice utilizator autentificat putea scrie oriunde în cele două bucket-uri.
-- Acum: super_admin oriunde; administratorul doar în folderul <restaurant_id>/...
drop policy if exists "Authenticated uploads restaurant assets" on storage.objects;
drop policy if exists "Authenticated updates restaurant assets" on storage.objects;
drop policy if exists "Authenticated deletes restaurant assets" on storage.objects;
drop policy if exists "Restaurant folder uploads" on storage.objects;
drop policy if exists "Restaurant folder updates" on storage.objects;
drop policy if exists "Restaurant folder deletes" on storage.objects;

create policy "Restaurant folder uploads"
on storage.objects for insert to authenticated
with check (
  bucket_id in ('restaurant-assets', 'product-images')
  and (
    public.current_user_role() = 'super_admin'
    or (
      public.current_user_role() = 'restaurant_owner'
      and (storage.foldername(name))[1] = public.current_user_restaurant_id()::text
    )
  )
);

create policy "Restaurant folder updates"
on storage.objects for update to authenticated
using (
  bucket_id in ('restaurant-assets', 'product-images')
  and (
    public.current_user_role() = 'super_admin'
    or (
      public.current_user_role() = 'restaurant_owner'
      and (storage.foldername(name))[1] = public.current_user_restaurant_id()::text
    )
  )
)
with check (
  bucket_id in ('restaurant-assets', 'product-images')
  and (
    public.current_user_role() = 'super_admin'
    or (
      public.current_user_role() = 'restaurant_owner'
      and (storage.foldername(name))[1] = public.current_user_restaurant_id()::text
    )
  )
);

create policy "Restaurant folder deletes"
on storage.objects for delete to authenticated
using (
  bucket_id in ('restaurant-assets', 'product-images')
  and (
    public.current_user_role() = 'super_admin'
    or (
      public.current_user_role() = 'restaurant_owner'
      and (storage.foldername(name))[1] = public.current_user_restaurant_id()::text
    )
  )
);

-- 5) ------------------------------------------------------------------------
create or replace function public.reject_orders_when_paused()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.restaurant_settings s
    where s.restaurant_id = new.restaurant_id
      and s.orders_paused
      and (s.orders_paused_until is null or s.orders_paused_until > now())
  ) then
    raise exception 'Restaurantul nu primește comenzi momentan.';
  end if;
  return new;
end
$$;

drop trigger if exists orders_reject_when_paused on public.orders;
create trigger orders_reject_when_paused
before insert on public.orders
for each row execute function public.reject_orders_when_paused();
