alter table public.restaurant_settings
  add column if not exists minimum_order_value numeric(10,2) not null default 0 check (minimum_order_value >= 0),
  add column if not exists estimated_delivery_time text not null default '30-45 min',
  add column if not exists block_orders_outside_schedule boolean not null default true,
  add column if not exists weekly_schedule jsonb not null default '[
    {"day":1,"enabled":true,"openingTime":"10:00","closingTime":"23:30"},
    {"day":2,"enabled":true,"openingTime":"10:00","closingTime":"23:30"},
    {"day":3,"enabled":true,"openingTime":"10:00","closingTime":"23:30"},
    {"day":4,"enabled":true,"openingTime":"10:00","closingTime":"23:30"},
    {"day":5,"enabled":true,"openingTime":"10:00","closingTime":"23:30"},
    {"day":6,"enabled":true,"openingTime":"10:00","closingTime":"23:30"},
    {"day":0,"enabled":true,"openingTime":"10:00","closingTime":"23:30"}
  ]'::jsonb;

create table if not exists public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  areas text[] not null default '{}',
  delivery_fee numeric(10,2) not null default 0 check (delivery_fee >= 0),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists delivery_zones_restaurant_sort_idx
  on public.delivery_zones(restaurant_id, sort_order);

alter table public.delivery_zones enable row level security;

grant select on public.delivery_zones to anon, authenticated;
grant insert, update, delete on public.delivery_zones to authenticated;

create policy "Public reads delivery zones"
on public.delivery_zones for select using (true);

create policy "Owners manage delivery zones"
on public.delivery_zones for all to authenticated
using (
  public.current_user_role() = 'super_admin'
  or restaurant_id = public.current_user_restaurant_id()
)
with check (
  public.current_user_role() = 'super_admin'
  or restaurant_id = public.current_user_restaurant_id()
);
