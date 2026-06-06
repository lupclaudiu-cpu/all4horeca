create table if not exists public.product_option_groups (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  selection_type text not null check (selection_type in ('single', 'multiple')),
  required boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.product_options (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.product_option_groups(id) on delete cascade,
  name text not null,
  price_delta numeric(10,2) not null default 0,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.order_item_options (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  option_group_id uuid references public.product_option_groups(id) on delete set null,
  option_id uuid references public.product_options(id) on delete set null,
  group_name text not null,
  option_name text not null,
  price_delta numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists product_option_groups_product_idx
  on public.product_option_groups(product_id, sort_order);
create index if not exists product_options_group_idx
  on public.product_options(group_id, sort_order);
create index if not exists order_item_options_item_idx
  on public.order_item_options(order_item_id);

alter table public.product_option_groups enable row level security;
alter table public.product_options enable row level security;
alter table public.order_item_options enable row level security;

grant select on public.product_option_groups, public.product_options to anon, authenticated;
grant insert, update, delete on public.product_option_groups, public.product_options to authenticated;
grant select on public.order_item_options to authenticated;

create policy "Public reads active option groups"
on public.product_option_groups for select
using (
  active
  or public.current_user_role() = 'super_admin'
  or exists (
    select 1 from public.products
    where products.id = product_option_groups.product_id
      and products.restaurant_id = public.current_user_restaurant_id()
  )
);

create policy "Owners manage option groups"
on public.product_option_groups for all to authenticated
using (
  public.current_user_role() = 'super_admin'
  or exists (
    select 1 from public.products
    where products.id = product_option_groups.product_id
      and products.restaurant_id = public.current_user_restaurant_id()
  )
)
with check (
  public.current_user_role() = 'super_admin'
  or exists (
    select 1 from public.products
    where products.id = product_option_groups.product_id
      and products.restaurant_id = public.current_user_restaurant_id()
  )
);

create policy "Public reads active product options"
on public.product_options for select
using (
  active
  or public.current_user_role() = 'super_admin'
  or exists (
    select 1
    from public.product_option_groups groups
    join public.products on products.id = groups.product_id
    where groups.id = product_options.group_id
      and products.restaurant_id = public.current_user_restaurant_id()
  )
);

create policy "Owners manage product options"
on public.product_options for all to authenticated
using (
  public.current_user_role() = 'super_admin'
  or exists (
    select 1
    from public.product_option_groups groups
    join public.products on products.id = groups.product_id
    where groups.id = product_options.group_id
      and products.restaurant_id = public.current_user_restaurant_id()
  )
)
with check (
  public.current_user_role() = 'super_admin'
  or exists (
    select 1
    from public.product_option_groups groups
    join public.products on products.id = groups.product_id
    where groups.id = product_options.group_id
      and products.restaurant_id = public.current_user_restaurant_id()
  )
);

create policy "Authorized users read ordered options"
on public.order_item_options for select to authenticated
using (
  exists (
    select 1
    from public.order_items
    join public.orders on orders.id = order_items.order_id
    where order_items.id = order_item_options.order_item_id
      and (
        public.current_user_role() = 'super_admin'
        or orders.restaurant_id = public.current_user_restaurant_id()
        or public.current_user_owns_customer(orders.customer_id)
      )
  )
);

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
        order_item_id, option_group_id, option_id,
        group_name, option_name, price_delta
      )
      values (
        created_order_item_id,
        nullif(selected_option->>'group_id', '')::uuid,
        nullif(selected_option->>'option_id', '')::uuid,
        selected_option->>'group_name',
        selected_option->>'option_name',
        (selected_option->>'price_delta')::numeric
      );
    end loop;
  end loop;

  return created_order_id;
end;
$$;

revoke all on function public.create_order(jsonb) from public;
grant execute on function public.create_order(jsonb) to anon, authenticated;
