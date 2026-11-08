-- Rulează DUPĂ 0400 (valoarea nouă din enum trebuie comisă înainte de folosire).
-- 1) Personalul trebuie să aparțină unui restaurant.
alter table public.profiles drop constraint if exists restaurant_owner_requires_restaurant;
alter table public.profiles add constraint restaurant_owner_requires_restaurant check (
  role not in ('restaurant_owner', 'restaurant_staff') or restaurant_id is not null
);

-- 2) Politici RESTRICTIVE: personalul nu poate scrie în tabelele de configurare
--    (politicile existente permit scrierea oricui are restaurant_id-ul potrivit).
do $$
declare
  t text;
  c text;
begin
  foreach t in array array[
    'categories','delivery_zones','product_images','product_option_groups','product_options',
    'product_recommendations','products','promotion_products','promotions','restaurant_qr_codes',
    'restaurant_settings','restaurants','notification_campaigns'
  ] loop
    if to_regclass('public.' || t) is null then continue; end if;
    foreach c in array array['insert','update','delete'] loop
      execute format('drop policy if exists %I on public.%I', 'Staff cannot ' || c || ' ' || t, t);
      execute format(
        'create policy %I on public.%I as restrictive for %s to authenticated %s',
        'Staff cannot ' || c || ' ' || t, t, c,
        case c
          when 'insert' then 'with check (public.current_user_role() is distinct from ''restaurant_staff''::public.app_role)'
          when 'update' then 'using (public.current_user_role() is distinct from ''restaurant_staff''::public.app_role) with check (public.current_user_role() is distinct from ''restaurant_staff''::public.app_role)'
          else 'using (public.current_user_role() is distinct from ''restaurant_staff''::public.app_role)'
        end
      );
    end loop;
  end loop;
end
$$;

-- 3) Singura modificare permisă personalului în meniu: marcarea unui produs ca epuizat.
create or replace function public.set_product_sold_out(p_product_id uuid, p_sold_out boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_restaurant uuid;
begin
  select restaurant_id into v_restaurant from public.products where id = p_product_id;
  if v_restaurant is null then
    raise exception 'Produs inexistent';
  end if;
  if not (
    public.current_user_role() = 'super_admin'
    or (
      public.current_user_role() in ('restaurant_owner', 'restaurant_staff')
      and public.current_user_restaurant_id() = v_restaurant
    )
  ) then
    raise exception 'Acces interzis';
  end if;
  update public.products set sold_out = p_sold_out where id = p_product_id;
end
$$;

revoke all on function public.set_product_sold_out(uuid, boolean) from public, anon;
grant execute on function public.set_product_sold_out(uuid, boolean) to authenticated;
