import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/supabase/session";
import { brand } from "@/lib/config/brand";
import AppHeader from "@/components/AppHeader";
import OrderCard from "@/components/OrderCard";
import NotConnectedPage from "@/components/NotConnectedPage";
import type { Order } from "@/lib/types";

const ORDER_SELECT =
  "id, status, order_type, customer_name, note, total_cents, created_at, " +
  "order_items ( id, name_snapshot, unit_price_cents, quantity, line_total_cents )";

export default async function OrdersPage() {
  const { supabase, userId, userEmail, isStaff } = await getSessionContext();
  if (!supabase) return <NotConnectedPage title="Your orders" />;
  if (!userId) redirect("/login");

  // No .eq("user_id", …) is needed for correctness — the RLS select policy
  // already limits this to your own rows. It is here so the query uses the
  // (user_id, created_at) index, and so the intent is obvious when reading.
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const orders = (data as Order[] | null) ?? [];

  return (
    <div className="min-h-screen">
      <AppHeader userEmail={userEmail} isStaff={isStaff} />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold">Your orders</h1>

        {error && (
          <p className="mt-6 text-sm text-red-600">
            Couldn&apos;t load your orders. Refresh the page to try again.
          </p>
        )}

        <div className="mt-6 space-y-4">
          {orders.length === 0 && !error ? (
            <div className="rounded-2xl border border-dashed border-black/10 bg-white/45 backdrop-blur-sm p-8 text-center">
              <p className="text-gray-500">You haven&apos;t ordered anything yet.</p>
              <Link
                href="/menu"
                className="mt-4 inline-block rounded-md px-4 py-2 font-medium text-white"
                style={{ backgroundColor: brand.primaryColor }}
              >
                Browse the menu
              </Link>
            </div>
          ) : (
            orders.map((order) => <OrderCard key={order.id} order={order} />)
          )}
        </div>
      </main>
    </div>
  );
}
