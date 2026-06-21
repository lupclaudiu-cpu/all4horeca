# Restaurant Context Architecture

## Previous behavior

Restaurant identity was resolved independently by several modules:

- Dashboard catalog, orders, settings, categories, products and QR/SEO read
  `profile.restaurantId`.
- Public restaurant pages loaded products using their route restaurant ID.
- Checkout and some services fell back to the hardcoded demo restaurant.
- Super admins could open a restaurant route, but the selected restaurant was
  lost when redirecting to the generic dashboard.
- Cart and settings storage were shared between restaurants.

This allowed the visible restaurant, cart, settings and saved order to refer to
different restaurant IDs.

## New architecture

`RestaurantProvider` is the only source of truth for the active restaurant.
Consumers use `useRestaurant()` and never infer a restaurant independently.

Resolution order:

1. `/clienti/[slug]` and `/r/[slug]` select the public restaurant from the slug.
2. A restaurant owner dashboard selects `profile.restaurantId`.
3. A super admin selects a restaurant through `/restaurant/[slug]`; the route
   redirects with an explicit restaurant ID.
4. Product, cart, checkout and order pages reuse the persisted active restaurant.
5. If no restaurant can be resolved, the context is empty. No demo restaurant
   is substituted.

The selected restaurant is persisted locally so navigation from menu to product,
cart, checkout and order history keeps the same tenant. Cart items from another
restaurant are removed when the active restaurant changes.

## Affected modules

- `src/features/restaurant/restaurant-context.tsx`
- `src/app/layout.tsx`
- `src/app/r/[slug]/page.tsx`
- `src/app/restaurant/[slug]/page.tsx`
- `src/features/public-restaurant/public-restaurant-page.tsx`
- `src/features/catalog/catalog-context.tsx`
- `src/features/orders/order-context.tsx`
- `src/features/settings/settings-context.tsx`
- `src/features/cart/cart-context.tsx`
- `src/features/checkout/checkout-page.tsx`
- `src/features/dashboard/dashboard-shell.tsx`
- `src/features/dashboard/products-dashboard-page.tsx`
- `src/features/dashboard/categories-dashboard-page.tsx`
- `src/features/dashboard/restaurant-presence-page.tsx`
- `src/components/layout/restaurant-header.tsx`
- `src/components/menu-page.tsx`
- `src/components/product-detail.tsx`
- `src/services/supabase-service.ts`
- `src/features/orders/order-repository.ts`
- `src/lib/types.ts`
