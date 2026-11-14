-- În perioada de probă pot comanda: contul de test (0770 111 111) și
-- administratorul restaurantului respectiv. Restul rămân blocați.
create or replace function public.reject_orders_when_restaurant_blocked()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_restaurant public.restaurants%rowtype;
  v_allowed boolean := false;
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
    ) or exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role = 'restaurant_owner'
        and restaurant_id = new.restaurant_id
    ) into v_allowed;
    if not v_allowed then
      raise exception 'Restaurantul este în perioadă de testare și nu primește încă comenzi reale.';
    end if;
  end if;

  return new;
end
$$;

revoke all on function public.reject_orders_when_restaurant_blocked() from public, anon, authenticated;
