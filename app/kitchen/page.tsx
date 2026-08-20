import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/supabase/session";
import { ACTIVE_STATUSES } from "@/lib/orders";
import AppHeader from "@/components/AppHeader";
import KitchenBoard from "@/components/KitchenBoard";
import NotConnectedPage from "@/components/NotConnectedPage";
import type { Order } from "@/lib/types";

export default async function KitchenPage() {
  const { supabase, userId, userEmail, isStaff } = await getSessionContext();
  if (!supabase) return <NotConnectedPage title="Kitchen" />;
  if (!userId) redirect("/login");

  // Staff status is a database lookup, checked here on the server. Hiding the
  // nav link is cosmetic; this is the gate. The action that changes a status
  // checks again for itself, because it can be POSTed to directly.
  if (!isStaff) redirect("/menu");

  const { data } = await supabase
    .from("orders")
    .select(
      "id, status, order_type, customer_name, note, total_cents, created_at, " +
        "order_items ( id, name_snapshot, unit_price_cents, quantity, line_total_cents )"
    )
    .in("status", ACTIVE_STATUSES)
    .order("created_at", { ascending: true });

  const orders = (data as Order[] | null) ?? [];

  return (
    <div className="min-h-screen">
      <AppHeader userEmail={userEmail} isStaff={isStaff} />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold">Kitchen</h1>
        <p className="mt-1 text-gray-600">
          Oldest first. The board updates itself as orders come in.
        </p>
        <div className="mt-8">
          <KitchenBoard orders={orders} />
        </div>
      </main>
    </div>
  );
}
