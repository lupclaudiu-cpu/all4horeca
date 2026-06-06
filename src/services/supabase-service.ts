import { categories as mockCategories, products as mockProducts } from "@/data/restaurant";
import { restaurant } from "@/data/restaurant";
import { getSupabaseClient } from "@/lib/supabase/client";
import type {
  Category,
  CreateOrderInput,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  ProductOptionGroup,
  SelectedProductOption,
} from "@/lib/types";

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
  weight: string;
  ingredients: string;
  allergens: string;
  prep_time: string;
  vat_rate: number | string;
  is_recommended: boolean;
  is_bestseller: boolean;
  is_new: boolean;
  sort_order: number;
  categories: { id: string; name: string; sort_order: number } | null;
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
      active: boolean;
      sort_order: number;
    }>;
  }>;
};

type OrderRow = {
  id: string;
  restaurant_id: string;
  order_number: string;
  total: number | string;
  payment_method: PaymentMethod;
  delivery_address: string;
  notes: string;
  status: OrderStatus;
  created_at: string;
  customers: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
  } | null;
  order_items: Array<{
    product_id: string | null;
    product_name: string;
    quantity: number;
    unit_price: number | string;
    line_total: number | string;
    products: { image_url: string | null } | null;
    order_item_options: Array<{
      option_group_id: string | null;
      option_id: string | null;
      group_name: string;
      option_name: string;
      price_delta: number | string;
    }>;
  }>;
};

export type CustomerRecord = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  createdAt: string;
};

export type ProductCatalog = {
  products: Product[];
  categories: Category[];
  source: "supabase" | "mock";
};

const categoryIcon = (name: string) => {
  const normalized = name.toLocaleLowerCase("ro-RO");
  if (normalized.includes("burger")) return "🍔";
  if (normalized.includes("shaorma")) return "🌯";
  if (normalized.includes("pizza")) return "🍕";
  if (normalized.includes("băutur") || normalized.includes("bautur")) return "🥤";
  if (normalized.includes("desert")) return "🍰";
  return "🍽️";
};

export async function getProducts(
  restaurantId = restaurant.id,
): Promise<ProductCatalog> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      products: mockProducts,
      categories: mockCategories,
      source: "mock",
    };
  }

  const [productsResult, categoriesResult] = await Promise.all([
    supabase
    .from("products")
    .select(
      "id, restaurant_id, category_id, name, description, image_url, price, active, sold_out, weight, ingredients, allergens, prep_time, vat_rate, is_recommended, is_bestseller, is_new, sort_order, categories(id, name, sort_order), product_recommendations!product_recommendations_product_id_fkey(recommended_product_id), product_option_groups(id, name, selection_type, required, active, sort_order, product_options(id, name, price_delta, active, sort_order))",
    )
    .eq("restaurant_id", restaurantId)
    .order("sort_order", { ascending: true }),
    supabase
      .from("categories")
      .select("id, restaurant_id, name, sort_order, active")
      .eq("restaurant_id", restaurantId)
      .order("sort_order"),
  ]);

  if (productsResult.error) throw new Error(`Produsele nu au putut fi încărcate: ${productsResult.error.message}`);
  if (categoriesResult.error) throw new Error(`Categoriile nu au putut fi încărcate: ${categoriesResult.error.message}`);

  const rows = (productsResult.data ?? []) as unknown as ProductRow[];
  const categories = (categoriesResult.data ?? []).map<Category>((item) => ({
    id: item.id,
    restaurantId: item.restaurant_id,
    name: item.name,
    icon: categoryIcon(item.name),
    sortOrder: item.sort_order,
    active: item.active,
  }));

  const products = rows.map<Product>((row) => ({
    id: row.id,
    restaurantId: row.restaurant_id,
    categoryId: row.category_id,
    name: row.name,
    shortDescription: row.description,
    description: row.description,
    price: Number(row.price),
    image: row.image_url || "/products/burger-classic.svg",
    prepTime: row.prep_time,
    featured: row.is_recommended,
    active: row.active,
    soldOut: row.sold_out,
    weight: row.weight,
    ingredients: row.ingredients,
    allergens: row.allergens,
    vatRate: Number(row.vat_rate),
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
            active: option.active,
            sortOrder: option.sort_order,
          })),
      })),
  }));

  return { products, categories, source: "supabase" };
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const supabase = getSupabaseClient();
  if (!supabase) return createMemoryOrder(input);

  const subtotal = input.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const orderNumber = createOrderNumber();
  const payload = {
    restaurant_id: input.restaurantId,
    order_number: orderNumber,
    total: subtotal + input.deliveryFee,
    payment_method: input.paymentMethod,
    delivery_address:
      input.orderType === "pickup"
        ? "Ridicare din locație"
        : input.customer.address,
    notes: input.customer.notes,
    customer: {
      name: input.customer.name,
      phone: input.customer.phone,
      email: input.customer.email || "",
    },
    items: input.items.map((item) => ({
      product_id: item.product.id,
      product_name: item.product.name,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      line_total: item.unitPrice * item.quantity,
      options: item.selectedOptions.map((option) => ({
        group_id: option.groupId,
        group_name: option.groupName,
        option_id: option.optionId,
        option_name: option.optionName,
        price_delta: option.priceDelta,
      })),
    })),
  };

  const { data, error } = await supabase.rpc("create_order", {
    order_payload: payload,
  });

  if (error) throw new Error(`Comanda nu a putut fi salvată: ${error.message}`);

  return {
    id: String(data),
    orderNumber,
    restaurantId: input.restaurantId,
    createdAt: new Date().toISOString(),
    customer: input.customer,
    items: input.items.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      image: item.product.image,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      selectedOptions: item.selectedOptions,
    })),
    subtotal,
    deliveryFee: input.deliveryFee,
    total: subtotal + input.deliveryFee,
    paymentMethod: input.paymentMethod,
    orderType: input.orderType,
    status: "Nouă",
  };
}

export async function getOrders(
  restaurantId = restaurant.id,
): Promise<Order[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return memoryOrders;

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, restaurant_id, order_number, total, payment_method, delivery_address, notes, status, created_at, customers(id, name, phone, email), order_items(product_id, product_name, quantity, unit_price, line_total, products(image_url), order_item_options(option_group_id, option_id, group_name, option_name, price_delta))",
    )
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Comenzile nu au putut fi încărcate: ${error.message}`);

  return ((data ?? []) as unknown as OrderRow[]).map(mapOrderRow);
}

export async function getOrderById(orderId: string): Promise<Order> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    const order = memoryOrders.find((item) => item.id === orderId);
    if (!order) throw new Error("Comanda nu a fost găsită.");
    return order;
  }

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, restaurant_id, order_number, total, payment_method, delivery_address, notes, status, created_at, customers(id, name, phone, email), order_items(product_id, product_name, quantity, unit_price, line_total, products(image_url), order_item_options(option_group_id, option_id, group_name, option_name, price_delta))",
    )
    .eq("id", orderId)
    .single();

  if (error) {
    throw new Error(`Comanda live nu a putut fi încărcată: ${error.message}`);
  }
  return mapOrderRow(data as unknown as OrderRow);
}

export function subscribeToOrders({
  restaurantId,
  onNewOrder,
  onStatusChange,
  onConnectionChange,
}: {
  restaurantId: string;
  onNewOrder: (order: Order) => void;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  onConnectionChange?: (connected: boolean) => void;
}) {
  const supabase = getSupabaseClient();
  if (!supabase) return () => {};

  const channel = supabase
    .channel(`restaurant-orders-${restaurantId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "orders",
        filter: `restaurant_id=eq.${restaurantId}`,
      },
      (payload) => {
        const orderId = String(payload.new.id);
        void getOrderById(orderId).then(onNewOrder);
      },
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "order_status_changes",
        filter: `restaurant_id=eq.${restaurantId}`,
      },
      (payload) => {
        onStatusChange(
          String(payload.new.order_id),
          payload.new.new_status as OrderStatus,
        );
      },
    )
    .subscribe((status) => {
      onConnectionChange?.(status === "SUBSCRIBED");
    });

  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    memoryOrders = memoryOrders.map((order) =>
      order.id === orderId ? { ...order, status } : order,
    );
    return;
  }

  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) throw new Error(`Statusul nu a putut fi actualizat: ${error.message}`);
}

export async function getCustomers(): Promise<CustomerRecord[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    const customers = new Map<string, CustomerRecord>();
    memoryOrders.forEach((order) => {
      if (!customers.has(order.customer.phone)) {
        customers.set(order.customer.phone, {
          id: order.customer.phone,
          name: order.customer.name,
          phone: order.customer.phone,
          email: order.customer.email || null,
          createdAt: order.createdAt,
        });
      }
    });
    return [...customers.values()];
  }

  const { data, error } = await supabase
    .from("customers")
    .select("id, name, phone, email, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Clienții nu au putut fi încărcați: ${error.message}`);

  return (data ?? []).map((customer) => ({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    createdAt: customer.created_at,
  }));
}

export async function updateProductActive(
  productId: string,
  active: boolean,
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { error } = await supabase
    .from("products")
    .update({ active })
    .eq("id", productId);

  if (error) {
    throw new Error(
      `Disponibilitatea produsului nu a putut fi actualizată: ${error.message}`,
    );
  }
}

function mapOrderRow(row: OrderRow): Order {
  const orderType =
    row.delivery_address === "Ridicare din locație" ? "pickup" : "delivery";
  const items = row.order_items.map((item) => ({
    productId: item.product_id || item.product_name,
    name: item.product_name,
    image: item.products?.image_url || "/products/burger-classic.svg",
    unitPrice: Number(item.unit_price),
    quantity: item.quantity,
    selectedOptions: item.order_item_options.map<SelectedProductOption>(
      (option) => ({
        groupId: option.option_group_id || option.group_name,
        groupName: option.group_name,
        optionId: option.option_id || option.option_name,
        optionName: option.option_name,
        priceDelta: Number(option.price_delta),
      }),
    ),
  }));
  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  return {
    id: row.id,
    orderNumber: row.order_number,
    restaurantId: row.restaurant_id,
    createdAt: row.created_at,
    customer: {
      name: row.customers?.name || "Client",
      phone: row.customers?.phone || "",
      email: row.customers?.email || "",
      address: orderType === "delivery" ? row.delivery_address : "",
      notes: row.notes,
    },
    items,
    subtotal,
    deliveryFee: Math.max(0, Number(row.total) - subtotal),
    total: Number(row.total),
    paymentMethod: row.payment_method,
    orderType,
    status: row.status,
  };
}

function createOrderNumber() {
  const datePart = new Date().toISOString().slice(2, 10).replaceAll("-", "");
  return `A4H-${datePart}-${Math.floor(1000 + Math.random() * 9000)}`;
}

let memoryOrders: Order[] = [];

function createMemoryOrder(input: CreateOrderInput) {
  const subtotal = input.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const order: Order = {
    id: crypto.randomUUID(),
    orderNumber: createOrderNumber(),
    restaurantId: input.restaurantId,
    createdAt: new Date().toISOString(),
    customer: input.customer,
    items: input.items.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      image: item.product.image,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      selectedOptions: item.selectedOptions,
    })),
    subtotal,
    deliveryFee: input.deliveryFee,
    total: subtotal + input.deliveryFee,
    paymentMethod: input.paymentMethod,
    orderType: input.orderType,
    status: "Nouă",
  };
  memoryOrders = [order, ...memoryOrders];
  return order;
}
