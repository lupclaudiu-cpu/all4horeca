insert into public.restaurants (id, name, slug, logo_url, primary_color, is_active)
values (
  '11111111-1111-4111-8111-111111111111',
  'ALL4HORECA',
  'all4horeca',
  '/icons/icon-192.png',
  '#ff5a1f',
  true
)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  logo_url = excluded.logo_url,
  primary_color = excluded.primary_color,
  is_active = excluded.is_active;

insert into public.categories (id, restaurant_id, name, sort_order)
values
  ('21111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'Burgeri', 1),
  ('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'Shaorma', 2),
  ('23333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', 'Pizza', 3),
  ('24444444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111111', 'Băuturi', 4),
  ('25555555-5555-4555-8555-555555555555', '11111111-1111-4111-8111-111111111111', 'Desert', 5)
on conflict (id) do update set
  name = excluded.name,
  sort_order = excluded.sort_order;

insert into public.products (id, restaurant_id, category_id, name, description, image_url, price, active)
values
  ('31111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '21111111-1111-4111-8111-111111111111', 'Burger Clasic', 'Chiflă brioche rumenită, carne suculentă de vită, cheddar maturat, salată crocantă, roșii și sosul nostru cremos.', '/products/burger-classic.svg', 34, true),
  ('32222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', '21111111-1111-4111-8111-111111111111', 'Burger Crispy', 'Piept de pui în crustă crocantă, coleslaw proaspăt, castraveți murați și sos ușor picant, într-o chiflă pufoasă.', '/products/burger-crispy.svg', 32, true),
  ('33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'Shaorma Pui', 'Lipie caldă cu pui marinat, cartofi aurii, salată verde, roșii, castraveți murați și sos de usturoi.', '/products/shaorma.svg', 29, true),
  ('34444444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111111', '23333333-3333-4333-8333-333333333333', 'Pizza Margherita', 'Blat copt pe vatră, sos aromat de roșii, mozzarella fină, ulei de măsline și busuioc proaspăt.', '/products/pizza.svg', 31, true),
  ('35555555-5555-4555-8555-555555555555', '11111111-1111-4111-8111-111111111111', '24444444-4444-4444-8444-444444444444', 'Pepsi 0.5L', 'Băutură răcoritoare servită rece. Ambalajul poate varia în funcție de stoc.', '/products/pepsi.svg', 9, true),
  ('36666666-6666-4666-8666-666666666666', '11111111-1111-4111-8111-111111111111', '25555555-5555-4555-8555-555555555555', 'Lava Cake', 'Prăjitură caldă de ciocolată cu miez fluid, servită cu sos de fructe de pădure.', '/products/lava-cake.svg', 22, true)
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  description = excluded.description,
  image_url = excluded.image_url,
  price = excluded.price,
  active = excluded.active;
