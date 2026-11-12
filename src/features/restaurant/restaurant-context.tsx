"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";
import { publishDataFlowDebug } from "@/lib/debug/data-flow-debug";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { CurrentRestaurant } from "@/lib/types";

type RestaurantContextValue = {
  currentRestaurant: CurrentRestaurant | null;
  loading: boolean;
  error: string | null;
  selectRestaurant: (restaurant: CurrentRestaurant) => void;
  clearRestaurant: () => void;
  refreshRestaurant: () => Promise<void>;
};

type RestaurantRow = {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  address: string;
  phone: string;
  is_active: boolean;
  status?: "trial" | "active" | "suspended" | "deleted";
  trial_active?: boolean;
  trial_started_at?: string | null;
  trial_expires_at?: string | null;
  contract_signed?: boolean;
  created_at?: string | null;
  cover_image_url?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
};

const RESTAURANT_COLUMNS =
  "id, slug, name, logo_url, primary_color, secondary_color, address, phone, is_active, status, trial_active, trial_started_at, trial_expires_at, contract_signed, created_at";
// Coloane adăugate de migrarea 20261111000100; dacă lipsesc, folosim selecția de bază.
const EXTENDED_RESTAURANT_COLUMNS = `${RESTAURANT_COLUMNS}, cover_image_url, facebook_url, instagram_url`;

const RestaurantContext = createContext<RestaurantContextValue | null>(null);
export const RESTAURANT_STORAGE_KEY = "all4horeca-current-restaurant";

export function RestaurantProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { profile, loading: authLoading } = useAuth();
  const [currentRestaurant, setCurrentRestaurant] =
    useState<CurrentRestaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectRestaurant = useCallback((restaurant: CurrentRestaurant) => {
    setCurrentRestaurant(restaurant);
    setError(null);
    window.localStorage.setItem(
      RESTAURANT_STORAGE_KEY,
      JSON.stringify(restaurant),
    );
  }, []);

  const clearRestaurant = useCallback(() => {
    setCurrentRestaurant(null);
    setError(null);
    window.localStorage.removeItem(RESTAURANT_STORAGE_KEY);
  }, []);

  useEffect(() => {
    publishDataFlowDebug({
      provider: "RestaurantProvider",
      route: pathname,
      loading,
      restaurantId: currentRestaurant?.id ?? null,
      slug: currentRestaurant?.slug ?? getPublicRestaurantSlug(pathname),
      user: profile?.email ?? null,
      authStatus: authLoading ? "auth-loading" : profile?.role ?? "anonymous",
      error,
    });
  }, [
    authLoading,
    currentRestaurant?.id,
    currentRestaurant?.slug,
    error,
    loading,
    pathname,
    profile?.email,
    profile?.role,
  ]);

  const loadRestaurant = useCallback(
    async ({
      id,
      slug,
    }: {
      id?: string | null;
      slug?: string | null;
    }) => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error("Supabase nu este configurat.");
      if (!id && !slug) return null;
      const run = (columns: string) => {
        const query = supabase.from("restaurants").select(columns);
        return (id ? query.eq("id", id) : query.eq("slug", slug!)).maybeSingle();
      };
      let { data, error: restaurantError } = await run(
        EXTENDED_RESTAURANT_COLUMNS,
      );
      if (restaurantError) {
        ({ data, error: restaurantError } = await run(RESTAURANT_COLUMNS));
      }
      if (restaurantError) throw new Error(restaurantError.message);
      return data ? mapRestaurant(data as unknown as RestaurantRow) : null;
    },
    [],
  );

  const resolveRestaurant = useCallback(async () => {
    if (pathname.startsWith("/restaurant/dashboard") && authLoading) return;
    setLoading(true);
    setError(null);
    publishDataFlowDebug({
      provider: "RestaurantProvider",
      route: pathname,
      loading: true,
      restaurantId: currentRestaurant?.id ?? null,
      slug: currentRestaurant?.slug ?? getPublicRestaurantSlug(pathname),
      user: profile?.email ?? null,
      authStatus: authLoading ? "auth-loading" : profile?.role ?? "anonymous",
      error: null,
      query: "resolveRestaurant:start",
    });

    try {
      if (pathname === "/" || pathname === "/app") {
        setCurrentRestaurant(null);
        publishDataFlowDebug({
          provider: "RestaurantProvider",
          route: pathname,
          loading: false,
          restaurantId: null,
          slug: null,
          user: profile?.email ?? null,
          authStatus: profile?.role ?? "anonymous",
          error: null,
          query: "resolveRestaurant:root",
        });
        return;
      }

      const publicSlug = getPublicRestaurantSlug(pathname);
      if (publicSlug) {
        const restaurant = await loadRestaurant({ slug: publicSlug });
        publishDataFlowDebug({
          provider: "RestaurantProvider",
          route: pathname,
          loading: false,
          restaurantId: restaurant?.id ?? null,
          slug: publicSlug,
          user: profile?.email ?? null,
          authStatus: profile?.role ?? "anonymous",
          error: restaurant ? null : "Restaurant slug not found.",
          query: "restaurants.eq(slug).maybeSingle",
        });
        if (!restaurant?.isActive) {
          clearRestaurant();
          setError("Restaurantul nu este disponibil.");
          return;
        }
        selectRestaurant(restaurant);
        return;
      }

      if (pathname.startsWith("/restaurant/dashboard")) {
        const selectedId =
          profile?.role === "restaurant_owner" || profile?.role === "restaurant_staff" ?
             profile.restaurantId
            : profile?.role === "super_admin" ?
               getSelectedRestaurantId()
              : null;
        if (!selectedId) {
          clearRestaurant();
          setError("Nu este selectat niciun restaurant.");
          return;
        }
        const restaurant = await loadRestaurant({ id: selectedId });
        publishDataFlowDebug({
          provider: "RestaurantProvider",
          route: pathname,
          loading: false,
          restaurantId: restaurant?.id ?? selectedId,
          slug: restaurant?.slug ?? null,
          user: profile?.email ?? null,
          authStatus: profile?.role ?? "anonymous",
          error: restaurant ? null : "Selected restaurant not found.",
          query: "restaurants.eq(id).maybeSingle",
        });
        if (!restaurant) {
          clearRestaurant();
          setError("Restaurantul selectat nu există.");
          return;
        }
        selectRestaurant(restaurant);
        return;
      }

      const stored = readStoredRestaurant();
      if (!stored) {
        clearRestaurant();
        return;
      }
      const restaurant = await loadRestaurant({ id: stored.id });
      if (!restaurant?.isActive) {
        clearRestaurant();
        return;
      }
      selectRestaurant(restaurant);
    } catch (reason) {
      setCurrentRestaurant(null);
      setError(
        reason instanceof Error ?
           reason.message
          : "Restaurantul nu a putut fi încărcat.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    authLoading,
    clearRestaurant,
    currentRestaurant?.id,
    currentRestaurant?.slug,
    loadRestaurant,
    pathname,
    profile,
    selectRestaurant,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => void resolveRestaurant(), 0);
    return () => window.clearTimeout(timer);
  }, [resolveRestaurant]);

  const refreshRestaurant = useCallback(async () => {
    if (!currentRestaurant) return;
    const restaurant = await loadRestaurant({ id: currentRestaurant.id });
    if (restaurant) selectRestaurant(restaurant);
  }, [currentRestaurant, loadRestaurant, selectRestaurant]);

  // Superadminul poate edita orice restaurant din panou, chiar dacă testarea a expirat
  // sau accesul clientului este suspendat. Meniul public rămâne blocat pentru clienți.
  const isSuperAdminDashboard =
    profile?.role === "super_admin" && pathname.startsWith("/restaurant/dashboard");
  const effectiveRestaurant = useMemo(
    () =>
      currentRestaurant && isSuperAdminDashboard && currentRestaurant.accessLocked
        ? { ...currentRestaurant, accessLocked: false }
        : currentRestaurant,
    [currentRestaurant, isSuperAdminDashboard],
  );

  const value = useMemo(
    () => ({
      currentRestaurant: effectiveRestaurant,
      loading,
      error,
      selectRestaurant,
      clearRestaurant,
      refreshRestaurant,
    }),
    [
      effectiveRestaurant,
      loading,
      error,
      selectRestaurant,
      clearRestaurant,
      refreshRestaurant,
    ],
  );

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error("useRestaurant must be used inside RestaurantProvider");
  }
  return context;
}

function getPublicRestaurantSlug(pathname: string) {
  const match = pathname.match(/^\/(?:clienti|r)\/([^/]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function getSelectedRestaurantId() {
  const queryId = new URLSearchParams(window.location.search).get("restaurant");
  if (queryId) return queryId;
  return readStoredRestaurant()?.id ?? null;
}

function readStoredRestaurant(): CurrentRestaurant | null {
  try {
    const value = window.localStorage.getItem(RESTAURANT_STORAGE_KEY);
    return value ? (JSON.parse(value) as CurrentRestaurant) : null;
  } catch {
    window.localStorage.removeItem(RESTAURANT_STORAGE_KEY);
    return null;
  }
}

function mapRestaurant(row: RestaurantRow): CurrentRestaurant {
  const trialExpired = Boolean(
    row.trial_active &&
      row.trial_expires_at &&
      new Date(row.trial_expires_at).getTime() < Date.now(),
  );
  const status = row.status ?? "active";
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    logoUrl: row.logo_url,
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    address: row.address,
    phone: row.phone,
    isActive: row.is_active,
    status,
    trialActive: row.trial_active ?? false,
    trialStartedAt: row.trial_started_at ?? null,
    trialExpiresAt: row.trial_expires_at ?? null,
    contractSigned: row.contract_signed ?? false,
    coverImageUrl: row.cover_image_url ?? null,
    facebookUrl: row.facebook_url ?? "",
    instagramUrl: row.instagram_url ?? "",
    createdAt: row.created_at ?? null,
    trialExpired,
    accessLocked:
      status === "suspended" ||
      status === "deleted" ||
      trialExpired,
  };
}
