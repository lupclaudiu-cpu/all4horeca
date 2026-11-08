import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Patronul creează un cont de personal (email + parolă) pentru locația lui.
export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) {
    return NextResponse.json({ error: "Configurarea serverului este incompletă." }, { status: 500 });
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Neautentificat." }, { status: 401 });

  const caller = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data: userData } = await caller.auth.getUser(token);
  if (!userData.user) return NextResponse.json({ error: "Neautentificat." }, { status: 401 });

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: profile } = await admin
    .from("profiles")
    .select("role, restaurant_id")
    .eq("id", userData.user.id)
    .single();
  if (!profile || profile.role !== "restaurant_owner" || !profile.restaurant_id) {
    return NextResponse.json({ error: "Doar patronul poate crea conturi de personal." }, { status: 403 });
  }

  const body = (await request.json()) as { email?: string; password?: string; name?: string };
  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";
  const name = body.name?.trim() ?? "";
  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || !name) {
    return NextResponse.json({ error: "Completează nume, email valid și o parolă de minim 8 caractere." }, { status: 400 });
  }

  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });
  if (created.error || !created.data.user) {
    return NextResponse.json({ error: created.error?.message ?? "Contul nu a putut fi creat." }, { status: 400 });
  }

  const { error } = await admin
    .from("profiles")
    .update({ role: "restaurant_staff", restaurant_id: profile.restaurant_id, full_name: name })
    .eq("id", created.data.user.id);
  if (error) {
    await admin.auth.admin.deleteUser(created.data.user.id).catch(() => undefined);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
