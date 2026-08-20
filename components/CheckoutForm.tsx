"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { brand } from "@/lib/config/brand";
import { formatPrice } from "@/lib/format";
import {
  MAX_NAME_LENGTH,
  MAX_NOTE_LENGTH,
  validateCheckout,
} from "@/lib/orders";
import type { OrderType } from "@/lib/types";
import { placeOrder } from "@/app/actions/orders";
import { useCart } from "./cart/useCart";

export default function CheckoutForm({ defaultName }: { defaultName: string }) {
  const router = useRouter();
  const { lines, subtotalCents, clear } = useCart();
  const [customerName, setCustomerName] = useState(defaultName);
  const [orderType, setOrderType] = useState<OrderType>("pickup");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const input = {
      // Only ids and quantities leave the browser. No names, no prices,
      // no total — the server looks all of that up for itself.
      lines: lines.map((l) => ({ menuItemId: l.menuItemId, quantity: l.quantity })),
      orderType,
      customerName,
      note,
    };

    // Check locally first for a fast, friendly message. The server runs the
    // very same validateCheckout() again — this is convenience, not control.
    const invalid = validateCheckout(input);
    if (invalid) {
      setError(invalid);
      return;
    }

    setBusy(true);
    setError(null);
    const result = await placeOrder(input);

    if (!result.ok) {
      setBusy(false);
      setError(result.error);
      return;
    }

    clear();
    router.push(`/orders/${result.orderId}`);
  }

  if (lines.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-black/10 bg-white/45 backdrop-blur-sm p-8 text-center">
        <p className="text-gray-500">Your cart is empty.</p>
        <Link
          href="/menu"
          className="mt-4 inline-block rounded-md px-4 py-2 font-medium text-white"
          style={{ backgroundColor: brand.primaryColor }}
        >
          Browse the menu
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-black/5 bg-white/75 shadow-sm backdrop-blur-sm p-4">
        <h2 className="font-semibold">Your order</h2>
        <ul className="mt-3 divide-y divide-gray-100">
          {lines.map((line) => (
            <li key={line.menuItemId} className="flex justify-between gap-3 py-2">
              <span className="min-w-0 break-words">
                {line.quantity} × {line.name}
              </span>
              <span className="shrink-0 font-medium">
                {formatPrice(line.unitPriceCents * line.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-gray-200 pt-3">
          <span className="font-semibold">Total</span>
          <span className="font-semibold">{formatPrice(subtotalCents)}</span>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Prices are confirmed against the menu when you place the order.
        </p>
      </section>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-black/5 bg-white/75 shadow-sm backdrop-blur-sm p-4">
        <div>
          <label htmlFor="customer-name" className="block text-sm font-medium">
            Name for the order
          </label>
          <input
            id="customer-name"
            value={customerName}
            maxLength={MAX_NAME_LENGTH}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Who's collecting?"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-2 focus:outline-offset-1"
          />
        </div>

        <fieldset>
          <legend className="block text-sm font-medium">Order type</legend>
          <div className="mt-2 flex gap-4">
            {(["pickup", "dine_in"] as const).map((value) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="order-type"
                  value={value}
                  checked={orderType === value}
                  onChange={() => setOrderType(value)}
                />
                {value === "pickup" ? "Pickup" : "Dine in"}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="order-note" className="block text-sm font-medium">
            Note for the kitchen{" "}
            <span className="font-normal text-gray-500">(optional)</span>
          </label>
          <textarea
            id="order-note"
            value={note}
            rows={3}
            maxLength={MAX_NOTE_LENGTH}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Less spicy, no peanuts…"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-2 focus:outline-offset-1"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md px-4 py-2.5 font-medium text-white disabled:opacity-60"
          style={{ backgroundColor: brand.primaryColor }}
        >
          {busy ? "Placing your order…" : `Place order · ${formatPrice(subtotalCents)}`}
        </button>
      </form>
    </div>
  );
}
