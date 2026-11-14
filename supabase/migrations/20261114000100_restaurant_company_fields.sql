-- Administratorul poate completa denumirea firmei, CUI, orașul și emailul de contact (folosite în documentele legale ale meniului).
-- Aceleași reguli de acces ca la profil; câmpurile se actualizează doar când cheia 'company_name' e trimisă.

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
  -- Datele firmei: se modifică doar când cheia e trimisă (clienții vechi nu le șterg).
  v_has_company boolean := p_profile ? 'company_name';
  v_company text := trim(coalesce(p_profile->>'company_name', ''));
  v_cui text := trim(coalesce(p_profile->>'vat_cui', ''));
  v_city text := trim(coalesce(p_profile->>'city', ''));
  v_email text := trim(coalesce(p_profile->>'email', ''));
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

  if v_has_company then
    if length(v_company) > 150 or length(v_cui) > 30 or length(v_city) > 80 or length(v_email) > 120 then
      raise exception 'Datele firmei sunt prea lungi.';
    end if;
    if v_email <> '' and v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
      raise exception 'Emailul de contact nu este valid.';
    end if;
  end if;

  update public.restaurants
     set name = v_name,
         primary_color = v_color,
         phone = v_phone,
         address = v_address,
         logo_url = v_logo,
         cover_image_url = v_cover,
         facebook_url = v_facebook,
         instagram_url = v_instagram,
         company_name = case when v_has_company then v_company else company_name end,
         vat_cui = case when v_has_company then v_cui else vat_cui end,
         city = case when v_has_company then v_city else city end,
         email = case when v_has_company then v_email else email end
   where id = p_restaurant_id;
end
$$;

revoke all on function public.update_restaurant_profile(uuid, jsonb) from public, anon;
grant execute on function public.update_restaurant_profile(uuid, jsonb) to authenticated;
