create table if not exists public.order_status_changes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.restaurant_settings
  add column if not exists notifications_enabled boolean not null default true,
  add column if not exists sound_enabled boolean not null default true,
  add column if not exists highlight_delayed_orders boolean not null default true;

create index if not exists order_status_changes_restaurant_created_idx
  on public.order_status_changes(restaurant_id, created_at desc);
create index if not exists order_status_changes_order_idx
  on public.order_status_changes(order_id, created_at desc);

alter table public.order_status_changes enable row level security;

grant select on public.order_status_changes to authenticated;

create policy "Authorized users read order status changes"
on public.order_status_changes for select to authenticated
using (
  public.current_user_role() = 'super_admin'
  or restaurant_id = public.current_user_restaurant_id()
  or exists (
    select 1
    from public.orders
    where orders.id = order_status_changes.order_id
      and public.current_user_owns_customer(orders.customer_id)
  )
);

create or replace function public.log_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    insert into public.order_status_changes (
      order_id,
      restaurant_id,
      old_status,
      new_status,
      changed_by
    )
    values (
      new.id,
      new.restaurant_id,
      old.status,
      new.status,
      auth.uid()
    );
  end if;
  return new;
end;
$$;

drop trigger if exists orders_log_status_change on public.orders;
create trigger orders_log_status_change
  after update of status on public.orders
  for each row execute function public.log_order_status_change();

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'order_status_changes'
  ) then
    alter publication supabase_realtime add table public.order_status_changes;
  end if;
end
$$;
