alter table public.product_options
  add column if not exists multiply_by_product_quantity boolean not null default false;

alter table public.order_item_options
  add column if not exists quantity integer not null default 1
    check (quantity > 0),
  add column if not exists multiply_by_product_quantity boolean not null default false;

create or replace function public.create_order(order_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_customer_id uuid;
  created_order_id uuid;
  created_order_item_id uuid;
  item jsonb;
  selected_option jsonb;
begin
  if not exists (
    select 1 from public.restaurants
    where id = (order_payload->>'restaurant_id')::uuid and is_active = true
  ) then
    raise exception 'Restaurantul nu este activ.';
  end if;

  insert into public.customers (name, phone, email, user_id)
  values (
    trim(order_payload->'customer'->>'name'),
    trim(order_payload->'customer'->>'phone'),
    nullif(trim(order_payload->'customer'->>'email'), ''),
    auth.uid()
  )
  on conflict (phone) do update
    set name = excluded.name,
        email = coalesce(excluded.email, public.customers.email),
        user_id = coalesce(public.customers.user_id, excluded.user_id)
  returning id into resolved_customer_id;

  insert into public.orders (
    restaurant_id, customer_id, order_number, total, payment_method,
    delivery_address, notes, status
  )
  values (
    (order_payload->>'restaurant_id')::uuid,
    resolved_customer_id,
    order_payload->>'order_number',
    (order_payload->>'total')::numeric,
    order_payload->>'payment_method',
    order_payload->>'delivery_address',
    coalesce(order_payload->>'notes', ''),
    'Nouă'
  )
  returning id into created_order_id;

  for item in select * from jsonb_array_elements(order_payload->'items')
  loop
    insert into public.order_items (
      order_id, product_id, product_name, quantity, unit_price, line_total
    )
    values (
      created_order_id,
      nullif(item->>'product_id', '')::uuid,
      item->>'product_name',
      (item->>'quantity')::integer,
      (item->>'unit_price')::numeric,
      (item->>'line_total')::numeric
    )
    returning id into created_order_item_id;

    for selected_option in
      select * from jsonb_array_elements(coalesce(item->'options', '[]'::jsonb))
    loop
      insert into public.order_item_options (
        order_item_id, option_group_id, option_id, group_name, option_name,
        price_delta, quantity, multiply_by_product_quantity
      )
      values (
        created_order_item_id,
        nullif(selected_option->>'group_id', '')::uuid,
        nullif(selected_option->>'option_id', '')::uuid,
        selected_option->>'group_name',
        selected_option->>'option_name',
        (selected_option->>'price_delta')::numeric,
        greatest(coalesce((selected_option->>'quantity')::integer, 1), 1),
        coalesce(
          (selected_option->>'multiply_by_product_quantity')::boolean,
          false
        )
      );
    end loop;
  end loop;

  return created_order_id;
end;
$$;

revoke all on function public.create_order(jsonb) from public;
grant execute on function public.create_order(jsonb) to anon, authenticated;
