"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatOrderCode, formatOrderTime, formatPrice } from "@/lib/format";
import {
  ACTIVE_STATUSES,
  ALLOWED_TRANSITIONS,
  ORDER_TYPE_LABEL,
  STATUS_LABEL,
} from "@/lib/orders";
import type { Order, OrderStatus } from "@/lib/types";
import { updateOrderStatus } from "@/app/actions/kitchen";
import OrderStatusBadge from "./OrderStatusBadge";

/**
 * The staff queue.
 *
 * When anything changes on `orders`, we re-run the server component rather
 * than patching state from the Realtime payload — the payload carries the
 * order row but not its line items, and one source of truth is worth more
 * here than saving a round trip.
 */
export default function KitchenBoard({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel("kitchen-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router]);

  function handleAdvance(orderId: string, nextStatus: OrderStatus) {
    setError(null);
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, nextStatus);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {ACTIVE_STATUSES.map((status) => {
        const column = orders.filter((order) => order.status === status);
        return (
          <section key={status}>
            <h2 className="flex items-center gap-3 text-lg font-semibold">
              {STATUS_LABEL[status]}
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-sm font-normal text-gray-600">
                {column.length}
              </span>
            </h2>

            {column.length === 0 ? (
              <p className="mt-3 rounded-2xl border border-dashed border-black/10 bg-white/45 backdrop-blur-sm p-4 text-sm text-gray-500">
                Nothing here.
              </p>
            ) : (
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {column.map((order) => (
                  <article key={order.id} className="rounded-2xl border border-black/5 bg-white/75 shadow-sm backdrop-blur-sm p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold">{formatOrderCode(order.id)}</p>
                        {/* The customer typed this name. Rendered as text. */}
                        <p className="mt-0.5 min-w-0 break-words text-sm text-gray-600">
                          {order.customer_name} · {ORDER_TYPE_LABEL[order.order_type]}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatOrderTime(order.created_at)}
                        </p>
                      </div>
                      <OrderStatusBadge status={order.status} />
                    </div>

                    <ul className="mt-3 space-y-1 text-sm">
                      {order.order_items.map((line) => (
                        <li key={line.id} className="flex justify-between gap-3">
                          <span className="min-w-0 break-words">
                            {line.quantity} × {line.name_snapshot}
                          </span>
                          <span className="shrink-0 text-gray-500">
                            {formatPrice(line.line_total_cents)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {order.note && (
                      <p className="mt-3 rounded-md bg-amber-50 p-2 text-sm break-words text-amber-900">
                        {/* A note written by one user and read by another —
                            the one place text crosses between people here.
                            It is rendered as text, never as markup. */}
                        Note: {order.note}
                      </p>
                    )}

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="font-medium">{formatPrice(order.total_cents)}</span>
                      <div className="flex gap-2">
                        {ALLOWED_TRANSITIONS[order.status].map((next) => (
                          <button
                            key={next}
                            disabled={pending}
                            onClick={() => handleAdvance(order.id, next)}
                            className={`rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-60 ${
                              next === "cancelled"
                                ? "border border-red-200 text-red-600 hover:bg-red-50"
                                : "bg-gray-900 text-white hover:bg-gray-700"
                            }`}
                          >
                            {next === "cancelled" ? "Cancel" : STATUS_LABEL[next]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
