import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/supabase/session";
import AppHeader from "@/components/AppHeader";
import CheckoutForm from "@/components/CheckoutForm";
import NotConnectedPage from "@/components/NotConnectedPage";

export default async function CheckoutPage() {
  const { supabase, userId, userEmail, isStaff } = await getSessionContext();
  if (!supabase) return <NotConnectedPage title="Checkout" />;
  if (!userId) redirect("/login");

  return (
    <div className="min-h-screen">
      <AppHeader userEmail={userEmail} isStaff={isStaff} />
      <main className="mx-auto max-w-xl px-4 py-8">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <div className="mt-6">
          {/* Prefilled as a convenience only — the customer can change it,
              and it has nothing to do with who the order belongs to. */}
          <CheckoutForm defaultName={userEmail.split("@")[0] ?? ""} />
        </div>
      </main>
    </div>
  );
}
