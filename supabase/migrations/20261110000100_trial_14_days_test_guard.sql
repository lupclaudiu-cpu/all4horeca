-- 1) Perioada de testare la inregistrarea self-service: 14 zile (era 7).
--    Textul SEO nu mai contine "by ANTORIA".
-- 2) Numarul de test OTP (40770111111) nu poate plasa comenzi la restaurante active (platite).

create or replace function public.self_onboard_restaurant(restaurant_payload jsonb, owner_id uuid)
 returns uuid
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  created_restaurant_id uuid;
  normalized_slug text;
  trial_start timestamptz := now();
begin
  if coalesce(auth.role(), '') <> 'service_role'
     and auth.uid() is distinct from owner_id then
    raise exception 'Acces interzis.';
  end if;
  if exists (select 1 from public.profiles
             where id = owner_id and role = 'super_admin') then
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
    'Comandă online de la ' || trim(restaurant_payload->>'name') || '.',
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
    trial_start + interval '14 days',
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
$function$;

create or replace function public.create_order(order_payload jsonb)
 returns uuid
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_item jsonb;
  g record;
  v_count integer;
  v_rid uuid;
  v_promo record;
  v_discount numeric := 0;
  v_payload jsonb := order_payload;
  v_order_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Trebuie să te autentifici cu numărul de telefon pentru a comanda.';
  end if;

  if jsonb_typeof(order_payload->'items') = 'array' then
    for v_item in select * from jsonb_array_elements(order_payload->'items') loop
      for g in
        select id, name, required, selection_type
        from public.product_option_groups
        where product_id = nullif(v_item->>'product_id', '')::uuid and active = true
      loop
        select count(*) into v_count
        from jsonb_array_elements(coalesce(v_item->'options', '[]'::jsonb)) o
        where o->>'group_id' = g.id::text;
        if g.required and v_count = 0 then
          raise exception 'Alege o opțiune pentru „%".', g.name;
        end if;
        if g.selection_type = 'single' and v_count > 1 then
          raise exception 'Pentru „%" poți alege o singură opțiune.', g.name;
        end if;
      end loop;
    end loop;

    begin
      v_rid := (order_payload->>'restaurant_id')::uuid;
    exception when others then
      raise exception 'Comanda este invalidă.';
    end;

    -- Contul de test (numarul OTP de test) poate comanda doar la restaurante in perioada de testare.
    if exists (select 1 from auth.users where id = auth.uid() and phone = '40770111111')
       and exists (select 1 from public.restaurants where id = v_rid and status = 'active') then
      raise exception 'Contul de test nu poate plasa comenzi la acest restaurant.';
    end if;

    select * into v_promo from public.calculate_order_discount(v_rid, order_payload->'items');
    v_discount := coalesce(v_promo.discount, 0);
  end if;

  if v_discount > 0 then
    v_payload := jsonb_set(order_payload, '{total}',
      to_jsonb(round((order_payload->>'total')::numeric + v_discount, 2)));
  end if;

  v_order_id := public.create_order_validated(v_payload);

  if v_discount > 0 then
    update public.orders
       set total = total - v_discount,
           discount_amount = v_discount,
           promotion_id = v_promo.promotion_id
     where id = v_order_id;
  end if;

  return v_order_id;
end;
$function$;
