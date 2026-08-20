import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionContext } from "@/lib/supabase/session";
import { formatOrderCode, formatOrderTime, formatPrice } from "@/lib/format";
import { ORDER_TYPE_LABEL } from "@/lib/orders";
import AppHeader from "@/components/AppHeader";
import OrderStatusLive from "@/components/OrderStatusLive";
import NotConnectedPage from "@/components/NotConnectedPage";
import type { Order } from "@/lib/types";

export default async function OrderDetailPage({
  params,
}: PageProps<"/orders/[id]">) {
  const { id } = await params;
  const { supabase, userId, userEmail, isStaff } = await getSessionContext();
  if (!supabase) return <NotConnectedPage title="Order" />;
  if (!userId) redirect("/login");

  const { data } = await supabase
    .from("orders")
    .select(
      "id, status, order_type, customer_name, note, total_cents, created_at, " +
        "order_items ( id, name_snapshot, unit_price_cents, quantity, line_total_cents )"
    )
    .eq("id", id)
    .maybeSingle();

  // Another customer's order is invisible to this query — RLS filters it out
  // before it reaches here, so "not yours" and "doesn't exist" look identical.
  // That is deliberate: it leaks nothing about orders you can't see.
  const order = data as Order | null;
  if (!order) notFound();

  return (
    <div className="min-h-screen">
      <AppHeader userEmail={userEmail} isStaff={isStaff} />
      <main className="mx-auto max-w-xl px-4 py-8">
        <Link href="/orders" className="text-sm text-gray-500 hover:text-gray-900">
          ← All orders
        </Link>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{formatOrderCode(order.id)}</h1>
          {/* Updates on its own when the kitchen moves this order along. */}
          <OrderStatusLive orderId={order.id} initialStatus={order.status} />
        </div>

        <p className="mt-2 text-sm text-gray-500">
          {formatOrderTime(order.created_at)} · {ORDER_TYPE_LABEL[order.order_type]} ·{" "}
          <span className="break-words">{order.customer_name}</span>
        </p>

        <section className="mt-6 rounded-2xl border border-black/5 bg-white/75 shadow-sm backdrop-blur-sm p-4">
          <ul className="divide-y divide-gray-100">
            {order.order_items.map((line) => (
              <li key={line.id} className="flex justify-between gap-3 py-2">
                <span className="min-w-0 break-words">
                  {line.quantity} × {line.name_snapshot}
                  <span className="block text-sm text-gray-500">
                    {formatPrice(line.unit_price_cents)} each
                  </span>
                </span>
                <span className="shrink-0 font-medium">
                  {formatPrice(line.line_total_cents)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-gray-200 pt-3">
            <span className="font-semibold">Total</span>
            <span className="font-semibold">{formatPrice(order.total_cents)}</span>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Item names and prices are the ones that applied when you ordered.
          </p>
        </section>

        {order.note && (
          <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm break-words text-amber-900">
            Note: {order.note}
          </p>
        )}
      </main>
    </div>
  );
}
