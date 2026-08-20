/** Display helpers shared by the menu, checkout, orders and kitchen screens. */

const priceFormatter = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
});

/**
 * Turns whole cents into a display price: 1200 → "RM 12.00".
 * Prices are integers everywhere so they never drift; formatting is the
 * only place a decimal point appears.
 */
export function formatPrice(cents: number): string {
  return priceFormatter.format(cents / 100);
}

/** A short, sayable code for an order — "#A1B2C3" — so staff can call it out. */
export function formatOrderCode(orderId: string): string {
  return `#${orderId.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

/** "20 Aug 2026, 3:04 pm" — used on order cards. */
export function formatOrderTime(timestamp: string): string {
  return new Date(timestamp).toLocaleString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
