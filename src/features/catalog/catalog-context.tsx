"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getProducts, type ProductCatalog } from "@/services/supabase-service";
import type { Category, Product } from "@/lib/types";
import { useAuth } from "@/features/auth/auth-context";

type CatalogContextValue = {
  products: Product[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  source: ProductCatalog["source"];
  refresh: () => Promise<void>;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const restaurantId = profile?.restaurantId ?? undefined;
  const [catalog, setCatalog] = useState<ProductCatalog>({
    products: [],
    categories: [],
    source: "mock",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCatalog(await getProducts(restaurantId));
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Catalogul nu a putut fi încărcat.",
      );
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const value = useMemo(
    () => ({
      ...catalog,
      loading,
      error,
      refresh,
    }),
    [catalog, loading, error, refresh],
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
