import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/supabase/session";
import AppHeader from "@/components/AppHeader";
import MenuList from "@/components/MenuList";
import NotConnectedPage from "@/components/NotConnectedPage";
import type { MenuCategory, MenuItem } from "@/lib/types";

type MenuRow = {
  id: string;
  name: string;
  menu_items: MenuItem[] | null;
};

export default async function MenuPage() {
  const { supabase, userId, userEmail, isStaff } = await getSessionContext();
  if (!supabase) return <NotConnectedPage title="Menu" />;
  if (!userId) redirect("/login");

  // Read on the server: no loading flash, and the query runs with this
  // user's session, so RLS decides what comes back.
  const { data } = await supabase
    .from("menu_categories")
    .select(
      "id, name, menu_items ( id, name, description, price_cents, is_available )"
    )
    .order("sort_order")
    .order("sort_order", { referencedTable: "menu_items" });

  const categories: MenuCategory[] = ((data as MenuRow[] | null) ?? [])
    .map((row) => ({
      id: row.id,
      name: row.name,
      items: row.menu_items ?? [],
    }))
    .filter((category) => category.items.length > 0);

  return (
    <div className="min-h-screen">
      <AppHeader userEmail={userEmail} isStaff={isStaff} showCart />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold">Menu</h1>
        <p className="mt-1 text-gray-600">Add what you want, then head to checkout.</p>
        <div className="mt-8">
          <MenuList categories={categories} />
        </div>
      </main>
    </div>
  );
}
