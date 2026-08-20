import type { MenuCategory } from "@/lib/types";
import MenuItemCard from "./MenuItemCard";

export default function MenuList({ categories }: { categories: MenuCategory[] }) {
  if (categories.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-black/10 bg-white/45 backdrop-blur-sm p-6 text-center text-gray-500">
        The menu is empty. Run <code>supabase/food-ordering-schema.sql</code> to add it.
      </p>
    );
  }

  return (
    <div className="space-y-10">
      {categories.map((category) => (
        <section key={category.id}>
          <h2 className="text-xl font-semibold">{category.name}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {category.items.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
