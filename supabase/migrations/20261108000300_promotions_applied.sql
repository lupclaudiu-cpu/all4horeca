-- Promotions are applied by the server (single source of truth) and previewed to the customer.
-- Rules (one promotion per order, the largest discount wins, delivery fee excluded):
--  first_order     : customer's order number at this restaurant = trigger_order_number (default 1)
--  loyalty         : every Nth order (order number is a multiple of trigger_order_number)
--  happy_hour      : inside starts_at-ends_at (Europe/Bucharest); on listed products if any, else whole cart
--  product_discount: only the listed products
-- All respect valid_from / valid_until and active.

alter table public.orders
  add column if not exists discount_amount numeric(10,2) not null default 0,
  add column if not exists promotion_id uuid references public.promotions(id) on delete set null;

create or replace function public.calculate_order_discount(p_restaurant_id uuid, p_items jsonb)
returns table (promotion_id uuid, promotion_name text, discount numeric)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_now timestamp := (now() at time zone 'Europe/Bucharest');
  v_prior integer := 0;
begin
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) > 50 then
    return;
  end if;

  if auth.uid() is not null then
    select count(*) into v_prior
    from public.orders o
    join public.customers c on c.id = o.customer_id
    where c.user_id = auth.uid()
      and o.restaurant_id = p_restaurant_id
      and o.status <> 'Anulată';
  end if;

  return query
  with items as (
    select (i->>'product_id')::uuid as pid,
           greatest(least(coalesce((i->>'quantity')::int, 1), 99), 1) as qty,
           coalesce(i->'options', '[]'::jsonb) as opts
    from jsonb_array_elements(p_items) i
  ),
  lines as (
    select it.pid,
           p.price * it.qty + coalesce((
             select sum(po.price_delta
                        * greatest(least(coalesce((o->>'quantity')::int, 1), 20), 1)
                        * case when coalesce(po.multiply_by_product_quantity, false) then it.qty else 1 end)
             from jsonb_array_elements(it.opts) o
             join public.product_options po on po.id = (o->>'option_id')::uuid
           ), 0) as line_total
    from items it
    join public.products p on p.id = it.pid and p.restaurant_id = p_restaurant_id
  ),
  cand as (
    select pr.id, pr.name, pr.discount_percent,
      case
        when pr.promotion_type = 'first_order'
             and v_prior + 1 = coalesce(pr.trigger_order_number, 1)
          then (select coalesce(sum(line_total), 0) from lines)
        when pr.promotion_type = 'loyalty'
             and coalesce(pr.trigger_order_number, 0) > 0
             and (v_prior + 1) % pr.trigger_order_number = 0
          then (select coalesce(sum(line_total), 0) from lines)
        when pr.promotion_type = 'happy_hour'
             and (pr.starts_at is null or pr.ends_at is null
                  or case when pr.starts_at <= pr.ends_at
                          then v_now::time >= pr.starts_at and v_now::time < pr.ends_at
                          else v_now::time >= pr.starts_at or v_now::time < pr.ends_at end)
          then case when exists (select 1 from public.promotion_products pp where pp.promotion_id = pr.id)
                    then (select coalesce(sum(l.line_total), 0) from lines l
                          where l.pid in (select pp.product_id from public.promotion_products pp where pp.promotion_id = pr.id))
                    else (select coalesce(sum(line_total), 0) from lines) end
        when pr.promotion_type = 'product_discount'
          then (select coalesce(sum(l.line_total), 0) from lines l
                where l.pid in (select pp.product_id from public.promotion_products pp where pp.promotion_id = pr.id))
        else 0
      end as base
    from public.promotions pr
    where pr.restaurant_id = p_restaurant_id
      and pr.active = true
      and (pr.valid_from is null or v_now::date >= pr.valid_from)
      and (pr.valid_until is null or v_now::date <= pr.valid_until)
  )
  select c.id, c.name, round(c.base * least(greatest(c.discount_percent, 0), 100) / 100, 2)
  from cand c
  where c.base > 0
  order by 3 desc
  limit 1;
end;
$$;

revoke execute on function public.calculate_order_discount(uuid, jsonb) from public, anon, authenticated;

-- Customer-facing preview (same calculation as the order itself).
create or replace function public.preview_order_discount(p_restaurant_id uuid, p_items jsonb)
returns table (promotion_id uuid, promotion_name text, discount numeric)
language sql
security definer
set search_path to 'public'
as $$
  select * from public.calculate_order_discount(p_restaurant_id, p_items);
$$;
revoke execute on function public.preview_order_discount(uuid, jsonb) from public;
grant execute on function public.preview_order_discount(uuid, jsonb) to anon, authenticated, service_role;

-- create_order: account required + required options (see 0200) + promotion applied by the server.
create or replace function public.create_order(order_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
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
    select * into v_promo from public.calculate_order_discount(v_rid, order_payload->'items');
    v_discount := coalesce(v_promo.discount, 0);
  end if;

  -- the validated function checks total = subtotal + fee, so give it the pre-discount total
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
$$;

revoke execute on function public.create_order(jsonb) from public, anon;
grant execute on function public.create_order(jsonb) to authenticated, service_role;
