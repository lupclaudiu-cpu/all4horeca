import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

type AddLocationInput = {
  restaurantName?: string;
  phone?: string;
  address?: string;
  city?: string;
  companyName?: string;
  vatCui?: string;
};

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Configurarea serverului este incompletă." }, { status: 500 });
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ error: "Autentifică-te ca administrator." }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  const user = userData?.user;
  if (userError || !user) {
    return NextResponse.json({ error: "Sesiunea a expirat. Autentifică-te din nou." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "restaurant_owner") {
    return NextResponse.json({ error: "Doar administratorul unui restaurant poate adăuga locații. Din contul de super admin folosește butonul „Adaugă restaurant”." }, { status: 403 });
  }

  const input = (await request.json()) as AddLocationInput;
  const name = input.restaurantName?.trim() ?? "";
  if (!name) return NextResponse.json({ error: "Numele locației este obligatoriu." }, { status: 400 });
  if (name.length > 120) return NextResponse.json({ error: "Numele locației este prea lung." }, { status: 400 });
  if (!/^[0-9+\s()-]{8,16}$/.test(input.phone?.trim() ?? "")) {
    return NextResponse.json({ error: "Telefonul este invalid." }, { status: 400 });
  }
  if (!input.address?.trim() || !input.city?.trim()) {
    return NextResponse.json({ error: "Adresa și orașul sunt obligatorii." }, { status: 400 });
  }
  if (!input.companyName?.trim() || !input.vatCui?.trim()) {
    return NextResponse.json({ error: "Compania și CUI sunt obligatorii." }, { status: 400 });
  }

  const email = profile.email || user.email || "";
  const { data: restaurantId, error } = await supabase.rpc("self_onboard_restaurant", {
    restaurant_payload: {
      name,
      owner_name: profile.full_name || "",
      owner_email: email,
      phone: input.phone!.trim(),
      email,
      address: input.address.trim(),
      city: input.city.trim(),
      company_name: input.companyName.trim(),
      vat_cui: input.vatCui.trim(),
      primary_color: "#2563eb",
      secondary_color: "#0f172a",
    },
    owner_id: user.id,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ restaurantId }, { status: 201 });
}
