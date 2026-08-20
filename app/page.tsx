import Link from "next/link";
import BrandHeader from "@/components/BrandHeader";
import { brand } from "@/lib/config/brand";

// ─────────────────────────────────────────────────────────────
// HOMEPAGE CONTENT — safe to customize in Module 4.
// Edit the words below, or reorder the sections in SECTION_ORDER.
// ─────────────────────────────────────────────────────────────

const headline = "Good food, ordered ahead.";
const subcopy =
  "Browse the menu, build your order and send it straight to the kitchen. Watch it go from received to ready without standing in line.";

const howItWorks = [
  { title: "1. Create an account", text: "Sign up with just an email and a password." },
  { title: "2. Build your order", text: "Add what you want from the menu, then check out." },
  { title: "3. Watch it cook", text: "Your order updates live until it's ready to collect." },
];

// Reorder these to change the page layout (Module 4 layout edit).
const SECTION_ORDER = ["hero", "how-it-works", "cta"] as const;

// ─────────────────────────────────────────────────────────────

type SectionId = (typeof SECTION_ORDER)[number];

const sections: Record<SectionId, React.ReactNode> = {
  hero: (
    <section key="hero" className="px-4 py-16 text-center">
      {brand.showWorkshopBadge && (
        <span className="mb-4 inline-block rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-600">
          Built at the TimeTec AI Workshop
        </span>
      )}
      <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
        {headline}
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600">{subcopy}</p>
      <p className="mt-2 text-sm font-medium" style={{ color: brand.primaryColor }}>
        {brand.tagline}
      </p>
    </section>
  ),
  "how-it-works": (
    <section key="how-it-works" className="px-4 py-12">
      <h2 className="text-center text-2xl font-semibold">How it works</h2>
      <div className="mx-auto mt-8 grid max-w-4xl gap-6 sm:grid-cols-3">
        {howItWorks.map((step) => (
          <div key={step.title} className="rounded-2xl border border-black/5 bg-white/75 shadow-sm backdrop-blur-sm p-6">
            <h3 className="font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{step.text}</p>
          </div>
        ))}
      </div>
    </section>
  ),
  cta: (
    <section key="cta" className="px-4 py-16 text-center">
      <h2 className="text-2xl font-semibold">Hungry?</h2>
      <div className="mt-6 flex justify-center gap-4">
        <Link
          href="/signup"
          className="rounded-md px-5 py-2.5 font-medium text-white"
          style={{ backgroundColor: brand.primaryColor }}
        >
          Create your account
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
        >
          Sign in
        </Link>
      </div>
    </section>
  ),
};

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <BrandHeader />
      <main>{SECTION_ORDER.map((id) => sections[id])}</main>
      <footer className="border-t border-black/5 px-4 py-6 text-center text-sm text-gray-500">
        {brand.name} — {brand.tagline}
      </footer>
    </div>
  );
}
