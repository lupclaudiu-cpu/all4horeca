"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getProducts, type ProductCatalog } from "@/services/supabase-service";
import { useAuth } from "@/features/auth/auth-context";
import type { Category, Product } from "@/lib/types";
import { useRestaurant } from "@/features/restaurant/restaurant-context";
import { publishDataFlowDebug } from "@/lib/debug/data-flow-debug";

type CatalogContextValue = {
  products: Product[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  source: ProductCatalog["source"];
  trace: CatalogTrace;
  refresh: (restaurantIdOverride?: string) => Promise<void>;
};

type CatalogTrace = {
  providerMounted: boolean;
  restaurantIdDetected: boolean;
  refreshCalled: boolean;
  queryStarted: boolean;
  queryFinished: boolean;
  queryError: string | null;
  productsReturned: number;
  categoriesReturned: number;
  lastStep: string;
};

const initialTrace: CatalogTrace = {
  providerMounted: false,
  restaurantIdDetected: false,
  refreshCalled: false,
  queryStarted: false,
  queryFinished: false,
  queryError: null,
  productsReturned: 0,
  categoriesReturned: 0,
  lastStep: "CatalogProvider initial",
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

function logCatalogDebug(payload: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "development") return;
  console.info("[DEBUG]", {
    provider: "CatalogProvider",
    ...payload,
  });
}

function logCatalogStep(step: string, payload: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "development") return;
  console.info(step, payload);
}

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const { currentRestaurant, loading: restaurantLoading } = useRestaurant();
  const { loading: authLoading } = useAuth();
  const authLoadingRef = useRef(authLoading);
  const restaurantId = currentRestaurant?.id;
  const [catalog, setCatalog] = useState<ProductCatalog>({
    products: [],
    categories: [],
    source: "supabase",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadedRestaurantId, setLoadedRestaurantId] = useState<string | null>(
    null,
  );
  const [trace, setTrace] = useState<CatalogTrace>(initialTrace);
  const providerMountedLoggedRef = useRef(false);
  const detectedRestaurantIdsRef = useRef(new Set<string>());

  const updateTrace = useCallback((patch: Partial<CatalogTrace>) => {
    setTrace((current) => ({ ...current, ...patch }));
  }, []);

  useEffect(() => {
    authLoadingRef.current = authLoading;
  }, [authLoading]);

  useEffect(() => {
    if (providerMountedLoggedRef.current) return;
    providerMountedLoggedRef.current = true;
    logCatalogStep("CATALOG STEP 1 provider mounted", {
      restaurantId: restaurantId ?? null,
      authLoading,
      restaurantLoading,
    });
    const timer = window.setTimeout(() => {
      updateTrace({
        providerMounted: true,
        lastStep: "CATALOG STEP 1 provider mounted",
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [authLoading, restaurantId, restaurantLoading, updateTrace]);

  useEffect(() => {
    if (!restaurantId) return;
    if (detectedRestaurantIdsRef.current.has(restaurantId)) return;
    detectedRestaurantIdsRef.current.add(restaurantId);
    logCatalogStep("CATALOG STEP 2 restaurantId detected", {
      restaurantId,
      authLoading,
      restaurantLoading,
    });
    const timer = window.setTimeout(() => {
      updateTrace({
        restaurantIdDetected: true,
        lastStep: "CATALOG STEP 2 restaurantId detected",
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [authLoading, restaurantId, restaurantLoading, updateTrace]);

  const refresh = useCallback(async (restaurantIdOverride?: string) => {
    const currentAuthLoading = authLoadingRef.current;
    const requestedRestaurantId = restaurantIdOverride ?? restaurantId;
    logCatalogStep("CATALOG STEP 3 refreshCatalog called", {
      restaurantId: requestedRestaurantId ?? null,
      contextRestaurantId: restaurantId ?? null,
      restaurantIdOverride: restaurantIdOverride ?? null,
      authLoading: currentAuthLoading,
      restaurantLoading,
    });
    updateTrace({
      refreshCalled: true,
      lastStep: "CATALOG STEP 3 refreshCatalog called",
    });
    logCatalogDebug({
      step: "refresh-called",
      restaurantId: requestedRestaurantId ?? null,
      contextRestaurantId: restaurantId ?? null,
      restaurantIdOverride: restaurantIdOverride ?? null,
      authLoading: currentAuthLoading,
      restaurantLoading,
      queryStarted: false,
      queryFinished: false,
      queryError: null,
    });

    if (!requestedRestaurantId) {
      setCatalog({ products: [], categories: [], source: "supabase" });
      setLoadedRestaurantId(null);
      setError(null);
      setLoading(restaurantLoading);
      updateTrace({
        queryStarted: false,
        queryFinished: false,
        queryError: null,
        productsReturned: 0,
        categoriesReturned: 0,
        lastStep: "CATALOG STOP skip:no-restaurant",
      });
      publishDataFlowDebug({
        provider: "CatalogProvider",
        loading: restaurantLoading,
        restaurantId: null,
        categoriesCount: 0,
        productsCount: 0,
        error: null,
        query: "skip:no-restaurant",
        queryStarted: false,
        queryFinished: false,
        queryError: null,
        productsReturned: 0,
        categoriesReturned: 0,
        providerMounted: true,
        restaurantIdDetected: false,
        refreshCalled: true,
        lastStep: "CATALOG STOP skip:no-restaurant",
        authLoading: currentAuthLoading,
      });
      return;
    }
    setLoading(true);
    setError(null);
    publishDataFlowDebug({
      provider: "CatalogProvider",
      loading: true,
      restaurantId: requestedRestaurantId,
      categoriesCount: 0,
      productsCount: 0,
      error: null,
      query: "products/categories:start",
      queryStarted: true,
      queryFinished: false,
      queryError: null,
      productsReturned: 0,
      categoriesReturned: 0,
      providerMounted: true,
      restaurantIdDetected: true,
      refreshCalled: true,
      lastStep: "CATALOG STEP 3 refreshCatalog called",
      authLoading: currentAuthLoading,
    });
    try {
      logCatalogStep("CATALOG STEP 4 getCategories start", {
        restaurantId: requestedRestaurantId,
        authLoading: currentAuthLoading,
        restaurantLoading,
      });
      logCatalogStep("CATALOG STEP 5 getProducts start", {
        restaurantId: requestedRestaurantId,
        authLoading: currentAuthLoading,
        restaurantLoading,
      });
      updateTrace({
        queryStarted: true,
        queryFinished: false,
        queryError: null,
        productsReturned: 0,
        categoriesReturned: 0,
        lastStep: "CATALOG STEP 5 getProducts start",
      });
      logCatalogDebug({
        step: "query-started",
        restaurantId: requestedRestaurantId,
        loading: true,
        authLoading: currentAuthLoading,
        restaurantLoading,
        queryStarted: true,
        queryFinished: false,
        queryError: null,
      });
      const nextCatalog = await getProducts(requestedRestaurantId);
      logCatalogStep("CATALOG STEP 6 products returned count", {
        restaurantId: requestedRestaurantId,
        productsReturned: nextCatalog.products.length,
        categoriesReturned: nextCatalog.categories.length,
      });
      setCatalog(nextCatalog);
      setLoadedRestaurantId(requestedRestaurantId);
      updateTrace({
        queryStarted: true,
        queryFinished: true,
        queryError: null,
        productsReturned: nextCatalog.products.length,
        categoriesReturned: nextCatalog.categories.length,
        lastStep: "CATALOG STEP 7 state updated",
      });
      logCatalogStep("CATALOG STEP 7 state updated", {
        restaurantId: requestedRestaurantId,
        productsReturned: nextCatalog.products.length,
        categoriesReturned: nextCatalog.categories.length,
      });
      logCatalogDebug({
        step: "query-finished",
        restaurantId: requestedRestaurantId,
        loading: false,
        authLoading: currentAuthLoading,
        restaurantLoading,
        queryStarted: true,
        queryFinished: true,
        queryError: null,
        productsReturned: nextCatalog.products.length,
        categoriesReturned: nextCatalog.categories.length,
      });
      publishDataFlowDebug({
        provider: "CatalogProvider",
        loading: false,
        restaurantId: requestedRestaurantId,
        categoriesCount: nextCatalog.categories.length,
        productsCount: nextCatalog.products.length,
        error: null,
        query: "products/categories:success",
        queryStarted: true,
        queryFinished: true,
        queryError: null,
        productsReturned: nextCatalog.products.length,
        categoriesReturned: nextCatalog.categories.length,
        providerMounted: true,
        restaurantIdDetected: true,
        refreshCalled: true,
        lastStep: "CATALOG STEP 7 state updated",
        authLoading: currentAuthLoading,
      });
    } catch (reason) {
      const message =
        reason instanceof Error ? reason.message : "Catalog load failed.";
      console.warn("[ANTORIA data-flow] Catalog load failed.", {
        restaurantId: requestedRestaurantId,
        reason,
      });
      setError(
        reason instanceof Error ?
           reason.message
          : "Catalogul nu a putut fi încărcat.",
      );
      updateTrace({
        queryStarted: true,
        queryFinished: true,
        queryError: message,
        productsReturned: 0,
        categoriesReturned: 0,
        lastStep: "CATALOG ERROR",
      });
      publishDataFlowDebug({
        provider: "CatalogProvider",
        loading: false,
        restaurantId: requestedRestaurantId,
        categoriesCount: 0,
        productsCount: 0,
        error: message,
        query: "products/categories:error",
        queryStarted: true,
        queryFinished: true,
        queryError: message,
        productsReturned: 0,
        categoriesReturned: 0,
        providerMounted: true,
        restaurantIdDetected: Boolean(requestedRestaurantId),
        refreshCalled: true,
        lastStep: "CATALOG ERROR",
        authLoading: currentAuthLoading,
      });
    } finally {
      setLoading(false);
    }
  }, [restaurantId, restaurantLoading, updateTrace]);

  useEffect(() => {
    publishDataFlowDebug({
      provider: "CatalogProvider",
      loading,
      restaurantId: loadedRestaurantId,
      categoriesCount:
        loadedRestaurantId === restaurantId ? catalog.categories.length : 0,
      productsCount:
        loadedRestaurantId === restaurantId ? catalog.products.length : 0,
      error,
      queryStarted: loadedRestaurantId === restaurantId,
      queryFinished: loadedRestaurantId === restaurantId,
      queryError: error,
      productsReturned:
        loadedRestaurantId === restaurantId ? catalog.products.length : 0,
      categoriesReturned:
        loadedRestaurantId === restaurantId ? catalog.categories.length : 0,
      providerMounted: trace.providerMounted,
      restaurantIdDetected: trace.restaurantIdDetected,
      refreshCalled: trace.refreshCalled,
      lastStep: trace.lastStep,
      authLoading,
    });
  }, [
    authLoading,
    catalog,
    error,
    loadedRestaurantId,
    loading,
    restaurantId,
    trace,
  ]);

  useEffect(() => {
    publishDataFlowDebug({
      provider: "CatalogProvider",
      loading: restaurantLoading || !restaurantId,
      restaurantId: restaurantId ?? null,
      categoriesCount: 0,
      productsCount: 0,
      error: null,
      query: "refresh-effect:scheduled",
      queryStarted: false,
      queryFinished: false,
      queryError: null,
      productsReturned: 0,
      categoriesReturned: 0,
      providerMounted: true,
      restaurantIdDetected: Boolean(restaurantId),
      refreshCalled: false,
      lastStep: "refresh-effect:scheduled",
      authLoading: authLoadingRef.current,
    });
    logCatalogDebug({
      step: "refresh-effect-scheduled",
      restaurantId: restaurantId ?? null,
      authLoading: authLoadingRef.current,
      restaurantLoading,
      queryStarted: false,
      queryFinished: false,
      queryError: null,
    });
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh, restaurantId, restaurantLoading]);

  const value = useMemo(
    () => ({
      ...(loadedRestaurantId === restaurantId ?
         catalog
        : { products: [], categories: [], source: "supabase" as const }),
      loading,
      error,
      trace,
      refresh,
    }),
    [catalog, loadedRestaurantId, restaurantId, loading, error, trace, refresh],
  );

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) throw new Error("useCatalog must be used inside CatalogProvider");
  return context;
}
