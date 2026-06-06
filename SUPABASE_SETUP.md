# Configurare Supabase

## 1. Creează proiectul

1. Creează un proiect nou în [Supabase](https://supabase.com/dashboard).
2. Deschide `SQL Editor`.
3. Aplică toate migrările din `supabase/migrations` în ordine:

```text
supabase/migrations/202606060001_initial_schema.sql
supabase/migrations/202606060002_all4horeca_branding.sql
supabase/migrations/202606060003_auth_roles.sql
```

4. Rulează apoi:

```text
supabase/seed.sql
```

Seed-ul creează restaurantul demo, categoriile și produsele existente.

Pentru proiectul demo existent, configurarea automată poate fi rulată dintr-un terminal autentificat:

```powershell
.\scripts\configure-supabase.ps1
```

## 2. Configurează variabilele

Creează `.env.local` în rădăcina proiectului:

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=PUBLIC_ANON_KEY
```

Valorile se găsesc în `Project Settings → API`.

Nu folosi cheia `service_role` în aplicația web. Aceasta oferă acces administrativ și nu trebuie expusă în browser.

## 3. Repornește aplicația

```powershell
npm.cmd run dev -- --hostname 0.0.0.0
```

După modificarea `.env.local`, serverul Next.js trebuie repornit.

## Servicii disponibile

Fișierul `src/services/supabase-service.ts` expune:

- `getProducts()`
- `createOrder()`
- `getOrders()`
- `updateOrderStatus()`
- `getCustomers()`
- `updateProductActive()`

Plasarea comenzii folosește funcția PostgreSQL `create_order(jsonb)`, astfel încât salvarea clientului, comenzii și produselor să fie atomică.

## Securitate MVP

Autentificarea folosește Supabase Auth. Migrarea `202606060003_auth_roles.sql`
creează tabelul `profiles`, rolurile și politicile RLS. Accesul anonim rămâne
disponibil doar pentru catalog și plasarea comenzilor.

## Crearea utilizatorilor și rolurilor

1. Creează contul din `/register` sau din `Authentication → Users`.
2. Găsește ID-ul utilizatorului în `Authentication → Users`.
3. Pentru Super Admin, rulează în SQL Editor:

```sql
update public.profiles
set role = 'super_admin', restaurant_id = null
where email = 'admin@all4horeca.ro';
```

4. Pentru Restaurant Owner, folosește ID-ul restaurantului:

```sql
update public.profiles
set
  role = 'restaurant_owner',
  restaurant_id = '11111111-1111-4111-8111-111111111111'
where email = 'owner@restaurant.ro';
```

Înregistrarea publică nu permite alegerea unui rol privilegiat. Toate conturile
noi primesc automat rolul `customer`.

Pentru utilizatori creați înainte de migrarea Auth, profilul poate fi inserat:

```sql
insert into public.profiles (id, email, full_name, role)
select id, email, coalesce(raw_user_meta_data->>'full_name', ''), 'customer'
from auth.users
on conflict (id) do nothing;
```

## Redirect URL

În `Authentication → URL Configuration`, adaugă:

```text
http://localhost:3000/**
https://domeniul-tau.ro/**
```

După autentificare:

- `customer` este trimis în aplicația publică;
- `restaurant_owner` este trimis la `/restaurant/dashboard`;
- `super_admin` este trimis la `/admin`.

## Mod neconfigurat

Dacă variabilele Supabase lipsesc:

- catalogul folosește datele mock locale;
- comenzile există doar în memoria sesiunii;
- nu se mai folosește `localStorage` pentru datele restaurantului.
