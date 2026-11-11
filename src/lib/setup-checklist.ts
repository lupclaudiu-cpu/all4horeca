/**
 * Lista „Configurează-ți restaurantul": pașii sunt calculați doar din date,
 * fără apeluri la server, ca să poată fi testați cu node:test.
 */

export type SetupStepId =
  | "profile"
  | "schedule"
  | "categories"
  | "products"
  | "payments"
  | "promotion"
  | "test_order"
  | "share_link";

export type SetupStep = {
  id: SetupStepId;
  title: string;
  description: string;
  href: string;
  actionLabel: string;
  optional: boolean;
  done: boolean;
};

export type SetupChecklistInput = {
  restaurant: {
    name?: string | null;
    logoUrl?: string | null;
    phone?: string | null;
    address?: string | null;
    createdAt?: string | null;
  };
  settings: {
    /** Momentul ultimei salvări a setărilor (restaurant_settings.updated_at). */
    updatedAt?: string | null;
    schedule: Array<{ enabled: boolean }>;
    acceptsDelivery: boolean;
    acceptsPickup: boolean;
    acceptsCash: boolean;
    acceptsCard: boolean;
  };
  categoriesCount: number;
  products: Array<{ price: number; active?: boolean }>;
  promotionsCount: number;
  ordersCount: number;
  publicLinkUsed: boolean;
};

export const MIN_PRODUCTS_WITH_PRICE = 5;

/**
 * Setările sunt create automat la înregistrare. Le considerăm „setate de administrator"
 * doar dacă au fost salvate cel puțin o dată după crearea restaurantului.
 */
const SETTINGS_SAVED_GRACE_MS = 2 * 60 * 1000;

export function settingsSavedByAdministrator(
  createdAt?: string | null,
  updatedAt?: string | null,
) {
  if (!updatedAt) return false;
  const updated = new Date(updatedAt).getTime();
  if (!Number.isFinite(updated)) return false;
  if (!createdAt) return true;
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return true;
  return updated - created > SETTINGS_SAVED_GRACE_MS;
}

export function buildSetupChecklist(input: SetupChecklistInput) {
  const { restaurant, settings } = input;
  const settingsSaved = settingsSavedByAdministrator(
    restaurant.createdAt,
    settings.updatedAt,
  );
  const pricedProducts = input.products.filter(
    (product) => product.active !== false && Number(product.price) > 0,
  ).length;

  const steps: SetupStep[] = [
    {
      id: "profile",
      title: "Date restaurant și logo",
      description: "Nume, logo, telefon și adresă, afișate clienților în meniu.",
      href: "/restaurant/dashboard/profil",
      actionLabel: "Completează profilul",
      optional: false,
      done: Boolean(
        restaurant.name?.trim() &&
          restaurant.logoUrl?.trim() &&
          restaurant.phone?.trim() &&
          restaurant.address?.trim(),
      ),
    },
    {
      id: "schedule",
      title: "Program setat",
      description: "Zilele și orele în care primești comenzi.",
      href: "/restaurant/dashboard/setari",
      actionLabel: "Setează programul",
      optional: false,
      done: settingsSaved && settings.schedule.some((day) => day.enabled),
    },
    {
      id: "categories",
      title: "Categorii adăugate",
      description: "De exemplu: Pizza, Burgeri, Băuturi.",
      href: "/restaurant/dashboard/categorii",
      actionLabel: "Adaugă categorii",
      optional: false,
      done: input.categoriesCount > 0,
    },
    {
      id: "products",
      title: `Cel puțin ${MIN_PRODUCTS_WITH_PRICE} produse cu preț`,
      description:
        pricedProducts >= MIN_PRODUCTS_WITH_PRICE ?
           `${pricedProducts} produse active cu preț.`
          : `Ai ${pricedProducts} din ${MIN_PRODUCTS_WITH_PRICE}. Folosește adăugarea rapidă sau importul.`,
      href: "/restaurant/dashboard/produse?rapid=1",
      actionLabel: "Adaugă produse",
      optional: false,
      done: pricedProducts >= MIN_PRODUCTS_WITH_PRICE,
    },
    {
      id: "payments",
      title: "Plăți și livrare setate",
      description: "Livrare sau ridicare, numerar sau card, taxe și zone.",
      href: "/restaurant/dashboard/setari",
      actionLabel: "Setează plățile",
      optional: false,
      done:
        settingsSaved &&
        (settings.acceptsDelivery || settings.acceptsPickup) &&
        (settings.acceptsCash || settings.acceptsCard),
    },
    {
      id: "promotion",
      title: "Promoție",
      description: "Opțional: o reducere la prima comandă atrage clienți noi.",
      href: "/restaurant/dashboard/promotii",
      actionLabel: "Creează o promoție",
      optional: true,
      done: input.promotionsCount > 0,
    },
    {
      id: "test_order",
      title: "Comandă de test făcută",
      description: "Plasează o comandă din meniul public și urmărește-o în Comenzi.",
      href: "/restaurant/dashboard/meniu",
      actionLabel: "Deschide meniul public",
      optional: false,
      done: input.ordersCount > 0,
    },
    {
      id: "share_link",
      title: "Link-ul sau QR-ul copiat ori deschis",
      description: "Pune link-ul pe Facebook, Google și pe mese (cod QR).",
      href: "/restaurant/dashboard/prezenta",
      actionLabel: "Vezi link-ul și QR-ul",
      optional: false,
      done: input.publicLinkUsed,
    },
  ];

  const required = steps.filter((step) => !step.optional);
  const requiredDone = required.filter((step) => step.done).length;
  return {
    steps,
    requiredDone,
    requiredTotal: required.length,
    allRequiredDone: requiredDone === required.length,
  };
}

/** Cheie localStorage: administratorul a copiat/deschis link-ul public sau QR-ul. */
export function publicLinkStorageKey(restaurantId: string) {
  return `all4horeca-public-link-used:${restaurantId}`;
}

export function markPublicLinkUsed(restaurantId?: string | null) {
  if (!restaurantId) return;
  try {
    window.localStorage.setItem(publicLinkStorageKey(restaurantId), "1");
  } catch {
    // localStorage indisponibil (mod privat): ignorăm.
  }
}

export function readPublicLinkUsed(restaurantId?: string | null) {
  if (!restaurantId) return false;
  try {
    return window.localStorage.getItem(publicLinkStorageKey(restaurantId)) === "1";
  } catch {
    return false;
  }
}
