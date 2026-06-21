"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { useCatalog } from "@/features/catalog/catalog-context";
import { useOrders } from "@/features/orders/order-context";
import { useRestaurant } from "@/features/restaurant/restaurant-context";
import {
  isDataFlowDebugEnabled,
  subscribeToDataFlowDebug,
  type DataFlowDebugSnapshot,
} from "@/lib/debug/data-flow-debug";

export function DataFlowDebugPanel() {
  const pathname = usePathname();
  const auth = useAuth();
  const restaurant = useRestaurant();
  const catalog = useCatalog();
  const orders = useOrders();
  const [snapshots, setSnapshots] = useState<
    Record<string, DataFlowDebugSnapshot>
  >({});

  useEffect(() => {
    if (!isDataFlowDebugEnabled()) return;
    return subscribeToDataFlowDebug((snapshot) => {
      setSnapshots((current) => ({
        ...current,
        [snapshot.provider]: snapshot,
      }));
    });
  }, []);

  const rows = useMemo(
    () =>
      [
        "AppProviders",
        "AuthProvider",
        "CartProvider",
        "RestaurantProvider",
        "CatalogProvider",
        "OrderContext",
        "BottomNav",
        "PublicRestaurantPage",
      ]
        .map((provider) => snapshots[provider])
        .filter(Boolean),
    [snapshots],
  );

  if (!isDataFlowDebugEnabled()) return null;

  const restaurantSnapshot = snapshots.RestaurantProvider;
  const catalogSnapshot = snapshots.CatalogProvider;
  const catalogTrace = catalog.trace;
  const authSnapshot = snapshots.AuthProvider;
  const ordersSnapshot = snapshots.OrderContext;
  const appProvidersSnapshot = snapshots.AppProviders;
  const cartSnapshot = snapshots.CartProvider;
  const bottomNavSnapshot = snapshots.BottomNav;
  const publicPageSnapshot = snapshots.PublicRestaurantPage;
  const errors = rows
    .map((row) => row.error)
    .concat(restaurant.error, catalog.error, orders.error, auth.error)
    .filter((error): error is string => Boolean(error));

  return (
    <div className="fixed bottom-24 left-3 z-[9999] max-w-[calc(100vw-1.5rem)] rounded-xl border border-slate-700 bg-slate-950/95 p-3 text-[11px] font-semibold text-white shadow-2xl md:max-w-sm">
      <p className="text-xs font-black text-cyan-300">ANTORIA DEBUG</p>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
        <dt className="text-slate-400">Route</dt>
        <dd className="truncate">{pathname}</dd>
        <dt className="text-slate-400">Restaurant loaded?</dt>
        <dd>{restaurant.currentRestaurant?.id ? "yes" : "no"}</dd>
        <dt className="text-slate-400">Restaurant id</dt>
        <dd className="truncate">
          {restaurant.currentRestaurant?.id ??
            restaurantSnapshot?.restaurantId ??
            "-"}
        </dd>
        <dt className="text-slate-400">Slug</dt>
        <dd className="truncate">
          {restaurant.currentRestaurant?.slug ?? restaurantSnapshot?.slug ?? "-"}
        </dd>
        <dt className="text-slate-400">Auth</dt>
        <dd>
          {auth.loading ?
             "loading"
            : auth.user ?
               "authenticated"
              : authSnapshot?.authStatus ?? "anonymous"}
        </dd>
        <dt className="text-slate-400">Categories</dt>
        <dd>{catalog.categories.length || catalogSnapshot?.categoriesCount || 0}</dd>
        <dt className="text-slate-400">Products</dt>
        <dd>{catalog.products.length || catalogSnapshot?.productsCount || 0}</dd>
        <dt className="text-slate-400">Orders</dt>
        <dd>{orders.orders.length || ordersSnapshot?.ordersCount || 0}</dd>
        <dt className="text-slate-400">Provider mounted</dt>
        <dd>
          {catalogTrace.providerMounted ||
          catalogSnapshot?.providerMounted ?
             "yes"
            : "no"}
        </dd>
        <dt className="text-slate-400">AppProviders</dt>
        <dd>{appProvidersSnapshot?.providerMounted ? "mounted" : "-"}</dd>
        <dt className="text-slate-400">AuthProvider</dt>
        <dd>{authSnapshot?.providerMounted ? "mounted" : "-"}</dd>
        <dt className="text-slate-400">CartProvider</dt>
        <dd>{cartSnapshot?.providerMounted ? "mounted" : "-"}</dd>
        <dt className="text-slate-400">BottomNav</dt>
        <dd>{bottomNavSnapshot?.providerMounted ? "mounted" : "-"}</dd>
        <dt className="text-slate-400">Public Page</dt>
        <dd>{publicPageSnapshot?.providerMounted ? "mounted" : "-"}</dd>
        <dt className="text-slate-400">Direct Products</dt>
        <dd>{publicPageSnapshot?.productsCount ?? 0}</dd>
        <dt className="text-slate-400">Direct Categories</dt>
        <dd>{publicPageSnapshot?.categoriesCount ?? 0}</dd>
        <dt className="text-slate-400">RestaurantId detected</dt>
        <dd>
          {catalogTrace.restaurantIdDetected ||
          catalogSnapshot?.restaurantIdDetected ?
             "yes"
            : "no"}
        </dd>
        <dt className="text-slate-400">Refresh called</dt>
        <dd>
          {catalogTrace.refreshCalled || catalogSnapshot?.refreshCalled ?
             "yes"
            : "no"}
        </dd>
        <dt className="text-slate-400">Query Started</dt>
        <dd>
          {catalogTrace.queryStarted || catalogSnapshot?.queryStarted ?
             "yes"
            : "no"}
        </dd>
        <dt className="text-slate-400">Query Finished</dt>
        <dd>
          {catalogTrace.queryFinished || catalogSnapshot?.queryFinished ?
             "yes"
            : "no"}
        </dd>
        <dt className="text-slate-400">Products Returned</dt>
        <dd>
          {catalogTrace.productsReturned ||
            catalogSnapshot?.productsReturned ||
            0}
        </dd>
        <dt className="text-slate-400">Categories Returned</dt>
        <dd>
          {catalogTrace.categoriesReturned ||
            catalogSnapshot?.categoriesReturned ||
            0}
        </dd>
        <dt className="text-slate-400">Last Step</dt>
        <dd className="truncate">
          {catalogTrace.lastStep || catalogSnapshot?.lastStep || "-"}
        </dd>
        <dt className="text-slate-400">Query Error</dt>
        <dd className="truncate">
          {catalogTrace.queryError ?? catalogSnapshot?.queryError ?? "-"}
        </dd>
      </dl>
      {errors.length > 0 && (
        <div className="mt-2 rounded-lg bg-red-950/80 p-2 text-red-100">
          {errors.map((error) => (
            <p key={error} className="line-clamp-2">
              {error}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
