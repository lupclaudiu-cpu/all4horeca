create or replace function public.onboard_restaurant(
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
  resolved_working_days integer[];
begin
  if public.current_user_role() <> 'super_admin' then
    raise exception 'Acces interzis.';
  end if;

  if not exists (select 1 from auth.users where id = owner_id) then
    raise exception 'Utilizatorul owner nu exista.';
  end if;

  normalized_slug := trim(restaurant_payload->>'slug');
  if normalized_slug = '' then
    raise exception 'Slug-ul restaurantului este obligatoriu.';
  end if;

  select coalesce(array_agg(value::integer), array[1,2,3,4,5,6,0])
  into resolved_working_days
  from jsonb_array_elements_text(
    coalesce(restaurant_payload->'working_days', '[1,2,3,4,5,6,0]'::jsonb)
  );

  insert into public.restaurants (
    name, slug, logo_url, primary_color, secondary_color, address, phone,
    email, seo_title, seo_description, social_image_url, is_active
  )
  values (
    trim(restaurant_payload->>'name'),
    normalized_slug,
    nullif(restaurant_payload->>'logo_url', ''),
    coalesce(nullif(restaurant_payload->>'primary_color', ''), '#ff5a1f'),
    coalesce(nullif(restaurant_payload->>'secondary_color', ''), '#171411'),
    coalesce(restaurant_payload->>'address', ''),
    coalesce(restaurant_payload->>'phone', ''),
    coalesce(restaurant_payload->>'email', ''),
    coalesce(
      nullif(restaurant_payload->>'seo_title', ''),
      trim(restaurant_payload->>'name') || ' | Comanda online'
    ),
    coalesce(
      nullif(restaurant_payload->>'seo_description', ''),
      'Comanda online de la ' || trim(restaurant_payload->>'name') || ' prin ALL4HORECA.'
    ),
    nullif(restaurant_payload->>'social_image_url', ''),
    true
  )
  returning id into created_restaurant_id;

  insert into public.restaurant_settings (
    restaurant_id, opening_time, closing_time, working_days,
    accepts_delivery, accepts_pickup, accepts_cash, accepts_card,
    delivery_fee, free_delivery_threshold
  )
  values (
    created_restaurant_id,
    coalesce(nullif(restaurant_payload->>'opening_time', '')::time, '10:00'::time),
    coalesce(nullif(restaurant_payload->>'closing_time', '')::time, '23:30'::time),
    resolved_working_days,
    coalesce((restaurant_payload->>'accepts_delivery')::boolean, true),
    coalesce((restaurant_payload->>'accepts_pickup')::boolean, true),
    coalesce((restaurant_payload->>'accepts_cash')::boolean, true),
    coalesce((restaurant_payload->>'accepts_card')::boolean, true),
    coalesce((restaurant_payload->>'delivery_fee')::numeric, 10),
    coalesce((restaurant_payload->>'free_delivery_threshold')::numeric, 100)
  );

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
  values (created_restaurant_id, '/r/' || normalized_slug)
  on conflict (restaurant_id) do update
    set public_url = excluded.public_url,
        updated_at = now();

  return created_restaurant_id;
end;
$$;

revoke all on function public.onboard_restaurant(jsonb, uuid) from public;
grant execute on function public.onboard_restaurant(jsonb, uuid) to authenticated;

update public.restaurants
set seo_title = name || ' | Comanda online'
where trim(coalesce(seo_title, '')) = '';

update public.restaurants
set seo_description = 'Comanda online de la ' || name || ' prin ALL4HORECA.'
where trim(coalesce(seo_description, '')) = '';

insert into public.restaurant_qr_codes (restaurant_id, public_url)
select id, '/r/' || slug
from public.restaurants
on conflict (restaurant_id) do update
  set public_url = excluded.public_url,
      updated_at = now();

comment on constraint product_recommendations_product_id_fkey
  on public.product_recommendations is
  'Relationship used for recommendations owned by a product.';

comment on constraint product_recommendations_recommended_product_id_fkey
  on public.product_recommendations is
  'Relationship used for products referenced as recommendations.';
