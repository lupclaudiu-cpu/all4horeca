import * as XLSX from "xlsx";
import { getSupabaseClient } from "@/lib/supabase/client";
import type {
  Category,
  ProductInput,
  ProductOptionGroup,
} from "@/lib/types";

export async function getDashboardCategories(restaurantId: string) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("categories")
    .select("id, restaurant_id, name, sort_order, active")
    .eq("restaurant_id", restaurantId)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []).map<Category>((item) => ({
    id: item.id,
    restaurantId: item.restaurant_id,
    name: item.name,
    icon: categoryIcon(item.name),
    sortOrder: item.sort_order,
    active: item.active,
  }));
}

export async function createCategory(
  restaurantId: string,
  input: { name: string; sortOrder: number; active: boolean },
) {
  const { error } = await requireSupabase().from("categories").insert({
    restaurant_id: restaurantId,
    name: input.name.trim(),
    sort_order: input.sortOrder,
    active: input.active,
  });
  if (error) throw new Error(error.message);
}

export async function updateCategory(
  categoryId: string,
  input: { name?: string; sortOrder?: number; active?: boolean },
) {
  const payload: Record<string, string | number | boolean> = {};
  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.sortOrder !== undefined) payload.sort_order = input.sortOrder;
  if (input.active !== undefined) payload.active = input.active;
  const { error } = await requireSupabase()
    .from("categories")
    .update(payload)
    .eq("id", categoryId);
  if (error) throw new Error(error.message);
}

export async function deleteCategory(categoryId: string) {
  const { error } = await requireSupabase()
    .from("categories")
    .delete()
    .eq("id", categoryId);
  if (error) {
    throw new Error(
      error.code === "23503"
        ? "Categoria are produse și nu poate fi ștearsă."
        : error.message,
    );
  }
}

export async function saveProduct(
  restaurantId: string,
  input: ProductInput,
  productId?: string,
) {
  const supabase = requireSupabase();
  const payload = {
    restaurant_id: restaurantId,
    category_id: input.categoryId,
    name: input.name.trim(),
    description: input.description.trim(),
    image_url: input.imageUrl || null,
    price: input.price,
    weight: input.weight.trim(),
    ingredients: input.ingredients.trim(),
    allergens: input.allergens.trim(),
    prep_time: input.prepTime.trim(),
    vat_rate: input.vatRate,
    active: input.active,
    sold_out: input.soldOut,
    is_recommended: input.featured,
    is_bestseller: input.bestseller,
    is_new: input.isNew,
    sort_order: input.sortOrder,
  };

  let resolvedProductId = productId;
  if (productId) {
    const { error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", productId);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await supabase
      .from("products")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    resolvedProductId = data.id;
  }

  await supabase
    .from("product_recommendations")
    .delete()
    .eq("product_id", resolvedProductId!);
  if (input.recommendationIds.length) {
    const { error } = await supabase.from("product_recommendations").insert(
      input.recommendationIds.map((recommendedProductId, index) => ({
        product_id: resolvedProductId,
        recommended_product_id: recommendedProductId,
        sort_order: index,
      })),
    );
    if (error) throw new Error(error.message);
  }

  await supabase
    .from("product_images")
    .delete()
    .eq("product_id", resolvedProductId!);
  if (input.imageUrl) {
    const { error } = await supabase.from("product_images").insert({
      product_id: resolvedProductId,
      image_url: input.imageUrl,
      sort_order: 0,
    });
    if (error) throw new Error(error.message);
  }

  return resolvedProductId!;
}

export type RestaurantPresence = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  seoTitle: string;
  seoDescription: string;
  socialImageUrl: string | null;
  publicUrl: string;
};

export async function getRestaurantPresence(restaurantId: string) {
  const supabase = requireSupabase();
  const [restaurantResult, qrResult] = await Promise.all([
    supabase
      .from("restaurants")
      .select("id, name, slug, logo_url, primary_color, secondary_color, seo_title, seo_description, social_image_url")
      .eq("id", restaurantId)
      .single(),
    supabase
      .from("restaurant_qr_codes")
      .select("public_url")
      .eq("restaurant_id", restaurantId)
      .maybeSingle(),
  ]);
  if (restaurantResult.error) throw new Error(restaurantResult.error.message);
  if (qrResult.error) throw new Error(qrResult.error.message);
  const data = restaurantResult.data;
  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    logoUrl: data.logo_url,
    primaryColor: data.primary_color,
    secondaryColor: data.secondary_color,
    seoTitle: data.seo_title || `${data.name} | Comandă online`,
    seoDescription:
      data.seo_description ||
      `Comandă online de la ${data.name} prin ALL4HORECA.`,
    socialImageUrl: data.social_image_url,
    publicUrl: qrResult.data?.public_url || `/clienti/${data.slug}`,
  } satisfies RestaurantPresence;
}

export async function updateRestaurantPresence(
  restaurantId: string,
  input: Pick<
    RestaurantPresence,
    "seoTitle" | "seoDescription" | "socialImageUrl" | "publicUrl"
  >,
) {
  const supabase = requireSupabase();
  const { error } = await supabase
    .from("restaurants")
    .update({
      seo_title: input.seoTitle.trim(),
      seo_description: input.seoDescription.trim(),
      social_image_url: input.socialImageUrl || null,
    })
    .eq("id", restaurantId);
  if (error) throw new Error(error.message);
  const { error: qrError } = await supabase.from("restaurant_qr_codes").upsert(
    {
      restaurant_id: restaurantId,
      public_url: input.publicUrl,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "restaurant_id" },
  );
  if (qrError) throw new Error(qrError.message);
}

export async function updateProductAvailability(
  productId: string,
  updates: { active?: boolean; soldOut?: boolean },
) {
  const payload: { active?: boolean; sold_out?: boolean } = {};
  if (updates.active !== undefined) payload.active = updates.active;
  if (updates.soldOut !== undefined) payload.sold_out = updates.soldOut;
  const { error } = await requireSupabase()
    .from("products")
    .update(payload)
    .eq("id", productId);
  if (error) throw new Error(error.message);
}

export async function getProductOptionGroups(productId: string) {
  const { data, error } = await requireSupabase()
    .from("product_option_groups")
    .select(
      "id, name, selection_type, required, active, sort_order, product_options(id, name, price_delta, active, sort_order)",
    )
    .eq("product_id", productId)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []).map<ProductOptionGroup>((group) => ({
    id: group.id,
    name: group.name,
    selectionType: group.selection_type,
    required: group.required,
    active: group.active,
    sortOrder: group.sort_order,
    options: group.product_options
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((option) => ({
        id: option.id,
        name: option.name,
        priceDelta: Number(option.price_delta),
        active: option.active,
        sortOrder: option.sort_order,
      })),
  }));
}

export async function saveProductOptionGroup(
  productId: string,
  input: Omit<ProductOptionGroup, "id">,
  groupId?: string,
) {
  const supabase = requireSupabase();
  const payload = {
    product_id: productId,
    name: input.name.trim(),
    selection_type: input.selectionType,
    required: input.required,
    active: input.active,
    sort_order: input.sortOrder,
  };
  let resolvedId = groupId;
  if (groupId) {
    const { error } = await supabase
      .from("product_option_groups")
      .update(payload)
      .eq("id", groupId);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await supabase
      .from("product_option_groups")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    resolvedId = data.id;
  }

  await supabase.from("product_options").delete().eq("group_id", resolvedId!);
  if (input.options.length) {
    const { error } = await supabase.from("product_options").insert(
      input.options.map((option) => ({
        group_id: resolvedId,
        name: option.name.trim(),
        price_delta: option.priceDelta,
        active: option.active,
        sort_order: option.sortOrder,
      })),
    );
    if (error) throw new Error(error.message);
  }
  return resolvedId!;
}

export async function deleteProductOptionGroup(groupId: string) {
  const { error } = await requireSupabase()
    .from("product_option_groups")
    .delete()
    .eq("id", groupId);
  if (error) throw new Error(error.message);
}

export async function setProductOptionGroupActive(
  groupId: string,
  active: boolean,
) {
  const { error } = await requireSupabase()
    .from("product_option_groups")
    .update({ active })
    .eq("id", groupId);
  if (error) throw new Error(error.message);
}

export async function uploadProductImage(
  restaurantId: string,
  file: File,
) {
  validateImage(file);
  const supabase = requireSupabase();
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${restaurantId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { contentType: file.type });
  if (error) throw new Error(error.message);
  return supabase.storage.from("product-images").getPublicUrl(path).data
    .publicUrl;
}

export async function importProductsFile(
  restaurantId: string,
  file: File,
) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });
  if (!rows.length) throw new Error("Fișierul nu conține produse.");

  const categories = await getDashboardCategories(restaurantId);
  const categoryMap = new Map(
    categories.map((item) => [normalize(item.name), item.id]),
  );
  let imported = 0;

  for (const row of rows) {
    const categoryName = String(
      row.Categorie || row.categorie || row.Category || "",
    ).trim();
    const productName = String(
      row.Produs || row.produs || row.Product || "",
    ).trim();
    const description = String(
      row.Descriere || row.descriere || row.Description || "",
    ).trim();
    const price = Number(row["Preț"] || row.Pret || row.pret || row.Price);
    if (!categoryName || !productName || !Number.isFinite(price)) continue;

    let categoryId = categoryMap.get(normalize(categoryName));
    if (!categoryId) {
      const { data, error } = await requireSupabase()
        .from("categories")
        .insert({
          restaurant_id: restaurantId,
          name: categoryName,
          sort_order: categoryMap.size + 1,
          active: true,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      const createdCategoryId = String(data.id);
      categoryId = createdCategoryId;
      categoryMap.set(normalize(categoryName), createdCategoryId);
    }

    await saveProduct(restaurantId, {
      name: productName,
      description,
      categoryId,
      price,
      weight: "",
      ingredients: "",
      allergens: "",
      prepTime: "15-25 min",
      vatRate: 9,
      active: true,
      soldOut: false,
      featured: false,
      bestseller: false,
      isNew: false,
      sortOrder: imported + 1,
      recommendationIds: [],
    });
    imported += 1;
  }

  return imported;
}

function requireSupabase() {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase nu este configurat.");
  return supabase;
}

function validateImage(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Imaginea trebuie să fie JPG, PNG sau WEBP.");
  }
  if (file.size > 7 * 1024 * 1024) {
    throw new Error("Imaginea poate avea maximum 7 MB.");
  }
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("ro-RO");
}

function categoryIcon(name: string) {
  const value = normalize(name);
  if (value.includes("burger")) return "🍔";
  if (value.includes("pizza")) return "🍕";
  if (value.includes("shaorma")) return "🌯";
  if (value.includes("băutur") || value.includes("bautur")) return "🥤";
  if (value.includes("desert")) return "🍰";
  return "🍽️";
}
