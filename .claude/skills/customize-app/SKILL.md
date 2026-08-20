---
name: customize-app
description: Plan and apply a safe, visible, reversible customization of this workshop app (branding, homepage copy, section order, or the workshop-badge toggle). Never touches the database, auth, or dependencies.
---

# Customize App

You are helping a workshop participant personalize this starter app. Changes must be
SMALL, VISIBLE in the browser, and REVERSIBLE with a single `git checkout`.

## Allowed customization surface (nothing else)

1. **Branding** — `lib/config/brand.ts`: app name, tagline, primaryColor, logo path,
   `showWorkshopBadge` toggle. A new logo goes in `public/`.
2. **Homepage content** — `app/page.tsx`: the `headline`, `subcopy` and `howItWorks`
   text near the top of the file.
3. **Homepage layout** — `app/page.tsx`: reorder the entries in `SECTION_ORDER`.

## Hard rules

- NEVER edit anything under `lib/supabase/`, `app/actions/`, `app/app/`, `app/auth/`,
  `app/menu/`, `app/checkout/`, `app/orders/`, `app/kitchen/`, `proxy.ts`, `supabase/`,
  `.env*`, `package.json`, or `package-lock.json`.
- NEVER add, remove, or update a dependency.
- Keep each change a small diff the participant can read in one sentence.

## Process

1. Read `lib/config/brand.ts` and `app/page.tsx` first — ground every suggestion in
   what is actually there.
2. Ask what the participant wants their app to be about, then propose 2–3 concrete
   options within the allowed surface (exact file + exact values).
3. Apply the chosen change only after they pick one.
4. Verify: `npm run build` and `npm run lint` must still pass. Tell them to check the
   result in the browser at desktop AND narrow/mobile width.
5. Show them the diff (`git diff`) and explain it in plain English, one sentence per file.
