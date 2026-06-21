alter table public.customers
  add column if not exists default_address text not null default '',
  add column if not exists updated_at timestamptz not null default now();

grant select on public.promotions, public.promotion_products to anon;

drop policy if exists "Public reads active promotions" on public.promotions;
create policy "Public reads active promotions"
on public.promotions for select
using (active = true);

drop policy if exists "Public reads active promotion products"
  on public.promotion_products;
create policy "Public reads active promotion products"
on public.promotion_products for select
using (
  exists (
    select 1
    from public.promotions
    where promotions.id = promotion_products.promotion_id
      and promotions.active = true
  )
);

create or replace function public.get_my_customer_profile()
returns table (
  customer_id uuid,
  customer_name text,
  customer_phone text,
  customer_email text,
  customer_address text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    customers.id,
    customers.name,
    customers.phone,
    coalesce(customers.email, ''),
    customers.default_address
  from public.customers
  where customers.user_id = auth.uid()
  order by customers.updated_at desc
  limit 1
$$;

create or replace function public.save_my_customer_profile(
  customer_name_input text,
  customer_phone_input text,
  customer_address_input text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_customer public.customers%rowtype;
  conflicting_customer public.customers%rowtype;
  resolved_customer_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Autentificarea este obligatorie.';
  end if;

  if length(trim(coalesce(customer_name_input, ''))) < 2 then
    raise exception 'Numele clientului este invalid.';
  end if;

  if length(trim(coalesce(customer_phone_input, ''))) < 8 then
    raise exception 'Numărul de telefon este invalid.';
  end if;

  select *
  into existing_customer
  from public.customers
  where user_id = auth.uid()
  order by updated_at desc
  limit 1;

  select *
  into conflicting_customer
  from public.customers
  where phone = trim(customer_phone_input)
    and (user_id is null or user_id <> auth.uid())
  limit 1;

  if found and conflicting_customer.user_id is not null then
    raise exception 'Numărul de telefon este asociat altui cont.';
  end if;

  if existing_customer.id is not null then
    update public.customers
    set
      name = trim(customer_name_input),
      phone = trim(customer_phone_input),
      default_address = trim(coalesce(customer_address_input, '')),
      email = coalesce(
        nullif((select email from auth.users where id = auth.uid()), ''),
        email
      ),
      updated_at = now()
    where id = existing_customer.id
    returning id into resolved_customer_id;
  elsif conflicting_customer.id is not null then
    update public.customers
    set
      name = trim(customer_name_input),
      user_id = auth.uid(),
      default_address = trim(coalesce(customer_address_input, '')),
      email = coalesce(
        nullif((select email from auth.users where id = auth.uid()), ''),
        email
      ),
      updated_at = now()
    where id = conflicting_customer.id
    returning id into resolved_customer_id;
  else
    insert into public.customers (
      name,
      phone,
      email,
      user_id,
      default_address
    )
    values (
      trim(customer_name_input),
      trim(customer_phone_input),
      (select email from auth.users where id = auth.uid()),
      auth.uid(),
      trim(coalesce(customer_address_input, ''))
    )
    returning id into resolved_customer_id;
  end if;

  return resolved_customer_id;
end;
$$;

revoke all on function public.get_my_customer_profile() from public;
revoke all on function public.save_my_customer_profile(text, text, text)
  from public;
grant execute on function public.get_my_customer_profile() to authenticated;
grant execute on function public.save_my_customer_profile(text, text, text)
  to authenticated;

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id)
    on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth_secret text not null,
  user_agent text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, endpoint)
);

create index if not exists push_subscriptions_restaurant_active_idx
  on public.push_subscriptions (restaurant_id, active);
create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;
grant select, insert, update, delete on public.push_subscriptions
  to authenticated;

create policy "Customers manage their push subscriptions"
on public.push_subscriptions for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Restaurants read their push subscriptions"
on public.push_subscriptions for select to authenticated
using (
  public.current_user_role() = 'super_admin'
  or restaurant_id = public.current_user_restaurant_id()
);

create table if not exists public.notification_campaigns (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id)
    on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  title text not null,
  body text not null,
  target_url text not null default '/',
  delivered_count integer not null default 0,
  failed_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists notification_campaigns_restaurant_created_idx
  on public.notification_campaigns (restaurant_id, created_at desc);

alter table public.notification_campaigns enable row level security;
grant select, insert on public.notification_campaigns to authenticated;

create policy "Restaurants read notification campaigns"
on public.notification_campaigns for select to authenticated
using (
  public.current_user_role() = 'super_admin'
  or restaurant_id = public.current_user_restaurant_id()
);

create policy "Restaurants create notification campaigns"
on public.notification_campaigns for insert to authenticated
with check (
  actor_id = auth.uid()
  and (
    public.current_user_role() = 'super_admin'
    or restaurant_id = public.current_user_restaurant_id()
  )
);
