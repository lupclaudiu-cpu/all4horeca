-- Lets a guest (no account) see the live status of their own orders.
-- The order id (random UUID kept in the customer's browser) acts as the secret.
create or replace function public.get_order_tracking(order_ids uuid[])
returns table (
  id uuid,
  status text,
  estimated_minutes integer,
  accepted_at timestamptz,
  preparation_started_at timestamptz,
  delivery_started_at timestamptz,
  completed_at timestamptz
)
language sql
security definer
set search_path to 'public'
as $$
  select o.id, o.status, o.estimated_minutes, o.accepted_at,
         o.preparation_started_at, o.delivery_started_at, o.completed_at
  from public.orders o
  where o.id = any (order_ids[1:20]);
$$;

revoke execute on function public.get_order_tracking(uuid[]) from public;
grant execute on function public.get_order_tracking(uuid[]) to anon, authenticated, service_role;
