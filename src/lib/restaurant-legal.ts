import { getPublicServerClient } from "@/lib/supabase/public-server";
import type { RestaurantLegalParty } from "@/lib/restaurant-legal-content";

type Row = {
  name: string;
  company_name?: string | null;
  vat_cui?: string | null;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  contact_email?: string | null;
};

/** Datele restaurantului pentru paginile legale, citite din profilul lui (public). */
export async function getRestaurantLegalParty(
  slug: string,
): Promise<RestaurantLegalParty | null> {
  const supabase = getPublicServerClient();
  if (!supabase) return null;
  const run = (columns: string) =>
    supabase
      .from("restaurants")
      .select(columns)
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
  const extended = await run(
    "name, company_name, vat_cui, address, city, phone, email, contact_email",
  );
  const result = extended.error ? await run("name, address, phone, email") : extended;
  const row = result.data as unknown as Row | null;
  if (!row) return null;
  return {
    name: row.name,
    company: row.company_name || null,
    vatCui: row.vat_cui || null,
    address: row.address || null,
    city: row.city || null,
    phone: row.phone || null,
    email: row.email || row.contact_email || null,
  };
}
