alter table public.restaurants
  add column if not exists company_name text not null default '',
  add column if not exists vat_cui text not null default '',
  add column if not exists city text not null default '',
  add column if not exists contact_name text not null default '',
  add column if not exists contact_phone text not null default '',
  add column if not exists contact_email text not null default '',
  add column if not exists status text not null default 'active'
    check (status in ('trial', 'active', 'suspended', 'deleted')),
  add column if not exists trial_active boolean not null default false,
  add column if not exists trial_started_at timestamptz,
  add column if not exists trial_expires_at timestamptz,
  add column if not exists contract_signed boolean not null default false,
  add column if not exists deleted_at timestamptz;

alter table public.orders
  add column if not exists archived_at timestamptz;

alter table public.customers
  add column if not exists archived_at timestamptz;

create or replace function public.self_onboard_restaurant(
  restaurant_payload jsonb,
  owner_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  created_restaurant_id uuid;
  normalized_slug text;
  trial_start timestamptz := now();
begin
  if not exists (select 1 from auth.users where id = owner_id) then
    raise exception 'Utilizatorul owner nu exista.';
  end if;

  if trim(coalesce(restaurant_payload->>'name', '')) = '' then
    raise exception 'Numele restaurantului este obligatoriu.';
  end if;

  normalized_slug := public.generate_restaurant_slug(
    restaurant_payload->>'name'
  );

  insert into public.restaurants (
    name, slug, logo_url, primary_color, secondary_color, address, phone,
    email, seo_title, seo_description, social_image_url, is_active,
    company_name, vat_cui, city, contact_name, contact_phone, contact_email,
    status, trial_active, trial_started_at, trial_expires_at, contract_signed
  )
  values (
    trim(restaurant_payload->>'name'),
    normalized_slug,
    null,
    coalesce(nullif(restaurant_payload->>'primary_color', ''), '#2563eb'),
    coalesce(nullif(restaurant_payload->>'secondary_color', ''), '#0f172a'),
    coalesce(restaurant_payload->>'address', ''),
    coalesce(restaurant_payload->>'phone', ''),
    coalesce(restaurant_payload->>'email', ''),
    trim(restaurant_payload->>'name') || ' | Comanda online',
    'Comanda online de la ' || trim(restaurant_payload->>'name') || ' prin ALL4HORECA by ANTORIA.',
    null,
    true,
    coalesce(restaurant_payload->>'company_name', ''),
    coalesce(restaurant_payload->>'vat_cui', ''),
    coalesce(restaurant_payload->>'city', ''),
    coalesce(restaurant_payload->>'owner_name', ''),
    coalesce(restaurant_payload->>'phone', ''),
    coalesce(restaurant_payload->>'owner_email', ''),
    'trial',
    true,
    trial_start,
    trial_start + interval '7 days',
    false
  )
  returning id into created_restaurant_id;

  insert into public.restaurant_settings (restaurant_id)
  values (created_restaurant_id)
  on conflict (restaurant_id) do nothing;

  update public.profiles
  set email = coalesce(nullif(restaurant_payload->>'owner_email', ''), email),
      full_name = coalesce(nullif(restaurant_payload->>'owner_name', ''), full_name),
      role = 'restaurant_owner',
      restaurant_id = created_restaurant_id
  where id = owner_id;

  if not found then
    insert into public.profiles (id, email, full_name, role, restaurant_id)
    values (
      owner_id,
      coalesce(restaurant_payload->>'owner_email', ''),
      coalesce(restaurant_payload->>'owner_name', ''),
      'restaurant_owner',
      created_restaurant_id
    );
  end if;

  insert into public.restaurant_qr_codes (restaurant_id, public_url)
  values (created_restaurant_id, '/clienti/' || normalized_slug)
  on conflict (restaurant_id) do update
    set public_url = excluded.public_url,
        updated_at = now();

  perform public.clone_restaurant_template(created_restaurant_id);

  return created_restaurant_id;
end;
$$;

revoke all on function public.self_onboard_restaurant(jsonb, uuid) from public;
grant execute on function public.self_onboard_restaurant(jsonb, uuid) to service_role;

create or replace function public.soft_delete_restaurant(target_restaurant_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_user_role() <> 'super_admin' then
    raise exception 'Acces interzis.';
  end if;

  update public.profiles
  set restaurant_id = null,
      role = 'customer'
  where restaurant_id = target_restaurant_id;

  update public.orders
  set archived_at = coalesce(archived_at, now())
  where restaurant_id = target_restaurant_id;

  update public.customers
  set archived_at = coalesce(archived_at, now())
  where id in (
    select distinct customer_id
    from public.orders
    where restaurant_id = target_restaurant_id
      and customer_id is not null
  );

  update public.restaurants
  set is_active = false,
      status = 'deleted',
      trial_active = false,
      deleted_at = coalesce(deleted_at, now())
  where id = target_restaurant_id;
end;
$$;

revoke all on function public.soft_delete_restaurant(uuid) from public;
grant execute on function public.soft_delete_restaurant(uuid) to authenticated;
