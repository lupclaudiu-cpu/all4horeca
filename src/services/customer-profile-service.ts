import { getSupabaseClient } from "@/lib/supabase/client";

export type SavedCustomerProfile = {
  name: string;
  phone: string;
  email: string;
  address: string;
};

export type SavedCustomerAddress = {
  id: string;
  label: string;
  address: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  isDefault: boolean;
};

const PROFILE_STORAGE_KEY = "antoria-customer-profile";
const ADDRESSES_STORAGE_KEY = "antoria-customer-addresses";

export function getLocalCustomerProfile(): SavedCustomerProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!value) return null;
    const profile = JSON.parse(value) as Partial<SavedCustomerProfile>;
    return {
      name: profile.name ?? "",
      phone: profile.phone ?? "",
      email: profile.email ?? "",
      address: profile.address ?? "",
    };
  } catch {
    window.localStorage.removeItem(PROFILE_STORAGE_KEY);
    return null;
  }
}

export function saveLocalCustomerProfile(profile: SavedCustomerProfile) {
  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export function getLocalCustomerAddresses(): SavedCustomerAddress[] {
  if (typeof window === "undefined") return [];
  try {
    const value = window.localStorage.getItem(ADDRESSES_STORAGE_KEY);
    return value ? (JSON.parse(value) as SavedCustomerAddress[]) : [];
  } catch {
    window.localStorage.removeItem(ADDRESSES_STORAGE_KEY);
    return [];
  }
}

export function saveLocalCustomerAddresses(addresses: SavedCustomerAddress[]) {
  window.localStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(addresses));
  const defaultAddress = addresses.find((item) => item.isDefault);
  if (defaultAddress) {
    const profile = getLocalCustomerProfile();
    if (profile) {
      saveLocalCustomerProfile({ ...profile, address: defaultAddress.address });
    }
  }
}

export async function getDatabaseCustomerProfile() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("get_my_customer_profile");
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : null;
  if (!row) return null;
  return {
    name: row.customer_name ?? "",
    phone: row.customer_phone ?? "",
    email: row.customer_email ?? "",
    address: row.customer_address ?? "",
  } satisfies SavedCustomerProfile;
}

export async function saveDatabaseCustomerProfile(
  profile: SavedCustomerProfile,
) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  const { error } = await supabase.rpc("save_my_customer_profile", {
    customer_name_input: profile.name,
    customer_phone_input: profile.phone,
    customer_address_input: profile.address,
    customer_email_input: profile.email,
  });
  if (error) throw new Error(error.message);
}

export async function getDatabaseCustomerAddresses() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("get_my_customer_addresses");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.address_id),
    label: String(row.address_label),
    address: String(row.address_text),
    latitude:
      typeof row.latitude === "number" ? row.latitude : undefined,
    longitude:
      typeof row.longitude === "number" ? row.longitude : undefined,
    placeId: row.place_id ? String(row.place_id) : undefined,
    isDefault: Boolean(row.is_default),
  })) satisfies SavedCustomerAddress[];
}

export async function saveDatabaseCustomerAddress(
  address: SavedCustomerAddress,
) {
  const supabase = getSupabaseClient();
  if (!supabase) return address.id;
  const { data, error } = await supabase.rpc("save_my_customer_address", {
    address_id_input: address.id.startsWith("local-") ? null : address.id,
    address_label_input: address.label,
    address_text_input: address.address,
    latitude_input: address.latitude ?? null,
    longitude_input: address.longitude ?? null,
    place_id_input: address.placeId ?? null,
    is_default_input: address.isDefault,
  });
  if (error) throw new Error(error.message);
  return String(data);
}

export async function deleteDatabaseCustomerAddress(addressId: string) {
  if (addressId.startsWith("local-")) return;
  const supabase = getSupabaseClient();
  if (!supabase) return;
  const { error } = await supabase.rpc("delete_my_customer_address", {
    address_id_input: addressId,
  });
  if (error) throw new Error(error.message);
}
