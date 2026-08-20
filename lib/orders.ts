import type { OrderStatus, OrderType } from "./types";

/** How each status reads to a human, and how the badge is coloured. */
export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Order received",
  preparing: "Being prepared",
  ready: "Ready for pickup",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const STATUS_CLASS: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-900 border-amber-300",
  preparing: "bg-blue-100 text-blue-900 border-blue-300",
  ready: "bg-green-100 text-green-900 border-green-300",
  completed: "bg-gray-100 text-gray-700 border-gray-300",
  cancelled: "bg-red-100 text-red-900 border-red-300",
};

export const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  pickup: "Pickup",
  dine_in: "Dine in",
};

/** Statuses the kitchen screen still cares about. */
export const ACTIVE_STATUSES: OrderStatus[] = ["pending", "preparing", "ready"];

/**
 * The only status moves the kitchen is allowed to make. Anything not listed
 * here is rejected rather than written — see app/actions/kitchen.ts. Keeping
 * the map here means the buttons and the server agree by construction.
 */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed"],
  completed: [],
  cancelled: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

// ── Checkout limits and validation ──────────────────────────────
// Shared by the checkout form and the server action, so the message the
// customer sees and the rule the server enforces can never drift apart.

export const MAX_CART_LINES = 50;
export const MAX_QUANTITY = 99;
export const MAX_NAME_LENGTH = 80;
export const MAX_NOTE_LENGTH = 500;

/** What the browser is allowed to tell the server. Note what is absent:
 *  no prices, no item names, no total. Those come from the database. */
export type PlaceOrderInput = {
  lines: { menuItemId: string; quantity: number }[];
  orderType: OrderType;
  customerName: string;
  note: string;
};

export type PlaceOrderResult =
  | { ok: false; error: string }
  | { ok: true; orderId: string };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Returns a friendly error message, or null when the order is valid. */
export function validateCheckout(input: PlaceOrderInput): string | null {
  if (!Array.isArray(input.lines) || input.lines.length === 0) {
    return "Your cart is empty — add something from the menu first.";
  }
  if (input.lines.length > MAX_CART_LINES) {
    return `That's more than ${MAX_CART_LINES} different items — please split the order.`;
  }
  for (const line of input.lines) {
    if (typeof line?.menuItemId !== "string" || !UUID_PATTERN.test(line.menuItemId)) {
      return "Something's wrong with your cart. Clear it and try again.";
    }
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > MAX_QUANTITY) {
      return `Each item needs a quantity between 1 and ${MAX_QUANTITY}.`;
    }
  }
  if (input.customerName.trim().length === 0) {
    return "Please add a name for the order.";
  }
  if (input.customerName.trim().length > MAX_NAME_LENGTH) {
    return `Keep the name under ${MAX_NAME_LENGTH} characters.`;
  }
  if (input.note.length > MAX_NOTE_LENGTH) {
    return `Keep the note under ${MAX_NOTE_LENGTH} characters.`;
  }
  if (input.orderType !== "pickup" && input.orderType !== "dine_in") {
    return "Please choose pickup or dine in.";
  }
  return null;
}
