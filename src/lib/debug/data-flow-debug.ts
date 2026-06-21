"use client";

export type DataFlowDebugSnapshot = {
  provider: string;
  route?: string;
  loading?: boolean;
  restaurantId?: string | null;
  slug?: string | null;
  categoriesCount?: number;
  productsCount?: number;
  ordersCount?: number;
  user?: string | null;
  authStatus?: string;
  error?: string | null;
  query?: string;
  queryStarted?: boolean;
  queryFinished?: boolean;
  queryError?: string | null;
  productsReturned?: number;
  categoriesReturned?: number;
  providerMounted?: boolean;
  restaurantIdDetected?: boolean;
  refreshCalled?: boolean;
  lastStep?: string;
  authLoading?: boolean;
  source?: string;
  updatedAt: string;
};

const DEBUG_EVENT = "antoria:data-flow-debug";

declare global {
  interface Window {
    __ANTORIA_DEBUG_SNAPSHOTS__?: Record<string, DataFlowDebugSnapshot>;
  }
}

export function isDataFlowDebugEnabled() {
  return process.env.NODE_ENV === "development";
}

export function publishDataFlowDebug(
  snapshot: Omit<DataFlowDebugSnapshot, "updatedAt">,
) {
  if (!isDataFlowDebugEnabled() || typeof window === "undefined") return;
  const nextSnapshot: DataFlowDebugSnapshot = {
    ...snapshot,
    updatedAt: new Date().toISOString(),
  };
  window.__ANTORIA_DEBUG_SNAPSHOTS__ = {
    ...(window.__ANTORIA_DEBUG_SNAPSHOTS__ ?? {}),
    [nextSnapshot.provider]: nextSnapshot,
  };
  console.info("[DEBUG]", nextSnapshot);
  window.dispatchEvent(
    new CustomEvent<DataFlowDebugSnapshot>(DEBUG_EVENT, {
      detail: nextSnapshot,
    }),
  );
}

export function subscribeToDataFlowDebug(
  listener: (snapshot: DataFlowDebugSnapshot) => void,
) {
  if (typeof window === "undefined") return () => undefined;
  Object.values(window.__ANTORIA_DEBUG_SNAPSHOTS__ ?? {}).forEach(listener);
  const handleDebugEvent = (event: Event) => {
    listener((event as CustomEvent<DataFlowDebugSnapshot>).detail);
  };
  window.addEventListener(DEBUG_EVENT, handleDebugEvent);
  return () => window.removeEventListener(DEBUG_EVENT, handleDebugEvent);
}
