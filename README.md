# ALL4HORECA

MVP PWA mobile-first pentru o platformă HORECA multi-restaurant.

## Pornire locală

```bash
npm install
npm run dev -- --hostname 0.0.0.0
```

Deschide `http://localhost:3000` pe calculator. Pentru testare pe telefon, conectează telefonul la aceeași rețea Wi-Fi și accesează adresa IP locală afișată în terminal, urmată de `:3000`.

Pentru a verifica service worker-ul și instalarea PWA:

```bash
npm run build
npm run start -- --hostname 0.0.0.0
```

Instalarea PWA pe un telefon necesită HTTPS atunci când aplicația nu rulează pe `localhost`.

Pe Android, deschide aplicația în Chrome și apasă butonul „Adaugă pe ecranul principal”. Pe iPhone, deschide în Safari, apasă Partajează și apoi „Adăugați la ecranul principal”.

## Dashboard restaurant

Dashboard-ul demo este disponibil la:

```text
http://localhost:3000/restaurant/dashboard
```

Folosește aceleași comenzi Supabase ca aplicația client. Include overview, comenzi live, istoric, clienți, produse și setări comerciale.

## Google Maps și Places

Pentru sugestii de adrese reale și hărți, activează în Google Cloud:

- Maps JavaScript API
- Places API

Adaugă în `.env.local`:

```text
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=cheia_ta_publica
```

Restricționează cheia la domeniile aplicației și la API-urile de mai sus. Adresa,
latitudinea și longitudinea sunt asociate local comenzii. Modelul include separat
poziția opțională a livratorului pentru o integrare viitoare de tracking live.

## Supabase

Configurarea bazei de date este descrisă în [SUPABASE_SETUP.md](SUPABASE_SETUP.md).

După configurare, produsele, clienții și comenzile sunt citite și salvate în Supabase, fiind disponibile pe toate dispozitivele.

### FAZA 6: onboarding și administrare comercială

Rulează migrarea nouă înainte de a folosi wizard-ul și administrarea catalogului:

```powershell
npx.cmd supabase db push
```

Migrarea `202606060004_restaurant_commercial_management.sql` adaugă setările
restaurantului, câmpurile comerciale pentru produse, recomandările, datele QR și
bucket-urile publice `restaurant-assets` și `product-images`.

În `.env.local` trebuie adăugată și cheia server-side din Supabase Dashboard:

```env
SUPABASE_SERVICE_ROLE_KEY=cheia_service_role_opțională
```

Această cheie este folosită numai de ruta server care creează automat contul
`restaurant_owner`. Nu trebuie prefixată cu `NEXT_PUBLIC_` și nu trebuie
publicată în Git sau trimisă în browser.

Funcțiile disponibile după migrare:

- wizard Admin în 5 pași pentru restaurant, setări și owner;
- categorii cu editare, status și ordine;
- produse cu imagini Storage, disponibilitate, badges și recomandări;
- import `.xlsx`, `.xls` și `.csv`;
- QR PNG/SVG, SEO și link public `/r/restaurant-slug`;
- produsele inactive sau epuizate sunt ascunse automat din meniul public.

## FAZA 7: Realtime Orders

Migrarea `202606060005_realtime_orders.sql`:

- publică `orders` și `order_status_changes` în Supabase Realtime;
- salvează automat istoricul schimbărilor de status;
- adaugă preferințele pentru notificări, sunet și evidențierea întârzierilor;
- aplică RLS astfel încât ownerul să primească doar comenzile restaurantului său.

Aplicare:

```powershell
npx.cmd supabase login
npx.cmd supabase db push
```

Dashboard-ul afișează comenzile noi fără refresh, toast, sunet opțional, badge
roșu, timer și praguri vizuale la 30 și 45 de minute. Sunetul poate necesita o
primă interacțiune cu pagina, conform regulilor browserului.

## FAZA 8: Variante și extra opțiuni

Migrarea `202606060006_product_options.sql` adaugă:

- `product_option_groups` pentru grupuri single/multiple, reguli și status;
- `product_options` pentru opțiuni, supliment de preț și ordine;
- `order_item_options` pentru snapshot-ul opțiunilor comandate;
- versiunea actualizată a funcției `create_order`.

În Dashboard Restaurant, butonul `Variante & Extra` este disponibil pentru
fiecare produs. Produsele fără grupuri rămân complet compatibile cu fluxul
existent. Pentru produsele configurabile, clientul vede prețul actualizat în
timp real, iar coșul separă automat configurațiile diferite ale aceluiași
produs.

Aplicare:

```powershell
npx.cmd supabase login
npx.cmd supabase db push
```

## Autentificare și roluri

Aplicația folosește Supabase Auth cu rolurile:

- `customer` - cont creat din `/register`
- `restaurant_owner` - acces doar la restaurantul asociat
- `super_admin` - acces la `/admin` și toate restaurantele

Rutele `/restaurant/dashboard` și `/admin` sunt protejate atât prin Next.js
Proxy, cât și prin politicile RLS din Supabase. Instrucțiunile pentru atribuirea
rolurilor sunt în [SUPABASE_SETUP.md](SUPABASE_SETUP.md).

## Structură

- `src/app` - pagini și configurare PWA
- `src/components` - interfață reutilizabilă
- `src/features` - funcționalități izolate, precum coșul
- `src/data` - date mock locale
- `src/lib` - tipuri și utilitare comune

Produsele, comenzile și setările restaurantului sunt sincronizate prin
Supabase. Preferințele sunt păstrate și local pentru pornire rapidă. Plățile
reale, notificările push și tracking-ul live nu sunt încă integrate.
