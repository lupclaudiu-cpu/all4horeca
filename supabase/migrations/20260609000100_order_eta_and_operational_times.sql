alter table public.orders
  add column if not exists estimated_minutes integer
    check (estimated_minutes is null or estimated_minutes > 0),
  add column if not exists accepted_at timestamptz,
  add column if not exists preparation_started_at timestamptz,
  add column if not exists delivery_started_at timestamptz,
  add column if not exists completed_at timestamptz;

create or replace function public.set_order_operational_timestamps()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is not distinct from new.status then
    return new;
  end if;

  case new.status
    when 'Acceptată' then
      if new.estimated_minutes is null or new.estimated_minutes <= 0 then
        raise exception 'Timpul estimat este obligatoriu la acceptarea comenzii.';
      end if;
      new.accepted_at := coalesce(old.accepted_at, now());
    when 'În preparare' then
      new.preparation_started_at :=
        coalesce(old.preparation_started_at, now());
    when 'În livrare' then
      new.delivery_started_at := coalesce(old.delivery_started_at, now());
    when 'Finalizată' then
      new.completed_at := coalesce(old.completed_at, now());
    else
      null;
  end case;

  return new;
end;
$$;

drop trigger if exists orders_set_operational_timestamps on public.orders;
create trigger orders_set_operational_timestamps
  before update of status on public.orders
  for each row execute function public.set_order_operational_timestamps();

create or replace function public.transition_order_status(
  order_id_input uuid,
  status_input text,
  estimated_minutes_input integer default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_order public.orders%rowtype;
  actor_role public.app_role;
begin
  if auth.uid() is null then
    raise exception 'Autentificarea este obligatorie.';
  end if;

  actor_role := public.current_user_role();
  if actor_role is null
     or actor_role not in ('restaurant_owner', 'super_admin') then
    raise exception 'Doar restaurantul poate modifica statusul comenzii.';
  end if;

  select *
  into target_order
  from public.orders
  where id = order_id_input
  for update;

  if not found then
    raise exception 'Comanda nu există.';
  end if;

  if actor_role = 'restaurant_owner'
     and target_order.restaurant_id is distinct from
       public.current_user_restaurant_id() then
    raise exception 'Nu ai acces la această comandă.';
  end if;

  if status_input not in (
    'Acceptată',
    'În preparare',
    'În livrare',
    'Finalizată',
    'Anulată'
  ) then
    raise exception 'Status invalid.';
  end if;

  if not (
    (target_order.status = 'Nouă' and status_input in ('Acceptată', 'Anulată'))
    or
    (target_order.status = 'Acceptată' and status_input = 'În preparare')
    or
    (target_order.status = 'În preparare' and status_input = 'În livrare')
    or
    (target_order.status = 'În livrare' and status_input = 'Finalizată')
  ) then
    raise exception 'Tranziția de la % la % nu este permisă.',
      target_order.status,
      status_input;
  end if;

  if status_input = 'Acceptată'
     and coalesce(estimated_minutes_input, 0) <= 0 then
    raise exception 'Timpul estimat este obligatoriu la acceptarea comenzii.';
  end if;

  update public.orders
  set
    status = status_input,
    estimated_minutes = case
      when status_input = 'Acceptată' then estimated_minutes_input
      else estimated_minutes
    end
  where id = order_id_input;
end;
$$;

revoke update (status) on public.orders from anon, authenticated;
revoke all on function public.transition_order_status(uuid, text, integer)
  from public;
grant execute on function public.transition_order_status(uuid, text, integer)
  to authenticated;
