"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { brand } from "@/lib/config/brand";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import CartDrawer from "./CartDrawer";

/** Header for the signed-in pages. `isStaff` comes from a server-side database
 *  lookup — hiding the Kitchen link is cosmetic, the real gate is on the page. */
export default function AppHeader({
  userEmail,
  isStaff,
  showCart = false,
}: {
  userEmail: string;
  isStaff: boolean;
  showCart?: boolean;
}) {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  async function handleSignOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/menu"
          className="flex shrink-0 items-center gap-2 text-lg font-semibold"
          style={{ color: brand.primaryColor }}
        >
          <Image src={brand.logo} alt={`${brand.name} logo`} width={28} height={28} />
          <span className="hidden sm:inline">{brand.name}</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm sm:gap-3">
          <Link href="/menu" className="rounded-md px-2 py-1.5 text-gray-600 hover:text-gray-900">
            Menu
          </Link>
          <Link href="/orders" className="rounded-md px-2 py-1.5 text-gray-600 hover:text-gray-900">
            Orders
          </Link>
          {isStaff && (
            <Link
              href="/kitchen"
              className="rounded-md px-2 py-1.5 font-medium text-gray-600 hover:text-gray-900"
            >
              Kitchen
            </Link>
          )}
          {showCart && <CartDrawer />}
          <span className="hidden text-gray-500 lg:inline">{userEmail}</span>
          <button
            onClick={handleSignOut}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-gray-700 hover:bg-gray-50 sm:px-3"
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}
