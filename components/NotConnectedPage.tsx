import BrandHeader from "./BrandHeader";
import BackendNotConnected from "./BackendNotConnected";

/** Shown by every signed-in page while Supabase isn't connected yet, so the
 *  app renders a friendly shell instead of crashing (Modules 1–4). */
export default function NotConnectedPage({ title }: { title: string }) {
  return (
    <div className="min-h-screen">
      <BrandHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="mt-4">
          <BackendNotConnected />
        </div>
      </main>
    </div>
  );
}
