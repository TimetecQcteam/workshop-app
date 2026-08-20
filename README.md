# INA Kitchen — Food Ordering App

Built at **Build with AI: Zero to Shipped** (TimeTec, 1-day workshop), starting from
the MyStuff notes starter.

A signed-in customer browses a menu, builds a cart, places an order, and watches its
status change live while kitchen staff move it along from a `/kitchen` screen.

## Run it (no setup needed)

```bash
npm ci
npm run dev
```

Open http://localhost:3000. The homepage, login and signup pages render **before** any
backend exists — pages that need Supabase show a friendly "Backend not connected yet"
note until you complete the setup below.

## Pages

| Route | Who | What |
|---|---|---|
| `/` | anyone | Homepage |
| `/menu` | signed in | Browse the menu, add to cart |
| `/checkout` | signed in | Confirm the order and place it |
| `/orders` | signed in | Your order history |
| `/orders/[id]` | signed in | One order, with a live status badge |
| `/kitchen` | staff only | The queue, with buttons to advance each order |

## Connecting Supabase

1. Create a Supabase project.
2. SQL editor → paste and run `supabase/food-ordering-schema.sql` (once). It creates
   the tables, the RLS policies, the column grants and a seed menu.
3. Copy `.env.example` to `.env.local` and fill in your project's URL and publishable
   key (Project Settings → API). Both values are browser-safe.
4. Restart the dev server, then sign up and order something.

### Making yourself kitchen staff

Staff is a plain allowlist — one row per staff member, added by hand:

```sql
insert into public.staff_members (user_id) values ('<your-user-uuid>');
```

Find your uuid in Supabase → Authentication → Users. Sign out and back in, and the
**Kitchen** link appears.

**Email confirmation is OFF** in the workshop Supabase template — sign-up signs you
straight in. (If your project has it ON, sign-up shows "check your email" instead;
the app handles both.)

## Environment variables

Only three, all public (see `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`.
No secret key is used anywhere — there is nothing here that must be hidden,
and `.env.local` is git-ignored anyway.

## Security model (the short version)

Four ideas, and the third is the one worth remembering:

- **Identity is verified on the server.** Every signed-in page calls `getUser()` via
  `lib/supabase/session.ts` and redirects signed-out visitors. `/kitchen` also checks
  the staff allowlist. Both Server Actions re-check for themselves, because an action
  can be POSTed to directly — a page redirect protects the screen, not the action.
- **The database is the real access control.** RLS means another customer cannot read
  your orders even by calling the API directly. The menu is readable by everyone signed
  in and writable by nobody, so a price cannot be changed from a browser.
- **Prices come from the database, never the browser.** The cart sends item ids and
  quantities. `placeOrder` looks the prices up itself and computes the total. A tampered
  cart buys nothing cheaply.
- **Staff can change a status and nothing else.** An RLS policy filters *rows*, not
  *columns* — so the schema also revokes `update` on `orders` and grants back only
  `update (status)`. Without that pair, a staff account could rewrite an order's total.

Everything a person types — menu descriptions, the name on the order, the note the
kitchen reads — is rendered as plain text, never as HTML.

## Cleaning up the starter

The old notes table is no longer used by anything. Once the app works end to end, you
can drop it by running `supabase/drop-items.sql`. That is destructive and has no undo,
so it is a separate file you run deliberately.

## Deploying

Deploys to Vercel Hobby from a GitHub fork. Set the three env vars in Vercel
(`NEXT_PUBLIC_SITE_URL` = your `*.vercel.app` URL), deploy, then set the same URL
as the Site URL in Supabase Auth settings. The `/prepare-deployment` skill walks
the whole checklist.
