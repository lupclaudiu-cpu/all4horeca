const CENTS_PER_UNIT = 100;

export function toCents(value: number) {
  return Math.round((Number(value) + Number.EPSILON) * CENTS_PER_UNIT);
}

export function fromCents(value: number) {
  return value / CENTS_PER_UNIT;
}

export function addMoney(...values: number[]) {
  return fromCents(values.reduce((sum, value) => sum + toCents(value), 0));
}

export function sumMoney(values: number[]) {
  return addMoney(...values);
}

export function multiplyMoney(value: number, quantity: number) {
  return fromCents(toCents(value) * quantity);
}

export function formatPrice(value: number) {
  const cents = toCents(value);
  if (cents % CENTS_PER_UNIT === 0) {
    return `${cents / CENTS_PER_UNIT} RON`;
  }
  return `${fromCents(cents).toFixed(2)} RON`;
}
