import type { Order } from "@/lib/types";

export type OrderPerformanceRow = {
  orderId: string;
  orderNumber: string;
  acceptedAt: string;
  estimatedMinutes: number;
  preparationMinutes: number | null;
  deliveryMinutes: number | null;
  totalMinutes: number | null;
  etaDifferenceMinutes: number | null;
  onTime: boolean | null;
};

export type OrderPerformanceMetrics = {
  averagePreparationMinutes: number | null;
  averageTotalMinutes: number | null;
  onTimeOrders: number;
  delayedOrders: number;
  fastestOrder: OrderPerformanceRow | null;
  slowestOrder: OrderPerformanceRow | null;
  etaCompliancePercent: number | null;
};

export function buildOrderPerformanceRows(
  orders: Order[],
): OrderPerformanceRow[] {
  return orders
    .filter(
      (order) =>
        order.acceptedAt &&
        order.estimatedMinutes &&
        order.status !== "Anulată",
    )
    .map((order) => {
      const preparationMinutes = minutesBetween(
        order.acceptedAt,
        order.preparationStartedAt,
      );
      const deliveryMinutes = minutesBetween(
        order.deliveryStartedAt,
        order.completedAt,
      );
      const totalMinutes = minutesBetween(order.acceptedAt, order.completedAt);
      const etaDifferenceMinutes =
        totalMinutes === null ?
           null
          : totalMinutes - (order.estimatedMinutes ?? 0);

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        acceptedAt: order.acceptedAt!,
        estimatedMinutes: order.estimatedMinutes!,
        preparationMinutes,
        deliveryMinutes,
        totalMinutes,
        etaDifferenceMinutes,
        onTime:
          etaDifferenceMinutes === null ? null : etaDifferenceMinutes <= 0,
      };
    })
    .sort(
      (left, right) =>
        new Date(right.acceptedAt).getTime() -
        new Date(left.acceptedAt).getTime(),
    );
}

export function calculateOrderPerformance(
  rows: OrderPerformanceRow[],
): OrderPerformanceMetrics {
  const completedRows = rows.filter(
    (row): row is OrderPerformanceRow & { totalMinutes: number } =>
      row.totalMinutes !== null,
  );
  const preparationValues = rows.flatMap((row) =>
    row.preparationMinutes === null ? [] : [row.preparationMinutes],
  );
  const onTimeOrders = completedRows.filter((row) => row.onTime).length;
  const delayedOrders = completedRows.length - onTimeOrders;
  const ranked = [...completedRows].sort(
    (left, right) => left.totalMinutes - right.totalMinutes,
  );

  return {
    averagePreparationMinutes: average(preparationValues),
    averageTotalMinutes: average(
      completedRows.map((row) => row.totalMinutes),
    ),
    onTimeOrders,
    delayedOrders,
    fastestOrder: ranked[0] ?? null,
    slowestOrder: ranked.at(-1) ?? null,
    etaCompliancePercent: completedRows.length ?
       roundToOneDecimal((onTimeOrders / completedRows.length) * 100)
      : null,
  };
}

function minutesBetween(start: string | null, end: string | null) {
  if (!start || !end) return null;
  return roundToOneDecimal(
    Math.max(0, (new Date(end).getTime() - new Date(start).getTime()) / 60_000),
  );
}

function average(values: number[]) {
  if (!values.length) return null;
  return roundToOneDecimal(
    values.reduce((total, value) => total + value, 0) / values.length,
  );
}

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}
