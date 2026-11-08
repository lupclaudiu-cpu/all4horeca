-- 1) Customers must have an account (phone + SMS code) to place an order.
-- 2) The server enforces required option groups and single-choice groups.
-- Wraps the validated create_order (v2) under a new name.
alter function public.create_order(jsonb) rename to create_order_validated;
revoke execute on function public.create_order_validated(jsonb) from public, anon, authenticated;

create or replace function public.create_order(order_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_item jsonb;
  g record;
  v_count integer;
begin
  if auth.uid() is null then
    raise exception 'Trebuie să te autentifici cu numărul de telefon pentru a comanda.';
  end if;

  if jsonb_typeof(order_payload->'items') = 'array' then
    for v_item in select * from jsonb_array_elements(order_payload->'items') loop
      for g in
        select id, name, required, selection_type
        from public.product_option_groups
        where product_id = nullif(v_item->>'product_id', '')::uuid and active = true
      loop
        select count(*) into v_count
        from jsonb_array_elements(coalesce(v_item->'options', '[]'::jsonb)) o
        where o->>'group_id' = g.id::text;
        if g.required and v_count = 0 then
          raise exception 'Alege o opțiune pentru „%".', g.name;
        end if;
        if g.selection_type = 'single' and v_count > 1 then
          raise exception 'Pentru „%" poți alege o singură opțiune.', g.name;
        end if;
      end loop;
    end loop;
  end if;

  return public.create_order_validated(order_payload);
end;
$$;

revoke execute on function public.create_order(jsonb) from public, anon;
grant execute on function public.create_order(jsonb) to authenticated, service_role;
