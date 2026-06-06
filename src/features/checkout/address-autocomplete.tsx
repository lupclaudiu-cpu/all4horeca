"use client";

import { useEffect, useRef, useState } from "react";
import {
  getGoogleMapsApiKey,
  loadGoogleMaps,
} from "@/lib/google-maps";
import type { DeliveryLocation } from "@/lib/types";

export function AddressAutocomplete({
  value,
  location,
  error,
  onChange,
}: {
  value: string;
  location?: DeliveryLocation;
  error?: string;
  onChange: (address: string, location?: DeliveryLocation) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(Boolean(getGoogleMapsApiKey()));
  const [mapsError, setMapsError] = useState<string | null>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input || !getGoogleMapsApiKey()) return;

    let active = true;
    let listener: { remove: () => void } | undefined;

    void loadGoogleMaps()
      .then((google) => {
        if (!active) return;
        const autocomplete = new google.maps.places.Autocomplete(input, {
          componentRestrictions: { country: "ro" },
          fields: ["formatted_address", "geometry", "place_id"],
          types: ["address"],
        });
        listener = autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          const point = place.geometry?.location;
          if (!point || !place.formatted_address) return;
          onChange(place.formatted_address, {
            formattedAddress: place.formatted_address,
            latitude: point.lat(),
            longitude: point.lng(),
            placeId: place.place_id,
          });
        });
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setLoading(false);
        setMapsError("Sugestiile Google nu sunt disponibile. Adresa poate fi introdusă manual.");
      });

    return () => {
      active = false;
      listener?.remove();
    };
  }, [onChange]);

  return (
    <label className="block">
      <span className="text-sm font-extrabold">Adresă</span>
      <div className="relative">
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Începe să scrii strada și numărul"
          autoComplete="street-address"
          className={`mt-2 w-full rounded-2xl border bg-[#fcfaf8] px-4 py-3 pr-24 text-sm outline-none transition placeholder:text-[#aaa39d] focus:ring-4 ${
            error
              ? "border-red-400 focus:border-red-400 focus:ring-red-100"
              : "border-[#e6e0db] focus:border-[#ff5a1f] focus:ring-[#ff5a1f]/10"
          }`}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 mt-1 -translate-y-1/2 text-[10px] font-black uppercase tracking-wide text-[#8b8580]">
          {loading ? "Se încarcă" : location ? "Adresă aleasă" : "Google"}
        </span>
      </div>
      {location && (
        <span className="mt-1.5 block text-xs font-bold text-emerald-700">
          Locație confirmată: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
        </span>
      )}
      {!getGoogleMapsApiKey() && (
        <span className="mt-1.5 block text-xs text-[#8b8580]">
          Autocomplete-ul va fi activ după configurarea cheii Google Maps.
        </span>
      )}
      {mapsError && (
        <span className="mt-1.5 block text-xs text-amber-700">{mapsError}</span>
      )}
      {error && (
        <span className="mt-1.5 block text-xs font-bold text-red-600">{error}</span>
      )}
    </label>
  );
}
