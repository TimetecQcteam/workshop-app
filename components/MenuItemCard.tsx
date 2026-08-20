"use client";

import { useState } from "react";
import { brand } from "@/lib/config/brand";
import { formatPrice } from "@/lib/format";
import type { MenuItem } from "@/lib/types";
import { useCart } from "./cart/useCart";

export default function MenuItemCard({ item }: { item: MenuItem }) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  function handleAdd() {
    addItem({
      menuItemId: item.id,
      name: item.name,
      unitPriceCents: item.price_cents,
    });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1200);
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-black/5 bg-white/75 shadow-sm backdrop-blur-sm p-4">
      <div className="min-w-0">
        {/* Menu text comes from the database and is rendered as plain text —
            React escapes it, so a description is data, never markup. */}
        <h3 className="break-words font-semibold">{item.name}</h3>
        {item.description && (
          <p className="mt-1 break-words text-sm text-gray-600">{item.description}</p>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="font-medium">{formatPrice(item.price_cents)}</span>
        {item.is_available ? (
          <button
            onClick={handleAdd}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-white"
            style={{ backgroundColor: brand.primaryColor }}
          >
            {justAdded ? "Added ✓" : "Add"}
          </button>
        ) : (
          <span className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-500">
            Sold out
          </span>
        )}
      </div>
    </div>
  );
}
