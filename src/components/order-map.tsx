"use client";

import { useEffect, useRef, useState } from "react";
import {
  getGoogleMapsApiKey,
  loadGoogleMaps,
  toGooglePoint,
} from "@/lib/google-maps";
import type { DeliveryLocation, GeoPoint } from "@/lib/types";

export function OrderMap({
  destination,
  courierLocation,
  compact = false,
}: {
  destination?: DeliveryLocation;
  courierLocation?: GeoPoint;
  compact?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !destination || !getGoogleMapsApiKey()) return;

    let destinationMarker: { setMap: (map: null) => void } | undefined;
    let courierMarker: { setMap: (map: null) => void } | undefined;

    void loadGoogleMaps()
      .then((google) => {
        const map = new google.maps.Map(container, {
          center: toGooglePoint(destination),
          zoom: compact ? 15 : 16,
          disableDefaultUI: compact,
          zoomControl: !compact,
          gestureHandling: compact ? "none" : "cooperative",
        });
        destinationMarker = new google.maps.Marker({
          map,
          position: toGooglePoint(destination),
          title: "Adresă livrare",
        });

        // Ready for future live tracking: pass courierLocation when available.
        if (courierLocation) {
          courierMarker = new google.maps.Marker({
            map,
            position: toGooglePoint(courierLocation),
            title: "Livrator",
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: "#0f172a",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3,
              scale: 9,
            },
          });
        }
      })
      .catch(() => setFailed(true));

    return () => {
      destinationMarker?.setMap(null);
      courierMarker?.setMap(null);
    };
  }, [compact, courierLocation, destination]);

  if (!destination) {
    return (
      <MapFallback text="Comanda nu are coordonate. Adresa a fost introdusă manual." />
    );
  }

  if (!getGoogleMapsApiKey()) {
    return (
      <MapFallback
        text={`${destination.formattedAddress} · ${destination.latitude.toFixed(5)}, ${destination.longitude.toFixed(5)}`}
      />
    );
  }

  if (failed) return <MapFallback text="Harta nu a putut fi încărcată." />;

  return (
    <div
      ref={containerRef}
      className={`w-full overflow-hidden rounded-2xl bg-[#e2e8f0] ${
        compact ? "h-40" : "h-72"
      }`}
      aria-label="Hartă adresă livrare"
    />
  );
}

function MapFallback({ text }: { text: string }) {
  return (
    <div className="grid min-h-32 place-items-center rounded-2xl border border-dashed border-[#d8d1ca] bg-[#f8fafc] px-5 text-center text-xs font-bold leading-5 text-[#64748b]">
      {text}
    </div>
  );
}
