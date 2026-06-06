import type { GeoPoint } from "@/lib/types";

type MapsEventListener = { remove: () => void };

export type GooglePlaceResult = {
  formatted_address?: string;
  place_id?: string;
  geometry?: {
    location?: {
      lat: () => number;
      lng: () => number;
    };
  };
};

type GoogleAutocomplete = {
  addListener: (
    eventName: "place_changed",
    handler: () => void,
  ) => MapsEventListener;
  getPlace: () => GooglePlaceResult;
};

type GoogleMap = {
  setCenter: (center: GeoPointLiteral) => void;
};

type GoogleMarker = {
  setMap: (map: GoogleMap | null) => void;
};

type GeoPointLiteral = { lat: number; lng: number };

export type GoogleMapsApi = {
  maps: {
    Map: new (
      element: HTMLElement,
      options: {
        center: GeoPointLiteral;
        zoom: number;
        disableDefaultUI?: boolean;
        zoomControl?: boolean;
        gestureHandling?: string;
      },
    ) => GoogleMap;
    Marker: new (options: {
      map: GoogleMap;
      position: GeoPointLiteral;
      title?: string;
      icon?: {
        path: number;
        fillColor: string;
        fillOpacity: number;
        strokeColor: string;
        strokeWeight: number;
        scale: number;
      };
    }) => GoogleMarker;
    SymbolPath: { CIRCLE: number };
    places: {
      Autocomplete: new (
        input: HTMLInputElement,
        options: {
          componentRestrictions?: { country: string };
          fields: string[];
          types?: string[];
        },
      ) => GoogleAutocomplete;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleMapsApi;
    __all4horecaGoogleMapsReady?: () => void;
  }
}

let googleMapsPromise: Promise<GoogleMapsApi> | null = null;

export function getGoogleMapsApiKey() {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";
}

export function loadGoogleMaps(): Promise<GoogleMapsApi> {
  if (window.google?.maps?.places) return Promise.resolve(window.google);
  if (googleMapsPromise) return googleMapsPromise;

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    return Promise.reject(new Error("Google Maps API key is not configured."));
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-all4horeca-google-maps="true"]',
    );

    window.__all4horecaGoogleMapsReady = () => {
      if (window.google) resolve(window.google);
      else reject(new Error("Google Maps could not be initialized."));
    };

    if (existing) {
      existing.addEventListener("error", () =>
        reject(new Error("Google Maps could not be loaded.")),
      );
      return;
    }

    const script = document.createElement("script");
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
      "&libraries=places&language=ro&region=RO&callback=__all4horecaGoogleMapsReady";
    script.async = true;
    script.defer = true;
    script.dataset.all4horecaGoogleMaps = "true";
    script.onerror = () =>
      reject(new Error("Google Maps could not be loaded."));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

export const toGooglePoint = (point: GeoPoint): GeoPointLiteral => ({
  lat: point.latitude,
  lng: point.longitude,
});
