import type { MetadataRoute } from "next";

// Aplicația de comenzi nu este indexată; promovarea o face fiecare administrator.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
