import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { RestaurantOnboardingInput } from "@/lib/types";

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json(
      {
        error:
          "Lipsesc NEXT_PUBLIC_SUPABASE_URL sau NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      },
      { status: 500 },
    );
  }

  const cookieStore = await cookies();
  const authClient = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll() {},
    },
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

  const input = (await request.json()) as RestaurantOnboardingInput;
  if (
    !input.name?.trim() ||
    !input.ownerName?.trim() ||
    !input.ownerEmail?.trim() ||
    input.ownerPassword?.length < 8
  ) {
    return NextResponse.json(
      { error: "Datele restaurantului sau ale ownerului sunt incomplete." },
      { status: 400 },
    );
  }

  const ownerAuthClient = createClient(
    supabaseUrl,
    serviceRoleKey || anonKey,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const ownerResult = serviceRoleKey
    ? await ownerAuthClient.auth.admin.createUser({
        email: input.ownerEmail.trim(),
        password: input.ownerPassword,
        email_confirm: true,
        user_metadata: { full_name: input.ownerName.trim() },
      })
    : await ownerAuthClient.auth.signUp({
        email: input.ownerEmail.trim(),
        password: input.ownerPassword,
        options: { data: { full_name: input.ownerName.trim() } },
      });

  if (ownerResult.error) {
    return NextResponse.json(
      { error: ownerResult.error.message },
      { status: 400 },
    );
  }

  const ownerId = ownerResult.data.user?.id;
  if (
    !ownerId ||
    (!serviceRoleKey && !ownerResult.data.user?.identities?.length)
  ) {
    return NextResponse.json(
      {
        error:
          "Emailul ownerului este deja folosit. Foloseste un email nou sau configureaza SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 400 },
    );
  }

  const restaurantPayload = {
    name: input.name.trim(),
    logo_url: input.logoUrl,
    primary_color: input.primaryColor,
    secondary_color: input.secondaryColor,
    address: input.address.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    seo_title: `${input.name.trim()} | Comanda online`,
    seo_description: `Comanda online de la ${input.name.trim()} prin ANTORIA.`,
    social_image_url: input.logoUrl,
    opening_time: input.openingTime,
    closing_time: input.closingTime,
    working_days: input.workingDays,
    accepts_delivery: input.acceptsDelivery,
    accepts_pickup: input.acceptsPickup,
    accepts_cash: input.acceptsCash,
    accepts_card: input.acceptsCard,
    delivery_fee: input.deliveryFee,
    free_delivery_threshold: input.freeDeliveryThreshold,
    owner_name: input.ownerName.trim(),
    owner_email: input.ownerEmail.trim(),
  };

  const { data: restaurantId, error: restaurantError } = await authClient.rpc(
    "onboard_restaurant",
    {
      restaurant_payload: restaurantPayload,
      owner_id: ownerId,
    },
  );

  if (restaurantError) {
    if (serviceRoleKey) {
      await ownerAuthClient.auth.admin.deleteUser(ownerId);
    }
    return NextResponse.json(
      { error: restaurantError.message },
      { status: 400 },
    );
  }

  const { data: createdRestaurant, error: createdRestaurantError } =
    await authClient
      .from("restaurants")
      .select("slug")
      .eq("id", restaurantId)
      .single();
  if (createdRestaurantError || !createdRestaurant) {
    return NextResponse.json(
      {
        error:
          createdRestaurantError?.message ||
          "Restaurantul a fost creat, dar slugul nu a putut fi citit.",
      },
      { status: 500 },
    );
  }

  const resolvedSlug = createdRestaurant.slug;
  const clientUrl = `/clienti/${resolvedSlug}`;

  return NextResponse.json(
    {
      restaurantId,
      slug: resolvedSlug,
      clientUrl,
      dashboardUrl: `/restaurant/${resolvedSlug}`,
      qrUrl: clientUrl,
      ownerRequiresEmailConfirmation: false,
    },
    { status: 201 },
  );
}
