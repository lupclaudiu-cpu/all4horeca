create extension if not exists unaccent;

alter table public.restaurants
  add column if not exists is_onboarding_template boolean not null default false;

insert into public.restaurants (
  id, name, slug, logo_url, primary_color, secondary_color, is_active
)
values (
  '11111111-1111-4111-8111-111111111111',
  'ALL4HORECA',
  'all4horeca',
  '/icons/icon-192.png',
  '#ff5a1f',
  '#171411',
  true
)
on conflict (id) do update set
  name = excluded.name,
  logo_url = excluded.logo_url,
  primary_color = excluded.primary_color,
  secondary_color = excluded.secondary_color,
  is_active = excluded.is_active;

update public.restaurants
set is_onboarding_template = true
where id = '11111111-1111-4111-8111-111111111111'
   or slug = 'all4horeca';

create unique index if not exists restaurants_single_onboarding_template_idx
  on public.restaurants (is_onboarding_template)
  where is_onboarding_template;

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  description text not null default '',
  promotion_type text not null check (
    promotion_type in ('first_order', 'loyalty', 'product_discount', 'happy_hour', 'custom')
  ),
  discount_percent numeric(5,2) not null default 0 check (
    discount_percent >= 0 and discount_percent <= 100
  ),
  trigger_order_number integer check (trigger_order_number is null or trigger_order_number > 0),
  starts_at time,
  ends_at time,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.promotion_products (
  promotion_id uuid not null references public.promotions(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  primary key (promotion_id, product_id)
);

create index if not exists promotions_restaurant_sort_idx
  on public.promotions (restaurant_id, sort_order, created_at);
create index if not exists promotion_products_product_idx
  on public.promotion_products (product_id);

alter table public.promotions enable row level security;
alter table public.promotion_products enable row level security;

grant select, insert, update, delete on public.promotions to authenticated;
grant select, insert, update, delete on public.promotion_products to authenticated;

create policy "Owners read promotions"
on public.promotions for select to authenticated
using (
  public.current_user_role() = 'super_admin'
  or restaurant_id = public.current_user_restaurant_id()
);

create policy "Owners create promotions"
on public.promotions for insert to authenticated
with check (
  public.current_user_role() = 'super_admin'
  or restaurant_id = public.current_user_restaurant_id()
);

create policy "Owners update promotions"
on public.promotions for update to authenticated
using (
  public.current_user_role() = 'super_admin'
  or restaurant_id = public.current_user_restaurant_id()
)
with check (
  public.current_user_role() = 'super_admin'
  or restaurant_id = public.current_user_restaurant_id()
);

create policy "Owners delete promotions"
on public.promotions for delete to authenticated
using (
  public.current_user_role() = 'super_admin'
  or restaurant_id = public.current_user_restaurant_id()
);

create policy "Owners read promotion products"
on public.promotion_products for select to authenticated
using (
  exists (
    select 1
    from public.promotions
    where promotions.id = promotion_products.promotion_id
      and (
        public.current_user_role() = 'super_admin'
        or promotions.restaurant_id = public.current_user_restaurant_id()
      )
  )
);

create policy "Owners create promotion products"
on public.promotion_products for insert to authenticated
with check (
  exists (
    select 1
    from public.promotions
    join public.products on products.id = promotion_products.product_id
    where promotions.id = promotion_products.promotion_id
      and promotions.restaurant_id = products.restaurant_id
      and (
        public.current_user_role() = 'super_admin'
        or promotions.restaurant_id = public.current_user_restaurant_id()
      )
  )
);

create policy "Owners delete promotion products"
on public.promotion_products for delete to authenticated
using (
  exists (
    select 1
    from public.promotions
    where promotions.id = promotion_products.promotion_id
      and (
        public.current_user_role() = 'super_admin'
        or promotions.restaurant_id = public.current_user_restaurant_id()
      )
  )
);

create or replace function public.generate_restaurant_slug(
  restaurant_name text,
  excluded_restaurant_id uuid default null
)
returns text
language plpgsql
set search_path = public, extensions
as $$
declare
  base_slug text;
  candidate text;
  suffix integer := 1;
begin
  base_slug := regexp_replace(
    lower(unaccent(trim(coalesce(restaurant_name, '')))),
    '[^a-z0-9]+',
    '',
    'g'
  );

  if base_slug = '' then
    base_slug := 'restaurant';
  end if;

  perform pg_advisory_xact_lock(hashtext(base_slug));

  candidate := base_slug;
  while exists (
    select 1
    from public.restaurants
    where slug = candidate
      and (excluded_restaurant_id is null or id <> excluded_restaurant_id)
  ) loop
    suffix := suffix + 1;
    candidate := base_slug || '-' || suffix;
  end loop;

  return candidate;
end;
$$;

do $$
declare
  invalid_restaurant record;
  repaired_slug text;
begin
  for invalid_restaurant in
    select id, name
    from public.restaurants
    where length(trim(slug)) <= 1
  loop
    repaired_slug := public.generate_restaurant_slug(
      invalid_restaurant.name,
      invalid_restaurant.id
    );

    update public.restaurants
    set slug = repaired_slug
    where id = invalid_restaurant.id;

    insert into public.restaurant_qr_codes (restaurant_id, public_url)
    values (invalid_restaurant.id, '/clienti/' || repaired_slug)
    on conflict (restaurant_id) do update
      set public_url = excluded.public_url,
          updated_at = now();
  end loop;
end;
$$;

insert into public.categories (id, restaurant_id, name, sort_order, active)
values
  ('21111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'Burgeri', 1, true),
  ('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'Shaorma', 2, true),
  ('23333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', 'Pizza', 3, true),
  ('24444444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111111', 'Bauturi', 4, true),
  ('25555555-5555-4555-8555-555555555555', '11111111-1111-4111-8111-111111111111', 'Desert', 5, true),
  ('26666666-6666-4666-8666-666666666666', '11111111-1111-4111-8111-111111111111', 'Extra', 6, true),
  ('27777777-7777-4777-8777-777777777777', '11111111-1111-4111-8111-111111111111', 'Cafea', 7, true)
on conflict (id) do update set
  name = excluded.name,
  sort_order = excluded.sort_order,
  active = excluded.active;

insert into public.products (
  id, restaurant_id, category_id, name, description, image_url, price,
  active, sold_out, prep_time, vat_rate, sort_order
)
values
  ('31111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '21111111-1111-4111-8111-111111111111', 'Burger Clasic', 'Chifla brioche, carne de vita, cheddar, salata, rosii si sos.', '/products/burger-classic.svg', 34, true, false, '15-25 min', 9, 1),
  ('32222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', '21111111-1111-4111-8111-111111111111', 'Burger Crispy', 'Piept de pui crispy, coleslaw, castraveti murati si sos.', '/products/burger-crispy.svg', 32, true, false, '15-25 min', 9, 2),
  ('33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'Shaorma Pui', 'Lipie cu pui marinat, cartofi, salata si sos de usturoi.', '/products/shaorma.svg', 29, true, false, '15-25 min', 9, 1),
  ('34444444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111111', '23333333-3333-4333-8333-333333333333', 'Pizza Margherita', 'Blat, sos de rosii, mozzarella si busuioc.', '/products/pizza.svg', 31, true, false, '15-25 min', 9, 1),
  ('35555555-5555-4555-8555-555555555555', '11111111-1111-4111-8111-111111111111', '24444444-4444-4444-8444-444444444444', 'Pepsi 0.5L', 'Bautura racoritoare servita rece.', '/products/pepsi.svg', 9, true, false, '5 min', 19, 1),
  ('36666666-6666-4666-8666-666666666666', '11111111-1111-4111-8111-111111111111', '25555555-5555-4555-8555-555555555555', 'Lava Cake', 'Prajitura calda de ciocolata cu miez fluid.', '/products/lava-cake.svg', 22, true, false, '10-15 min', 9, 1),
  ('37777777-7777-4777-8777-777777777777', '11111111-1111-4111-8111-111111111111', '26666666-6666-4666-8666-666666666666', 'Cartofi', 'Cartofi aurii si crocanti.', '/products/burger-classic.svg', 12, true, false, '10-15 min', 9, 1),
  ('38888888-8888-4888-8888-888888888888', '11111111-1111-4111-8111-111111111111', '26666666-6666-4666-8666-666666666666', 'Sos usturoi', 'Sos cremos de usturoi.', '/products/shaorma.svg', 5, true, false, '5 min', 9, 2),
  ('39999999-9999-4999-8999-999999999999', '11111111-1111-4111-8111-111111111111', '26666666-6666-4666-8666-666666666666', 'Sos picant', 'Sos picant pentru pizza si burger.', '/products/pizza.svg', 5, true, false, '5 min', 9, 3),
  ('3aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', '24444444-4444-4444-8444-444444444444', 'Cola 0.5L', 'Bautura racoritoare servita rece.', '/products/pepsi.svg', 9, true, false, '5 min', 19, 2),
  ('3bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '11111111-1111-4111-8111-111111111111', '24444444-4444-4444-8444-444444444444', 'Apa 0.5L', 'Apa plata servita rece.', '/products/pepsi.svg', 7, true, false, '5 min', 9, 3),
  ('3ccccccc-cccc-4ccc-8ccc-cccccccccccc', '11111111-1111-4111-8111-111111111111', '27777777-7777-4777-8777-777777777777', 'Cafea', 'Cafea aromata, preparata pe loc.', '/products/lava-cake.svg', 10, true, false, '5 min', 9, 1),
  ('3ddddddd-dddd-4ddd-8ddd-dddddddddddd', '11111111-1111-4111-8111-111111111111', '27777777-7777-4777-8777-777777777777', 'Croissant', 'Croissant fraged cu unt.', '/products/lava-cake.svg', 12, true, false, '5-10 min', 9, 2)
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  description = excluded.description,
  image_url = excluded.image_url,
  price = excluded.price,
  active = excluded.active,
  sold_out = excluded.sold_out,
  prep_time = excluded.prep_time,
  vat_rate = excluded.vat_rate,
  sort_order = excluded.sort_order;

insert into public.product_images (product_id, image_url, sort_order)
select id, image_url, 0
from public.products
where restaurant_id = '11111111-1111-4111-8111-111111111111'
  and image_url is not null
  and not exists (
    select 1
    from public.product_images
    where product_images.product_id = products.id
      and product_images.image_url = products.image_url
  );

insert into public.product_recommendations (
  product_id, recommended_product_id, sort_order
)
values
  ('31111111-1111-4111-8111-111111111111', '37777777-7777-4777-8777-777777777777', 1),
  ('31111111-1111-4111-8111-111111111111', '35555555-5555-4555-8555-555555555555', 2),
  ('31111111-1111-4111-8111-111111111111', '38888888-8888-4888-8888-888888888888', 3),
  ('32222222-2222-4222-8222-222222222222', '37777777-7777-4777-8777-777777777777', 1),
  ('32222222-2222-4222-8222-222222222222', '35555555-5555-4555-8555-555555555555', 2),
  ('32222222-2222-4222-8222-222222222222', '38888888-8888-4888-8888-888888888888', 3),
  ('34444444-4444-4444-8444-444444444444', '3aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 1),
  ('34444444-4444-4444-8444-444444444444', '39999999-9999-4999-8999-999999999999', 2),
  ('3ccccccc-cccc-4ccc-8ccc-cccccccccccc', '3ddddddd-dddd-4ddd-8ddd-dddddddddddd', 1),
  ('3ccccccc-cccc-4ccc-8ccc-cccccccccccc', '3bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 2)
on conflict (product_id, recommended_product_id) do update
set sort_order = excluded.sort_order;

insert into public.promotions (
  id, restaurant_id, name, description, promotion_type, discount_percent,
  trigger_order_number, starts_at, ends_at, active, sort_order
)
values
  ('41111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'First Order', '20% discount on first order', 'first_order', 20, 1, null, null, true, 1),
  ('42222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'Loyalty Promotion', '10% discount on the 11th order', 'loyalty', 10, 11, null, null, true, 2),
  ('43333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', 'Product Discount', 'Discount for selected products', 'product_discount', 15, null, null, null, false, 3),
  ('44444444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111111', 'Happy Hour', 'Time-based promotion', 'happy_hour', 10, null, '15:00', '17:00', false, 4)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  promotion_type = excluded.promotion_type,
  discount_percent = excluded.discount_percent,
  trigger_order_number = excluded.trigger_order_number,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  active = excluded.active,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.promotion_products (promotion_id, product_id)
values
  ('43333333-3333-4333-8333-333333333333', '31111111-1111-4111-8111-111111111111'),
  ('43333333-3333-4333-8333-333333333333', '34444444-4444-4444-8444-444444444444')
on conflict do nothing;

create or replace function public.clone_restaurant_template(
  target_restaurant_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  template_restaurant_id uuid;
  source_category record;
  source_product record;
  source_group record;
  source_promotion record;
  new_id uuid;
  category_map jsonb := '{}'::jsonb;
  product_map jsonb := '{}'::jsonb;
  group_map jsonb := '{}'::jsonb;
  promotion_map jsonb := '{}'::jsonb;
begin
  select id into template_restaurant_id
  from public.restaurants
  where is_onboarding_template
  limit 1;

  if template_restaurant_id is null then
    raise exception 'Restaurantul template ALL4HORECA nu este configurat.';
  end if;

  if target_restaurant_id = template_restaurant_id then
    return;
  end if;

  for source_category in
    select * from public.categories
    where restaurant_id = template_restaurant_id
    order by sort_order, id
  loop
    new_id := gen_random_uuid();
    insert into public.categories (
      id, restaurant_id, name, sort_order, active
    )
    values (
      new_id, target_restaurant_id, source_category.name,
      source_category.sort_order, source_category.active
    );
    category_map := category_map || jsonb_build_object(
      source_category.id::text,
      new_id::text
    );
  end loop;

  for source_product in
    select * from public.products
    where restaurant_id = template_restaurant_id
    order by sort_order, created_at, id
  loop
    new_id := gen_random_uuid();
    insert into public.products (
      id, restaurant_id, category_id, name, description, image_url, price,
      active, created_at, weight, ingredients, allergens, prep_time, vat_rate,
      is_recommended, is_bestseller, is_new, sold_out, sort_order
    )
    values (
      new_id,
      target_restaurant_id,
      (category_map->>source_product.category_id::text)::uuid,
      source_product.name,
      source_product.description,
      source_product.image_url,
      source_product.price,
      source_product.active,
      now(),
      source_product.weight,
      source_product.ingredients,
      source_product.allergens,
      source_product.prep_time,
      source_product.vat_rate,
      source_product.is_recommended,
      source_product.is_bestseller,
      source_product.is_new,
      source_product.sold_out,
      source_product.sort_order
    );
    product_map := product_map || jsonb_build_object(
      source_product.id::text,
      new_id::text
    );
  end loop;

  insert into public.product_images (
    product_id, image_url, sort_order, created_at
  )
  select
    (product_map->>product_images.product_id::text)::uuid,
    product_images.image_url,
    product_images.sort_order,
    now()
  from public.product_images
  join public.products source_product
    on source_product.id = product_images.product_id
  where source_product.restaurant_id = template_restaurant_id;

  for source_group in
    select groups.*
    from public.product_option_groups groups
    join public.products on products.id = groups.product_id
    where products.restaurant_id = template_restaurant_id
    order by groups.sort_order, groups.created_at, groups.id
  loop
    new_id := gen_random_uuid();
    insert into public.product_option_groups (
      id, product_id, name, selection_type, required, active, sort_order, created_at
    )
    values (
      new_id,
      (product_map->>source_group.product_id::text)::uuid,
      source_group.name,
      source_group.selection_type,
      source_group.required,
      source_group.active,
      source_group.sort_order,
      now()
    );
    group_map := group_map || jsonb_build_object(
      source_group.id::text,
      new_id::text
    );
  end loop;

  insert into public.product_options (
    group_id, name, price_delta, active, sort_order, created_at
  )
  select
    (group_map->>product_options.group_id::text)::uuid,
    product_options.name,
    product_options.price_delta,
    product_options.active,
    product_options.sort_order,
    now()
  from public.product_options
  join public.product_option_groups source_group
    on source_group.id = product_options.group_id
  join public.products source_product
    on source_product.id = source_group.product_id
  where source_product.restaurant_id = template_restaurant_id;

  insert into public.product_recommendations (
    product_id, recommended_product_id, sort_order
  )
  select
    (product_map->>recommendations.product_id::text)::uuid,
    (product_map->>recommendations.recommended_product_id::text)::uuid,
    recommendations.sort_order
  from public.product_recommendations recommendations
  join public.products source_product
    on source_product.id = recommendations.product_id
  join public.products recommended_product
    on recommended_product.id = recommendations.recommended_product_id
  where source_product.restaurant_id = template_restaurant_id
    and recommended_product.restaurant_id = template_restaurant_id;

  for source_promotion in
    select * from public.promotions
    where restaurant_id = template_restaurant_id
    order by sort_order, created_at, id
  loop
    new_id := gen_random_uuid();
    insert into public.promotions (
      id, restaurant_id, name, description, promotion_type,
      discount_percent, trigger_order_number, starts_at, ends_at,
      active, sort_order, created_at, updated_at
    )
    values (
      new_id,
      target_restaurant_id,
      source_promotion.name,
      source_promotion.description,
      source_promotion.promotion_type,
      source_promotion.discount_percent,
      source_promotion.trigger_order_number,
      source_promotion.starts_at,
      source_promotion.ends_at,
      source_promotion.active,
      source_promotion.sort_order,
      now(),
      now()
    );
    promotion_map := promotion_map || jsonb_build_object(
      source_promotion.id::text,
      new_id::text
    );
  end loop;

  insert into public.promotion_products (promotion_id, product_id)
  select
    (promotion_map->>promotion_products.promotion_id::text)::uuid,
    (product_map->>promotion_products.product_id::text)::uuid
  from public.promotion_products
  join public.promotions source_promotion
    on source_promotion.id = promotion_products.promotion_id
  join public.products source_product
    on source_product.id = promotion_products.product_id
  where source_promotion.restaurant_id = template_restaurant_id
    and source_product.restaurant_id = template_restaurant_id;
end;
$$;

revoke all on function public.clone_restaurant_template(uuid) from public;

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

  if trim(coalesce(restaurant_payload->>'name', '')) = '' then
    raise exception 'Numele restaurantului este obligatoriu.';
  end if;

  normalized_slug := public.generate_restaurant_slug(
    restaurant_payload->>'name'
  );

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
  values (created_restaurant_id, '/clienti/' || normalized_slug)
  on conflict (restaurant_id) do update
    set public_url = excluded.public_url,
        updated_at = now();

  perform public.clone_restaurant_template(created_restaurant_id);

  return created_restaurant_id;
end;
$$;

revoke all on function public.onboard_restaurant(jsonb, uuid) from public;
grant execute on function public.onboard_restaurant(jsonb, uuid) to authenticated;

update public.restaurant_qr_codes qr
set public_url = '/clienti/' || restaurants.slug,
    updated_at = now()
from public.restaurants
where restaurants.id = qr.restaurant_id;
