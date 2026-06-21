import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { OwnerSelfRegistrationInput } from "@/lib/types";

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return NextResponse.json(
      {
        error:
          "Configurarea Supabase server este incompleta. Este necesar SUPABASE_SERVICE_ROLE_KEY pentru self-service onboarding.",
      },
      { status: 500 },
    );
  }

  const input = (await request.json()) as OwnerSelfRegistrationInput;
  const validationError = validateInput(input);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const ownerResult = await supabase.auth.admin.createUser({
    email: input.email.trim(),
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.contactName.trim() },
  });

  if (ownerResult.error) {
    return NextResponse.json(
      { error: ownerResult.error.message },
      { status: 400 },
    );
  }

  const ownerId = ownerResult.data.user?.id;
  if (!ownerId) {
    return NextResponse.json(
      { error: "Utilizatorul owner nu a putut fi creat." },
      { status: 400 },
    );
  }

  const restaurantPayload = {
    name: input.restaurantName.trim(),
    owner_name: input.contactName.trim(),
    owner_email: input.email.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    address: input.address.trim(),
    city: input.city.trim(),
    company_name: input.companyName.trim(),
    vat_cui: input.vatCui.trim(),
    primary_color: "#2563eb",
    secondary_color: "#0f172a",
  };

  const { data: restaurantId, error: onboardingError } = await supabase.rpc(
    "self_onboard_restaurant",
    {
      restaurant_payload: restaurantPayload,
      owner_id: ownerId,
    },
  );

  if (onboardingError) {
    await supabase.auth.admin.deleteUser(ownerId).catch(() => undefined);
    return NextResponse.json(
      { error: onboardingError.message },
      { status: 400 },
    );
  }

  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("slug, trial_expires_at")
    .eq("id", restaurantId)
    .single();

  if (restaurantError || !restaurant) {
    return NextResponse.json(
      {
        error:
          restaurantError?.message ||
          "Restaurantul a fost creat, dar nu a putut fi citit.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      restaurantId,
      slug: restaurant.slug,
      clientUrl: `/clienti/${restaurant.slug}`,
      dashboardUrl: `/restaurant/${restaurant.slug}`,
      trialExpiresAt: restaurant.trial_expires_at,
    },
    { status: 201 },
  );
}

function validateInput(input: OwnerSelfRegistrationInput) {
  if (!input.contactName?.trim()) return "Numele persoanei de contact este obligatoriu.";
  if (!/^[0-9+\s()-]{8,16}$/.test(input.phone?.trim() ?? "")) {
    return "Telefonul este invalid.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email?.trim() ?? "")) {
    return "Emailul este invalid.";
  }
  if (!input.restaurantName?.trim()) return "Numele restaurantului este obligatoriu.";
  if (!input.companyName?.trim()) return "Compania este obligatorie.";
  if (!input.vatCui?.trim()) return "VAT/CUI este obligatoriu.";
  if (!input.city?.trim()) return "Orasul este obligatoriu.";
  if (!input.address?.trim()) return "Adresa este obligatorie.";
  if (!input.password || input.password.length < 8) {
    return "Parola trebuie sa aiba minimum 8 caractere.";
  }
  if (input.password !== input.confirmPassword) {
    return "Parolele nu coincid.";
  }
  return null;
}
