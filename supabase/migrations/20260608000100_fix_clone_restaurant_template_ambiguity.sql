create or replace function public.clone_restaurant_template(
  target_restaurant_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict error
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
  select restaurants.id
  into template_restaurant_id
  from public.restaurants
  where restaurants.is_onboarding_template
  limit 1;

  if template_restaurant_id is null then
    raise exception 'Restaurantul template ALL4HORECA nu este configurat.';
  end if;

  if target_restaurant_id = template_restaurant_id then
    return;
  end if;

  for source_category in
    select template_category.*
    from public.categories as template_category
    where template_category.restaurant_id = template_restaurant_id
    order by template_category.sort_order, template_category.id
  loop
    new_id := gen_random_uuid();

    insert into public.categories (
      id,
      restaurant_id,
      name,
      sort_order,
      active
    )
    values (
      new_id,
      target_restaurant_id,
      source_category.name,
      source_category.sort_order,
      source_category.active
    );

    category_map := category_map || jsonb_build_object(
      source_category.id::text,
      new_id::text
    );
  end loop;

  for source_product in
    select template_product.*
    from public.products as template_product
    where template_product.restaurant_id = template_restaurant_id
    order by
      template_product.sort_order,
      template_product.created_at,
      template_product.id
  loop
    new_id := gen_random_uuid();

    insert into public.products (
      id,
      restaurant_id,
      category_id,
      name,
      description,
      image_url,
      price,
      active,
      created_at,
      weight,
      ingredients,
      allergens,
      prep_time,
      vat_rate,
      is_recommended,
      is_bestseller,
      is_new,
      sold_out,
      sort_order
    )
    values (
      new_id,
      target_restaurant_id,
      (category_map ->> source_product.category_id::text)::uuid,
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
    product_id,
    image_url,
    sort_order,
    created_at
  )
  select
    (product_map ->> template_image.product_id::text)::uuid,
    template_image.image_url,
    template_image.sort_order,
    now()
  from public.product_images as template_image
  join public.products as template_image_product
    on template_image_product.id = template_image.product_id
  where template_image_product.restaurant_id = template_restaurant_id;

  for source_group in
    select template_group.*
    from public.product_option_groups as template_group
    join public.products as template_group_product
      on template_group_product.id = template_group.product_id
    where template_group_product.restaurant_id = template_restaurant_id
    order by
      template_group.sort_order,
      template_group.created_at,
      template_group.id
  loop
    new_id := gen_random_uuid();

    insert into public.product_option_groups (
      id,
      product_id,
      name,
      selection_type,
      required,
      active,
      sort_order,
      created_at
    )
    values (
      new_id,
      (product_map ->> source_group.product_id::text)::uuid,
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
    group_id,
    name,
    price_delta,
    active,
    sort_order,
    created_at
  )
  select
    (group_map ->> template_option.group_id::text)::uuid,
    template_option.name,
    template_option.price_delta,
    template_option.active,
    template_option.sort_order,
    now()
  from public.product_options as template_option
  join public.product_option_groups as template_option_group
    on template_option_group.id = template_option.group_id
  join public.products as template_option_product
    on template_option_product.id = template_option_group.product_id
  where template_option_product.restaurant_id = template_restaurant_id;

  insert into public.product_recommendations (
    product_id,
    recommended_product_id,
    sort_order
  )
  select
    (product_map ->> template_recommendation.product_id::text)::uuid,
    (
      product_map
      ->> template_recommendation.recommended_product_id::text
    )::uuid,
    template_recommendation.sort_order
  from public.product_recommendations as template_recommendation
  join public.products as recommendation_owner
    on recommendation_owner.id = template_recommendation.product_id
  join public.products as recommendation_target
    on recommendation_target.id =
      template_recommendation.recommended_product_id
  where recommendation_owner.restaurant_id = template_restaurant_id
    and recommendation_target.restaurant_id = template_restaurant_id;

  for source_promotion in
    select template_promotion.*
    from public.promotions as template_promotion
    where template_promotion.restaurant_id = template_restaurant_id
    order by
      template_promotion.sort_order,
      template_promotion.created_at,
      template_promotion.id
  loop
    new_id := gen_random_uuid();

    insert into public.promotions (
      id,
      restaurant_id,
      name,
      description,
      promotion_type,
      discount_percent,
      trigger_order_number,
      starts_at,
      ends_at,
      active,
      sort_order,
      created_at,
      updated_at
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

  insert into public.promotion_products (
    promotion_id,
    product_id
  )
  select
    (
      promotion_map
      ->> template_promotion_product.promotion_id::text
    )::uuid,
    (
      product_map
      ->> template_promotion_product.product_id::text
    )::uuid
  from public.promotion_products as template_promotion_product
  join public.promotions as template_product_promotion
    on template_product_promotion.id =
      template_promotion_product.promotion_id
  join public.products as template_promoted_product
    on template_promoted_product.id =
      template_promotion_product.product_id
  where template_product_promotion.restaurant_id = template_restaurant_id
    and template_promoted_product.restaurant_id = template_restaurant_id;
end;
$$;

revoke all on function public.clone_restaurant_template(uuid) from public;

do $$
declare
  smoke_restaurant_id uuid;
  template_restaurant_id uuid;
  template_category_count integer;
  cloned_category_count integer;
  template_product_count integer;
  cloned_product_count integer;
begin
  begin
    select restaurants.id
    into template_restaurant_id
    from public.restaurants
    where restaurants.is_onboarding_template
    limit 1;

    if template_restaurant_id is null then
      raise exception 'Restaurantul template ALL4HORECA nu este configurat.';
    end if;

    insert into public.restaurants (
      name,
      slug,
      is_active
    )
    values (
      'Clone template smoke test',
      'clone-smoke-' || replace(gen_random_uuid()::text, '-', ''),
      false
    )
    returning restaurants.id into smoke_restaurant_id;

    perform public.clone_restaurant_template(smoke_restaurant_id);

    select count(*)
    into template_category_count
    from public.categories
    where categories.restaurant_id = template_restaurant_id;

    select count(*)
    into cloned_category_count
    from public.categories
    where categories.restaurant_id = smoke_restaurant_id;

    select count(*)
    into template_product_count
    from public.products
    where products.restaurant_id = template_restaurant_id;

    select count(*)
    into cloned_product_count
    from public.products
    where products.restaurant_id = smoke_restaurant_id;

    if template_category_count = 0 or template_product_count = 0 then
      raise exception
        'Restaurantul template nu contine categorii si produse.';
    end if;

    if cloned_category_count <> template_category_count then
      raise exception
        'Clonarea categoriilor este incompleta: expected %, received %.',
        template_category_count,
        cloned_category_count;
    end if;

    if cloned_product_count <> template_product_count then
      raise exception
        'Clonarea produselor este incompleta: expected %, received %.',
        template_product_count,
        cloned_product_count;
    end if;

    if exists (
      select 1
      from public.products as cloned_product
      join public.categories as cloned_category
        on cloned_category.id = cloned_product.category_id
      where cloned_product.restaurant_id = smoke_restaurant_id
        and cloned_category.restaurant_id <> smoke_restaurant_id
    ) then
      raise exception
        'Produsele clonate nu sunt asociate exclusiv categoriilor restaurantului nou.';
    end if;

    if not exists (
      select 1
      from public.products
      where products.restaurant_id = smoke_restaurant_id
        and products.active
        and not products.sold_out
    ) then
      raise exception
        'Restaurantul clonat nu contine produse vizibile in aplicatia client.';
    end if;

    raise exception using
      message = 'clone_restaurant_template smoke test rollback',
      errcode = 'P0001';
  exception
    when raise_exception then
      if sqlerrm <> 'clone_restaurant_template smoke test rollback' then
        raise;
      end if;
  end;
end;
$$;
