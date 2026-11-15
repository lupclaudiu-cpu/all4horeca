import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Configurarea serverului este incompletă." },
      { status: 500 },
    );
  }

  const cookieStore = await cookies();
  const authClient = createServerClient(supabaseUrl, anonKey, {
    cookies: { getAll: () => cookieStore.getAll(), setAll() {} },
  });
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Neautorizat." }, { status: 401 });
  }
  const { data: requester } = await authClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (requester?.role !== "super_admin") {
    return NextResponse.json({ error: "Acces interzis." }, { status: 403 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: restaurant } = await admin
    .from("restaurants")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant inexistent." }, { status: 404 });
  }

  // Conturile administratorilor acestui restaurant (niciodată super admin).
  const { data: owners } = await admin
    .from("profiles")
    .select("id")
    .eq("restaurant_id", id)
    .eq("role", "restaurant_owner");
  const ownerIds = (owners ?? [])
    .map((row) => row.id as string)
    .filter((ownerId) => ownerId !== user.id);

  // Comenzile au FK restrictiv: se șterg întâi, apoi restaurantul (restul se șterge în cascadă).
  const { error: ordersError } = await admin
    .from("orders")
    .delete()
    .eq("restaurant_id", id);
  if (ordersError) {
    return NextResponse.json({ error: ordersError.message }, { status: 400 });
  }
  const { error: deleteError } = await admin
    .from("restaurants")
    .delete()
    .eq("id", id);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 });
  }

  for (const ownerId of ownerIds) {
    await admin.auth.admin.deleteUser(ownerId);
  }

  return NextResponse.json({ ok: true });
}
