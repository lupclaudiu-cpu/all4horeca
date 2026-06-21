alter table public.customers
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  label text not null default 'Acasă',
  address text not null,
  latitude double precision,
  longitude double precision,
  place_id text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_addresses_customer_idx
  on public.customer_addresses (customer_id, created_at desc);
create unique index if not exists customer_addresses_single_default_idx
  on public.customer_addresses (customer_id)
  where is_default;

alter table public.customer_addresses enable row level security;
grant select, insert, update, delete on public.customer_addresses
  to authenticated;

create policy "Customers manage their addresses"
on public.customer_addresses for all to authenticated
using (public.current_user_owns_customer(customer_id))
with check (public.current_user_owns_customer(customer_id));

create or replace function public.save_my_customer_profile(
  customer_name_input text,
  customer_phone_input text,
  customer_address_input text default '',
  customer_email_input text default ''
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
  normalized_email text;
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

  normalized_email := nullif(trim(coalesce(customer_email_input, '')), '');

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

  if conflicting_customer.id is not null
    and conflicting_customer.user_id is not null then
    raise exception 'Numărul de telefon este asociat altui cont.';
  end if;

  if existing_customer.id is not null then
    if conflicting_customer.id is not null
      and conflicting_customer.id <> existing_customer.id then
      raise exception 'Numărul de telefon este deja folosit.';
    end if;

    update public.customers
    set
      name = trim(customer_name_input),
      phone = trim(customer_phone_input),
      default_address = trim(coalesce(customer_address_input, '')),
      email = coalesce(
        normalized_email,
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
        normalized_email,
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
      coalesce(
        normalized_email,
        nullif((select email from auth.users where id = auth.uid()), '')
      ),
      auth.uid(),
      trim(coalesce(customer_address_input, ''))
    )
    returning id into resolved_customer_id;
  end if;

  return resolved_customer_id;
end;
$$;

drop function if exists public.save_my_customer_profile(text, text, text);
revoke all on function public.save_my_customer_profile(text, text, text, text)
  from public;
grant execute on function public.save_my_customer_profile(text, text, text, text)
  to authenticated;

create or replace function public.get_my_customer_addresses()
returns table (
  address_id uuid,
  address_label text,
  address_text text,
  latitude double precision,
  longitude double precision,
  place_id text,
  is_default boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    customer_addresses.id,
    customer_addresses.label,
    customer_addresses.address,
    customer_addresses.latitude,
    customer_addresses.longitude,
    customer_addresses.place_id,
    customer_addresses.is_default
  from public.customer_addresses
  join public.customers
    on customers.id = customer_addresses.customer_id
  where customers.user_id = auth.uid()
  order by customer_addresses.is_default desc,
    customer_addresses.created_at desc
$$;

create or replace function public.save_my_customer_address(
  address_id_input uuid,
  address_label_input text,
  address_text_input text,
  latitude_input double precision default null,
  longitude_input double precision default null,
  place_id_input text default null,
  is_default_input boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_customer_id uuid;
  resolved_address_id uuid;
begin
  select id into resolved_customer_id
  from public.customers
  where user_id = auth.uid()
  order by updated_at desc
  limit 1;

  if resolved_customer_id is null then
    raise exception 'Salvează mai întâi datele personale.';
  end if;
  if length(trim(coalesce(address_text_input, ''))) < 5 then
    raise exception 'Adresa este invalidă.';
  end if;

  if is_default_input then
    update public.customer_addresses
    set is_default = false, updated_at = now()
    where customer_id = resolved_customer_id;
  end if;

  if address_id_input is null then
    insert into public.customer_addresses (
      customer_id, label, address, latitude, longitude, place_id, is_default
    )
    values (
      resolved_customer_id,
      coalesce(nullif(trim(address_label_input), ''), 'Acasă'),
      trim(address_text_input),
      latitude_input,
      longitude_input,
      nullif(trim(coalesce(place_id_input, '')), ''),
      is_default_input
    )
    returning id into resolved_address_id;
  else
    update public.customer_addresses
    set
      label = coalesce(nullif(trim(address_label_input), ''), 'Acasă'),
      address = trim(address_text_input),
      latitude = latitude_input,
      longitude = longitude_input,
      place_id = nullif(trim(coalesce(place_id_input, '')), ''),
      is_default = is_default_input,
      updated_at = now()
    where id = address_id_input
      and customer_id = resolved_customer_id
    returning id into resolved_address_id;
  end if;

  if resolved_address_id is null then
    raise exception 'Adresa nu a putut fi salvată.';
  end if;

  update public.customers
  set
    default_address = case
      when is_default_input then trim(address_text_input)
      else default_address
    end,
    updated_at = now()
  where id = resolved_customer_id;

  return resolved_address_id;
end;
$$;

create or replace function public.delete_my_customer_address(
  address_id_input uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  was_default boolean;
  resolved_customer_id uuid;
begin
  select customer_addresses.customer_id, customer_addresses.is_default
  into resolved_customer_id, was_default
  from public.customer_addresses
  join public.customers on customers.id = customer_addresses.customer_id
  where customer_addresses.id = address_id_input
    and customers.user_id = auth.uid();

  if resolved_customer_id is null then
    raise exception 'Adresa nu există.';
  end if;

  delete from public.customer_addresses where id = address_id_input;

  if was_default then
    update public.customers
    set default_address = '', updated_at = now()
    where id = resolved_customer_id;
  end if;
end;
$$;

revoke all on function public.get_my_customer_addresses() from public;
revoke all on function public.save_my_customer_address(
  uuid, text, text, double precision, double precision, text, boolean
) from public;
revoke all on function public.delete_my_customer_address(uuid) from public;
grant execute on function public.get_my_customer_addresses() to authenticated;
grant execute on function public.save_my_customer_address(
  uuid, text, text, double precision, double precision, text, boolean
) to authenticated;
grant execute on function public.delete_my_customer_address(uuid)
  to authenticated;

alter table public.promotions
  add column if not exists valid_from date,
  add column if not exists valid_until date;
