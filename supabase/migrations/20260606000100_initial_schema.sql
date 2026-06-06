create extension if not exists pgcrypto;

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  primary_color text not null default '#ff5a1f',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  unique (restaurant_id, name)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  description text not null default '',
  image_url text,
  price numeric(10, 2) not null check (price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  customer_id uuid not null references public.customers(id) on delete restrict,
  order_number text not null unique,
  total numeric(10, 2) not null check (total >= 0),
  payment_method text not null check (payment_method in ('cash', 'card')),
  delivery_address text not null,
  notes text not null default '',
  status text not null default 'Nouă'
    check (status in ('Nouă', 'Acceptată', 'În preparare', 'În livrare', 'Finalizată', 'Anulată')),
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  line_total numeric(10, 2) not null check (line_total >= 0)
);

create index if not exists categories_restaurant_id_idx on public.categories(restaurant_id);
create index if not exists products_restaurant_id_idx on public.products(restaurant_id);
create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists orders_restaurant_id_created_at_idx on public.orders(restaurant_id, created_at desc);
create index if not exists orders_customer_id_idx on public.orders(customer_id);
create index if not exists order_items_order_id_idx on public.order_items(order_id);

alter table public.restaurants enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

grant select on public.restaurants, public.categories, public.products to anon;
grant update (active) on public.products to anon;
grant select on public.customers, public.orders, public.order_items to anon;
grant update (status) on public.orders to anon;

create policy "Public can read active restaurants"
on public.restaurants for select to anon
using (is_active = true);

create policy "Public can read categories"
on public.categories for select to anon
using (true);

create policy "Public can read products"
on public.products for select to anon
using (true);

create policy "Dashboard can update product availability"
on public.products for update to anon
using (true)
with check (true);

-- Temporary MVP policies. Replace with authenticated restaurant-owner policies.
create policy "Dashboard can read customers"
on public.customers for select to anon
using (true);

create policy "Dashboard can read orders"
on public.orders for select to anon
using (true);

create policy "Dashboard can update order status"
on public.orders for update to anon
using (true)
with check (true);

create policy "Dashboard can read order items"
on public.order_items for select to anon
using (true);

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
  insert into public.customers (name, phone, email)
  values (
    trim(order_payload->'customer'->>'name'),
    trim(order_payload->'customer'->>'phone'),
    nullif(trim(order_payload->'customer'->>'email'), '')
  )
  on conflict (phone) do update
    set name = excluded.name,
        email = coalesce(excluded.email, public.customers.email)
  returning id into resolved_customer_id;

  insert into public.orders (
    restaurant_id,
    customer_id,
    order_number,
    total,
    payment_method,
    delivery_address,
    notes,
    status
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
      order_id,
      product_id,
      product_name,
      quantity,
      unit_price,
      line_total
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
grant execute on function public.create_order(jsonb) to anon;
