alter table public.restaurants
  add column if not exists secondary_color text not null default '#171411',
  add column if not exists address text not null default '',
  add column if not exists phone text not null default '',
  add column if not exists email text not null default '',
  add column if not exists seo_title text not null default '',
  add column if not exists seo_description text not null default '',
  add column if not exists social_image_url text;

create table if not exists public.restaurant_settings (
  restaurant_id uuid primary key references public.restaurants(id) on delete cascade,
  opening_time time not null default '10:00',
  closing_time time not null default '23:30',
  working_days integer[] not null default array[1,2,3,4,5,6,0],
  accepts_delivery boolean not null default true,
  accepts_pickup boolean not null default true,
  accepts_cash boolean not null default true,
  accepts_card boolean not null default true,
  delivery_fee numeric(10,2) not null default 10 check (delivery_fee >= 0),
  free_delivery_threshold numeric(10,2) not null default 100 check (free_delivery_threshold >= 0),
  updated_at timestamptz not null default now()
);

alter table public.categories
  add column if not exists active boolean not null default true;

alter table public.products
  add column if not exists weight text not null default '',
  add column if not exists ingredients text not null default '',
  add column if not exists allergens text not null default '',
  add column if not exists prep_time text not null default '15-25 min',
  add column if not exists vat_rate numeric(5,2) not null default 9 check (vat_rate >= 0),
  add column if not exists is_recommended boolean not null default false,
  add column if not exists is_bestseller boolean not null default false,
  add column if not exists is_new boolean not null default false,
  add column if not exists sold_out boolean not null default false,
  add column if not exists sort_order integer not null default 0;

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.product_recommendations (
  product_id uuid not null references public.products(id) on delete cascade,
  recommended_product_id uuid not null references public.products(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (product_id, recommended_product_id),
  constraint recommendation_not_self check (product_id <> recommended_product_id)
);

create table if not exists public.restaurant_qr_codes (
  restaurant_id uuid primary key references public.restaurants(id) on delete cascade,
  public_url text not null,
  qr_svg text,
  updated_at timestamptz not null default now()
);

create index if not exists categories_restaurant_sort_idx
  on public.categories(restaurant_id, sort_order);
create index if not exists products_restaurant_sort_idx
  on public.products(restaurant_id, sort_order);
create index if not exists product_images_product_idx
  on public.product_images(product_id, sort_order);
create index if not exists recommendations_product_idx
  on public.product_recommendations(product_id, sort_order);

alter table public.restaurant_settings enable row level security;
alter table public.product_images enable row level security;
alter table public.product_recommendations enable row level security;
alter table public.restaurant_qr_codes enable row level security;

grant select on public.restaurant_settings, public.product_images,
  public.product_recommendations, public.restaurant_qr_codes to anon, authenticated;
grant insert, update, delete on public.restaurant_settings, public.categories,
  public.products, public.product_images, public.product_recommendations,
  public.restaurant_qr_codes to authenticated;

create policy "Public reads restaurant settings"
on public.restaurant_settings for select using (true);

create policy "Owners manage restaurant settings"
on public.restaurant_settings for all to authenticated
using (
  public.current_user_role() = 'super_admin'
  or restaurant_id = public.current_user_restaurant_id()
)
with check (
  public.current_user_role() = 'super_admin'
  or restaurant_id = public.current_user_restaurant_id()
);

create policy "Owners insert categories"
on public.categories for insert to authenticated
with check (
  public.current_user_role() = 'super_admin'
  or restaurant_id = public.current_user_restaurant_id()
);

create policy "Owners update categories"
on public.categories for update to authenticated
using (
  public.current_user_role() = 'super_admin'
  or restaurant_id = public.current_user_restaurant_id()
)
with check (
  public.current_user_role() = 'super_admin'
  or restaurant_id = public.current_user_restaurant_id()
);

create policy "Owners delete categories"
on public.categories for delete to authenticated
using (
  public.current_user_role() = 'super_admin'
  or restaurant_id = public.current_user_restaurant_id()
);

create policy "Owners insert products"
on public.products for insert to authenticated
with check (
  public.current_user_role() = 'super_admin'
  or restaurant_id = public.current_user_restaurant_id()
);

create policy "Owners delete products"
on public.products for delete to authenticated
using (
  public.current_user_role() = 'super_admin'
  or restaurant_id = public.current_user_restaurant_id()
);

create policy "Public reads product images"
on public.product_images for select using (true);

create policy "Owners manage product images"
on public.product_images for all to authenticated
using (
  exists (
    select 1 from public.products
    where products.id = product_images.product_id
      and (
        public.current_user_role() = 'super_admin'
        or products.restaurant_id = public.current_user_restaurant_id()
      )
  )
)
with check (
  exists (
    select 1 from public.products
    where products.id = product_images.product_id
      and (
        public.current_user_role() = 'super_admin'
        or products.restaurant_id = public.current_user_restaurant_id()
      )
  )
);

create policy "Public reads recommendations"
on public.product_recommendations for select using (true);

create policy "Owners manage recommendations"
on public.product_recommendations for all to authenticated
using (
  exists (
    select 1 from public.products
    where products.id = product_recommendations.product_id
      and (
        public.current_user_role() = 'super_admin'
        or products.restaurant_id = public.current_user_restaurant_id()
      )
  )
)
with check (
  exists (
    select 1 from public.products
    where products.id = product_recommendations.product_id
      and (
        public.current_user_role() = 'super_admin'
        or products.restaurant_id = public.current_user_restaurant_id()
      )
  )
);

create policy "Public reads restaurant QR"
on public.restaurant_qr_codes for select using (true);

create policy "Owners manage restaurant QR"
on public.restaurant_qr_codes for all to authenticated
using (
  public.current_user_role() = 'super_admin'
  or restaurant_id = public.current_user_restaurant_id()
)
with check (
  public.current_user_role() = 'super_admin'
  or restaurant_id = public.current_user_restaurant_id()
);

insert into storage.buckets (id, name, public)
values
  ('restaurant-assets', 'restaurant-assets', true),
  ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

create policy "Public reads restaurant assets"
on storage.objects for select
using (bucket_id in ('restaurant-assets', 'product-images'));

create policy "Authenticated uploads restaurant assets"
on storage.objects for insert to authenticated
with check (bucket_id in ('restaurant-assets', 'product-images'));

create policy "Authenticated updates restaurant assets"
on storage.objects for update to authenticated
using (bucket_id in ('restaurant-assets', 'product-images'));

create policy "Authenticated deletes restaurant assets"
on storage.objects for delete to authenticated
using (bucket_id in ('restaurant-assets', 'product-images'));

insert into public.restaurant_settings (restaurant_id)
select id from public.restaurants
on conflict (restaurant_id) do nothing;
