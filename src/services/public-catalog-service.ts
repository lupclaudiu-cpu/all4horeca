import type { Category, Product, ProductOptionGroup } from "@/lib/types";
import { getPublicServerClient } from "@/lib/supabase/public-server";

type ProductRow = {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description: string;
  image_url: string | null;
  price: number | string;
  active: boolean;
  sold_out: boolean;
  weight: string | null;
  ingredients: string | null;
  allergens: string | null;
  prep_time: string | null;
  vat_rate: number | string | null;
  is_recommended: boolean;
  is_bestseller: boolean;
  is_new: boolean;
  sort_order: number;
  product_recommendations: Array<{ recommended_product_id: string }>;
  product_option_groups: Array<{
    id: string;
    name: string;
    selection_type: "single" | "multiple";
    required: boolean;
    active: boolean;
    sort_order: number;
    product_options: Array<{
      id: string;
      name: string;
      price_delta: number | string;
      multiply_by_product_quantity: boolean;
      active: boolean;
      sort_order: number;
    }>;
  }>;
};

type CategoryRow = {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
  active: boolean;
};

export type PublicCatalog = {
  products: Product[];
  categories: Category[];
  error: string | null;
};

export type PublicProductDetail = PublicCatalog & {
  product: Product | null;
};

export async function getPublicCatalog(
  restaurantId: string,
): Promise<PublicCatalog> {
  const supabase = getPublicServerClient();
  if (!supabase) {
    return {
      products: [],
      categories: [],
      error: "Supabase nu este configurat.",
    };
  }

  const [productsResult, categoriesResult] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, restaurant_id, category_id, name, description, image_url, price, active, sold_out, weight, ingredients, allergens, prep_time, vat_rate, is_recommended, is_bestseller, is_new, sort_order, product_recommendations!product_recommendations_product_id_fkey(recommended_product_id), product_option_groups(id, name, selection_type, required, active, sort_order, product_options(id, name, price_delta, multiply_by_product_quantity, active, sort_order))",
      )
      .eq("restaurant_id", restaurantId)
      .eq("active", true)
      .eq("sold_out", false)
      .order("sort_order", { ascending: true }),
    supabase
      .from("categories")
      .select("id, restaurant_id, name, sort_order, active")
      .eq("restaurant_id", restaurantId)
      .eq("active", true)
      .order("sort_order"),
  ]);

  const error =
    productsResult.error?.message ?? categoriesResult.error?.message ?? null;

  const categories = ((categoriesResult.data ?? []) as CategoryRow[]).map(
    mapCategoryRow,
  );

  const products = ((productsResult.data ?? []) as unknown as ProductRow[]).map(
    mapProductRow,
  );

  return { products, categories, error };
}

export async function getPublicProductDetail(
  productId: string,
): Promise<PublicProductDetail> {
  const supabase = getPublicServerClient();
  if (!supabase) {
    return {
      product: null,
      products: [],
      categories: [],
      error: "Supabase nu este configurat.",
    };
  }

  const productResult = await supabase
    .from("products")
    .select(
      "id, restaurant_id, category_id, name, description, image_url, price, active, sold_out, weight, ingredients, allergens, prep_time, vat_rate, is_recommended, is_bestseller, is_new, sort_order, product_recommendations!product_recommendations_product_id_fkey(recommended_product_id), product_option_groups(id, name, selection_type, required, active, sort_order, product_options(id, name, price_delta, multiply_by_product_quantity, active, sort_order))",
    )
    .eq("id", productId)
    .eq("active", true)
    .eq("sold_out", false)
    .maybeSingle();

  if (productResult.error) {
    return {
      product: null,
      products: [],
      categories: [],
      error: productResult.error.message,
    };
  }

  if (!productResult.data) {
    return {
      product: null,
      products: [],
      categories: [],
      error: null,
    };
  }

  const product = mapProductRow(productResult.data as unknown as ProductRow);
  const catalog = await getPublicCatalog(product.restaurantId);
  return {
    product: catalog.products.find((item) => item.id === product.id) ?? product,
    products: catalog.products,
    categories: catalog.categories,
    error: catalog.error,
  };
}

function mapCategoryRow(item: CategoryRow): Category {
  return {
    id: item.id,
    restaurantId: item.restaurant_id,
    name: item.name,
    icon: categoryIcon(item.name),
    sortOrder: item.sort_order,
    active: item.active,
  };
}

function mapProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    categoryId: row.category_id,
    name: row.name,
    shortDescription: row.description,
    description: row.description,
    price: Number(row.price),
    image: row.image_url || "/products/burger-classic.svg",
    prepTime: row.prep_time ?? "",
    featured: row.is_recommended,
    active: row.active,
    soldOut: row.sold_out,
    weight: row.weight ?? "",
    ingredients: row.ingredients ?? "",
    allergens: row.allergens ?? "",
    vatRate: Number(row.vat_rate ?? 0),
    bestseller: row.is_bestseller,
    isNew: row.is_new,
    sortOrder: row.sort_order,
    recommendationIds: (row.product_recommendations ?? []).map(
      (item) => item.recommended_product_id,
    ),
    optionGroups: (row.product_option_groups ?? [])
      .filter((group) => group.active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map<ProductOptionGroup>((group) => ({
        id: group.id,
        name: group.name,
        selectionType: group.selection_type,
        required: group.required,
        active: group.active,
        sortOrder: group.sort_order,
        options: group.product_options
          .filter((option) => option.active)
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((option) => ({
            id: option.id,
            name: option.name,
            priceDelta: Number(option.price_delta),
            multiplyByProductQuantity: option.multiply_by_product_quantity,
            active: option.active,
            sortOrder: option.sort_order,
          })),
      })),
  };
}

function categoryIcon(name: string) {
  const normalized = name.toLocaleLowerCase("ro-RO");
  if (normalized.includes("burger")) return "🍔";
  if (normalized.includes("shaorma")) return "🌯";
  if (normalized.includes("pizza")) return "🍕";
  if (normalized.includes("băutur") || normalized.includes("bautur")) {
    return "🥤";
  }
  if (normalized.includes("desert")) return "🍰";
  return "🍽️";
}
