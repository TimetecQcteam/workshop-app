"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { brand } from "@/lib/config/brand";
import { formatPrice } from "@/lib/format";
import { useCart } from "./cart/useCart";

/** The cart button in the header, plus the slide-over panel it opens. */
export default function CartDrawer() {
  const router = useRouter();
  const { lines, itemCount, subtotalCents, setQuantity, removeItem } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative rounded-md px-2 py-1.5 font-medium text-white sm:px-3"
        style={{ backgroundColor: brand.primaryColor }}
        aria-label={`Cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
      >
        Cart
        {itemCount > 0 && (
          <span className="ml-1.5 rounded-full bg-white/25 px-1.5 py-0.5 text-xs">
            {itemCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-label="Close cart"
          />
          <div className="relative flex h-full w-full max-w-sm flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <h2 className="text-lg font-semibold">Your cart</h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              {lines.length === 0 ? (
                <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                  Nothing here yet — add something from the menu.
                </p>
              ) : (
                <ul className="space-y-4">
                  {lines.map((line) => (
                    <li key={line.menuItemId} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {/* Menu text is plain text, never markup. */}
                        <p className="break-words font-medium">{line.name}</p>
                        <p className="mt-0.5 text-sm text-gray-500">
                          {formatPrice(line.unitPriceCents)} each
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            onClick={() => setQuantity(line.menuItemId, line.quantity - 1)}
                            className="h-7 w-7 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                            aria-label={`Reduce quantity of ${line.name}`}
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-sm">{line.quantity}</span>
                          <button
                            onClick={() => setQuantity(line.menuItemId, line.quantity + 1)}
                            className="h-7 w-7 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                            aria-label={`Increase quantity of ${line.name}`}
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeItem(line.menuItemId)}
                            className="ml-1 text-sm text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <p className="shrink-0 font-medium">
                        {formatPrice(line.unitPriceCents * line.quantity)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-gray-200 px-4 py-4">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                {/* An estimate for the customer's benefit. The price that
                    counts is recalculated on the server at checkout. */}
                <span className="font-semibold text-gray-900">
                  {formatPrice(subtotalCents)}
                </span>
              </div>
              <button
                disabled={lines.length === 0}
                onClick={() => {
                  setOpen(false);
                  router.push("/checkout");
                }}
                className="mt-3 w-full rounded-md px-4 py-2 font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: brand.primaryColor }}
              >
                Go to checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
