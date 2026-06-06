import {
  createOrder,
  getOrders,
  updateOrderStatus,
} from "@/services/supabase-service";
import type { CreateOrderInput, Order, OrderStatus } from "@/lib/types";

export interface OrderRepository {
  list(restaurantId?: string): Promise<Order[]>;
  create(input: CreateOrderInput): Promise<Order>;
  updateStatus(orderId: string, status: OrderStatus): Promise<void>;
}

export const supabaseOrderRepository: OrderRepository = {
  list: getOrders,
  create: createOrder,
  updateStatus: updateOrderStatus,
};
