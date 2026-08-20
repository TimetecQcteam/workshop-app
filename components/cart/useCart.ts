"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { MAX_CART_LINES, MAX_QUANTITY } from "@/lib/orders";

/**
 * One line in the cart.
 *
 * The name and price live here ONLY so the cart can draw itself. When the
 * order is placed, the server ignores both and looks the real price up in the
 * database — see app/actions/orders.ts. Nothing about money is decided here.
 */
export type CartLine = {
  menuItemId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
};

const STORAGE_KEY = "food-ordering-cart-v1";

// ── The store ───────────────────────────────────────────────────
// localStorage IS the cart. Treating it as an external store (rather than
// copying it into React state on mount) means no cascading render on load,
// and two tabs stay in step for free.

const EMPTY: CartLine[] = [];

const listeners = new Set<() => void>();

// getSnapshot must return the SAME array reference when nothing changed, or
// React re-renders forever. So we cache the parse, keyed on the raw string.
let cachedRaw: string | null = null;
let cachedLines: CartLine[] = EMPTY;

function parseCart(raw: string | null): CartLine[] {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    // Anything malformed is dropped rather than trusted. This came back from
    // the browser, so it gets the same scrutiny as any other user input.
    return parsed.filter(
      (line): line is CartLine =>
        typeof line === "object" &&
        line !== null &&
        typeof (line as CartLine).menuItemId === "string" &&
        typeof (line as CartLine).name === "string" &&
        Number.isInteger((line as CartLine).unitPriceCents) &&
        Number.isInteger((line as CartLine).quantity) &&
        (line as CartLine).quantity > 0
    );
  } catch {
    return EMPTY;
  }
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  // Fires when another tab writes the cart.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot(): CartLine[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Private browsing with storage blocked — behave like an empty cart.
    return cachedLines;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedLines = parseCart(raw);
  }
  return cachedLines;
}

/** The server has no cart, so it renders an empty one — and so does the
 *  first client render, which keeps hydration matching. */
function getServerSnapshot(): CartLine[] {
  return EMPTY;
}

function writeCart(next: CartLine[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Quota or private mode: keep the in-memory snapshot moving anyway.
  }
  cachedRaw = null; // force a re-parse on the next read
  cachedLines = next;
  listeners.forEach((listener) => listener());
}

// ── The hook ────────────────────────────────────────────────────

export function useCart() {
  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addItem = useCallback((item: Omit<CartLine, "quantity">) => {
    const current = getSnapshot();
    const existing = current.find((l) => l.menuItemId === item.menuItemId);
    if (existing) {
      if (existing.quantity >= MAX_QUANTITY) return;
      writeCart(
        current.map((l) =>
          l.menuItemId === item.menuItemId ? { ...l, quantity: l.quantity + 1 } : l
        )
      );
      return;
    }
    if (current.length >= MAX_CART_LINES) return;
    writeCart([...current, { ...item, quantity: 1 }]);
  }, []);

  const setQuantity = useCallback((menuItemId: string, quantity: number) => {
    const current = getSnapshot();
    if (quantity < 1) {
      writeCart(current.filter((l) => l.menuItemId !== menuItemId));
      return;
    }
    const capped = Math.min(quantity, MAX_QUANTITY);
    writeCart(
      current.map((l) => (l.menuItemId === menuItemId ? { ...l, quantity: capped } : l))
    );
  }, []);

  const removeItem = useCallback((menuItemId: string) => {
    writeCart(getSnapshot().filter((l) => l.menuItemId !== menuItemId));
  }, []);

  const clear = useCallback(() => writeCart(EMPTY), []);

  const totals = useMemo(
    () => ({
      itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
      subtotalCents: lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0),
    }),
    [lines]
  );

  return { lines, ...totals, addItem, setQuantity, removeItem, clear };
}
