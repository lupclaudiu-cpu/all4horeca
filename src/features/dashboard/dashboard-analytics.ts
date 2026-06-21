import type { Category, Order, Product } from "@/lib/types";
import { addMoney, fromCents, sumMoney, toCents } from "@/lib/money";
import {
  buildOrderPerformanceRows,
  calculateOrderPerformance,
} from "@/features/dashboard/order-performance";

export function buildDashboardAnalytics(
  orders: Order[],
  products: Product[],
  categories: Category[],
  options?: {
    range?: { start: Date; end: Date };
  },
) {
  const validOrders = orders.filter((order) => order.status !== "Anulată");
  const todayOrders = validOrders.filter((order) => isSameDay(order.createdAt));
  const activeOrders = orders.filter((order) =>
    ["Nouă", "Acceptată", "În preparare", "În livrare"].includes(order.status),
  );
  const performanceRows = buildOrderPerformanceRows(orders);
  const performance = calculateOrderPerformance(performanceRows);
  const productMap = new Map(products.map((product) => [product.id, product]));
  const categoryMap = new Map(
    categories.map((category) => [category.id, category.name]),
  );
  const productStats = new Map<
    string,
    { name: string; quantity: number; revenue: number; category: string }
  >();
  const categoryStats = new Map<
    string,
    { name: string; quantity: number; revenue: number }
  >();
  const customerStats = new Map<
    string,
    {
      name: string;
      phone: string;
      orders: number;
      revenue: number;
      lastOrder: string;
    }
  >();

  validOrders.forEach((order) => {
    const customer = customerStats.get(order.customer.phone);
    if (customer) {
      customer.orders += 1;
      customer.revenue = addMoney(customer.revenue, order.total);
      if (new Date(order.createdAt) > new Date(customer.lastOrder)) {
        customer.lastOrder = order.createdAt;
        customer.name = order.customer.name;
      }
    } else {
      customerStats.set(order.customer.phone, {
        name: order.customer.name,
        phone: order.customer.phone,
        orders: 1,
        revenue: order.total,
        lastOrder: order.createdAt,
      });
    }

    order.items.forEach((item) => {
      const product = productMap.get(item.productId);
      const categoryName = product
        ? (categoryMap.get(product.categoryId) ?? "Fără categorie")
        : "Produs arhivat";
      const currentProduct = productStats.get(item.productId);
      if (currentProduct) {
        currentProduct.quantity += item.quantity;
        currentProduct.revenue = addMoney(
          currentProduct.revenue,
          item.lineTotal,
        );
      } else {
        productStats.set(item.productId, {
          name: item.name,
          quantity: item.quantity,
          revenue: item.lineTotal,
          category: categoryName,
        });
      }
      const currentCategory = categoryStats.get(categoryName);
      if (currentCategory) {
        currentCategory.quantity += item.quantity;
        currentCategory.revenue = addMoney(
          currentCategory.revenue,
          item.lineTotal,
        );
      } else {
        categoryStats.set(categoryName, {
          name: categoryName,
          quantity: item.quantity,
          revenue: item.lineTotal,
        });
      }
    });
  });

  const totalSales = sumMoney(validOrders.map((order) => order.total));
  const todaySales = sumMoney(todayOrders.map((order) => order.total));
  const activeCustomerCutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const activeCustomers = [...customerStats.values()].filter(
    (customer) => new Date(customer.lastOrder).getTime() >= activeCustomerCutoff,
  ).length;

  return {
    totalSales,
    todaySales,
    todayOrders: todayOrders.length,
    orderCount: validOrders.length,
    activeOrders,
    activeCustomers,
    averageOrder: validOrders.length ?
       fromCents(Math.round(toCents(totalSales) / validOrders.length))
      : 0,
    averagePreparationMinutes: performance.averagePreparationMinutes,
    performance,
    performanceRows,
    dailySales: options?.range
      ?
       buildDailySalesForRange(
          validOrders,
          options.range.start,
          options.range.end,
        )
      : buildDailySales(validOrders, 7),
    products: [...productStats.values()].sort(
      (left, right) => right.quantity - left.quantity,
    ),
    categories: [...categoryStats.values()].sort(
      (left, right) => right.revenue - left.revenue,
    ),
    customers: [...customerStats.values()].sort(
      (left, right) => right.revenue - left.revenue,
    ),
  };
}

function buildDailySalesForRange(
  orders: Order[],
  start: Date,
  end: Date,
) {
  const dayCount = Math.max(
    1,
    Math.min(
      366,
      Math.ceil((end.getTime() - start.getTime()) / 86_400_000),
    ),
  );
  const formatter = new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "2-digit",
  });
  return Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(start);
    date.setDate(date.getDate() + index);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    const matching = orders.filter((order) => {
      const createdAt = new Date(order.createdAt);
      return createdAt >= date && createdAt < nextDate;
    });
    return {
      date: date.toISOString().slice(0, 10),
      label: formatter.format(date),
      sales: sumMoney(matching.map((order) => order.total)),
      orders: matching.length,
    };
  });
}

function buildDailySales(orders: Order[], days: number) {
  const formatter = new Intl.DateTimeFormat("ro-RO", { weekday: "short" });
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (days - 1 - index));
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    const matching = orders.filter((order) => {
      const createdAt = new Date(order.createdAt);
      return createdAt >= date && createdAt < nextDate;
    });
    return {
      date: date.toISOString().slice(0, 10),
      label: formatter.format(date).replace(".", ""),
      sales: sumMoney(matching.map((order) => order.total)),
      orders: matching.length,
    };
  });
}

function isSameDay(value: string) {
  const date = new Date(value);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}
