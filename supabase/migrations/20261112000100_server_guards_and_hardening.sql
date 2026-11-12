-- Garduri pe server + întărire securitate (NEAPLICATĂ până la aprobarea lui Claudiu).
--
-- 1) Comenzile noi sunt refuzate de server pentru restaurante suspendate/șterse,
--    cu testarea expirată sau aflate în testare (acolo comandă doar contul de test).
-- 2) Numerele de comandă pot începe cu A4H- (în loc de ANT-); ANT- rămâne acceptat
--    ca aplicațiile deschise cu versiunea veche să nu se strice.
-- 3) self_onboard_restaurant poate fi apelată doar de serviciul server (/api/owner/register),
--    nu direct de orice utilizator autentificat.
-- 4) Funcția de tip trigger nu mai este apelabilă prin API.

-- 1) ------------------------------------------------------------------------
create or replace function public.reject_orders_when_restaurant_blocked()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_restaurant public.restaurants%rowtype;
  v_is_test_account boolean := false;
begin
  select * into v_restaurant from public.restaurants where id = new.restaurant_id;
  if not found then
    return new;
  end if;

  if v_restaurant.status in ('suspended', 'deleted')
     or (v_restaurant.trial_active
         and v_restaurant.trial_expires_at is not null
         and v_restaurant.trial_expires_at < now()) then
    raise exception 'Restaurantul nu poate primi comenzi online momentan.';
  end if;

  if v_restaurant.status = 'trial' and auth.uid() is not null then
    select exists (
      select 1 from auth.users where id = auth.uid() and phone = '40770111111'
    ) into v_is_test_account;
    if not v_is_test_account then
      raise exception 'Restaurantul este în perioadă de testare și nu primește încă comenzi reale.';
    end if;
  end if;

  return new;
end
$$;

revoke all on function public.reject_orders_when_restaurant_blocked() from public, anon, authenticated;

drop trigger if exists orders_reject_when_restaurant_blocked on public.orders;
create trigger orders_reject_when_restaurant_blocked
before insert on public.orders
for each row execute function public.reject_orders_when_restaurant_blocked();

-- 2) ------------------------------------------------------------------------
do $patch$
declare
  v_def text;
  v_new text;
begin
  v_def := pg_get_functiondef('public.create_order_validated(jsonb)'::regprocedure);
  if position('(ANT|A4H)' in v_def) > 0 then
    return;
  end if;
  v_new := replace(
    v_def,
    '^ANT-[0-9]{6}-[0-9]{4}$',
    '^(ANT|A4H)-[0-9]{6}-[0-9]{4}$'
  );
  if v_new = v_def then
    raise exception 'Nu am găsit formatul numărului de comandă în create_order_validated.';
  end if;
  execute v_new;
end
$patch$;

-- 3) ------------------------------------------------------------------------
revoke all on function public.self_onboard_restaurant(jsonb, uuid) from public, anon, authenticated;
grant execute on function public.self_onboard_restaurant(jsonb, uuid) to service_role;

-- 4) ------------------------------------------------------------------------
revoke all on function public.reject_orders_when_paused() from public, anon, authenticated;
