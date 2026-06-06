do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum (
      'customer',
      'restaurant_owner',
      'super_admin'
    );
  end if;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role public.app_role not null default 'customer',
  restaurant_id uuid references public.restaurants(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint restaurant_owner_requires_restaurant check (
    role <> 'restaurant_owner' or restaurant_id is not null
  )
);

alter table public.customers
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create unique index if not exists customers_user_id_unique
  on public.customers(user_id)
  where user_id is not null;
create index if not exists profiles_restaurant_id_idx
  on public.profiles(restaurant_id);

alter table public.profiles enable row level security;

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.current_user_restaurant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select restaurant_id from public.profiles where id = auth.uid()
$$;

create or replace function public.current_user_owns_customer(target_customer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.customers
    where id = target_customer_id and user_id = auth.uid()
  )
$$;

create or replace function public.current_restaurant_has_customer(target_customer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.orders
    where customer_id = target_customer_id
      and restaurant_id = public.current_user_restaurant_id()
  )
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'customer'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop policy if exists "Public can read active restaurants" on public.restaurants;
drop policy if exists "Public can read categories" on public.categories;
drop policy if exists "Public can read products" on public.products;
drop policy if exists "Dashboard can update product availability" on public.products;
drop policy if exists "Dashboard can read customers" on public.customers;
drop policy if exists "Dashboard can read orders" on public.orders;
drop policy if exists "Dashboard can update order status" on public.orders;
drop policy if exists "Dashboard can read order items" on public.order_items;

revoke all on public.customers, public.orders, public.order_items from anon;
revoke update on public.products from anon;

grant select on public.restaurants, public.categories, public.products to anon, authenticated;
grant select, insert, update on public.restaurants to authenticated;
grant select, update on public.products to authenticated;
grant select on public.customers, public.orders, public.order_items to authenticated;
grant update (status) on public.orders to authenticated;
grant select on public.profiles to authenticated;

create policy "Public reads active restaurants"
on public.restaurants for select
using (
  is_active
  or public.current_user_role() = 'super_admin'
  or (
    public.current_user_role() = 'restaurant_owner'
    and id = public.current_user_restaurant_id()
  )
);

create policy "Super admin inserts restaurants"
on public.restaurants for insert to authenticated
with check (public.current_user_role() = 'super_admin');

create policy "Super admin updates restaurants"
on public.restaurants for update to authenticated
using (public.current_user_role() = 'super_admin')
with check (public.current_user_role() = 'super_admin');

create policy "Public reads categories"
on public.categories for select
using (true);

create policy "Public reads products"
on public.products for select
using (true);

create policy "Owners update their products"
on public.products for update to authenticated
using (
  public.current_user_role() = 'super_admin'
  or restaurant_id = public.current_user_restaurant_id()
)
with check (
  public.current_user_role() = 'super_admin'
  or restaurant_id = public.current_user_restaurant_id()
);

create policy "Users read their profile"
on public.profiles for select to authenticated
using (
  id = auth.uid()
  or public.current_user_role() = 'super_admin'
);

create policy "Authorized users read customers"
on public.customers for select to authenticated
using (
  user_id = auth.uid()
  or public.current_user_role() = 'super_admin'
  or public.current_restaurant_has_customer(id)
);

create policy "Authorized users read orders"
on public.orders for select to authenticated
using (
  public.current_user_role() = 'super_admin'
  or restaurant_id = public.current_user_restaurant_id()
  or public.current_user_owns_customer(customer_id)
);

create policy "Owners update their order status"
on public.orders for update to authenticated
using (
  public.current_user_role() = 'super_admin'
  or restaurant_id = public.current_user_restaurant_id()
)
with check (
  public.current_user_role() = 'super_admin'
  or restaurant_id = public.current_user_restaurant_id()
);

create policy "Authorized users read order items"
on public.order_items for select to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
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
  item jsonb;
begin
  if not exists (
    select 1 from public.restaurants
    where id = (order_payload->>'restaurant_id')::uuid
      and is_active = true
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
    );
  end loop;

  return created_order_id;
end;
$$;

revoke all on function public.create_order(jsonb) from public;
grant execute on function public.create_order(jsonb) to anon, authenticated;
