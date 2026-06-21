import type { CartItem, SelectedProductOption } from "@/lib/types";
import { fromCents, toCents } from "@/lib/money";

export function calculateOptionsTotal(
  options: SelectedProductOption[],
  productQuantity: number,
) {
  const cents = options.reduce((sum, option) => {
    const multiplier = option.multiplyByProductQuantity ? productQuantity : 1;
    return sum + toCents(option.priceDelta) * option.quantity * multiplier;
  }, 0);
  return fromCents(cents);
}

export function calculateCartItemTotal(item: CartItem) {
  const baseCents = toCents(item.unitPrice) * item.quantity;
  const optionsCents = toCents(
    calculateOptionsTotal(item.selectedOptions, item.quantity),
  );
  return fromCents(baseCents + optionsCents);
}

export function calculateCartTotal(items: CartItem[]) {
  return fromCents(
    items.reduce((sum, item) => sum + toCents(calculateCartItemTotal(item)), 0),
  );
}
