-- Customers must have an account (phone + SMS code) to place an order.
-- Applied by wrapping the existing create_order: reject calls without a signed-in user,
-- then run the validated logic (create_order_v2 body) under a new name.
alter function public.create_order(jsonb) rename to create_order_validated;
revoke execute on function public.create_order_validated(jsonb) from public, anon, authenticated;

create or replace function public.create_order(order_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null then
    raise exception 'Trebuie să te autentifici cu numărul de telefon pentru a comanda.';
  end if;
  return public.create_order_validated(order_payload);
end;
$$;

revoke execute on function public.create_order(jsonb) from public, anon;
grant execute on function public.create_order(jsonb) to authenticated, service_role;
