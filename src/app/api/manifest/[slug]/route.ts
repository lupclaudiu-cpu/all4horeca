import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let name = "ALL4HORECA";
  let logo: string | null = null;
  let color = "#14231D";

  if (url && key) {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data } = await supabase
      .from("restaurants")
      .select("name, logo_url, primary_color")
      .eq("slug", slug)
      .maybeSingle();
    if (data) {
      name = data.name || name;
      logo = data.logo_url;
      color = data.primary_color || color;
    }
  }

  const fallback = [
    { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
  ];
  const icons = logo
    ? [
        { src: logo, sizes: "192x192", purpose: "any" },
        { src: logo, sizes: "512x512", purpose: "any" },
      ]
    : fallback;

  const manifest = {
    id: `/clienti/${slug}`,
    name,
    short_name: name.slice(0, 12),
    start_url: `/clienti/${slug}`,
    scope: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: color,
    lang: "ro",
    icons,
  };
  return new NextResponse(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=300",
    },
  });
}
