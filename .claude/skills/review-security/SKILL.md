---
name: review-security
description: Read-only security review of this workshop app. Reports BLOCKER / WARNING / PASS findings with file-level evidence, and states its own limits. Makes no changes.
---

# Review Security

You are performing a READ-ONLY security review of this workshop app. Do not edit any
file. Output a short report: each finding is BLOCKER, WARNING, or PASS, with the file
path (and line where useful) as evidence.

## Checklist

1. **Secrets** — Search the tracked files for secret-shaped strings: `sb_secret_`,
   `service_role`, `SUPABASE_SERVICE`, private keys, DB passwords.
   The publishable key and project URL in the browser bundle are PUBLIC BY DESIGN — not findings.
   Files that merely NAME these patterns as text to search for (this skill file itself) are not findings.
   `.env.local` must be git-ignored and untracked (`git status`, `.gitignore`).
2. **RLS** — `supabase/food-ordering-schema.sql` must enable row level security on
   `orders`, `order_items`, `menu_categories`, `menu_items` and `staff_members`.
   - `orders`: select is owner-or-staff; insert is `with check (auth.uid() = user_id)`;
     there is **no customer update policy**; delete (if present) is restricted to the
     owner's own `pending` orders.
   - `order_items`: reached through the parent order, never owner-less.
   - menu tables: readable by `authenticated`, and **no insert/update/delete policy at
     all** — a write policy here would let a browser change a price.
3. **Column privileges** — the schema must `revoke update on public.orders from
   authenticated` and `grant update (status) ... to authenticated`. Without this pair,
   the staff update policy lets any staff member rewrite `total_cents`. An RLS policy
   filters rows, never columns — check this explicitly, it is easy to miss.
4. **Server-side protection** — every page under `app/menu`, `app/checkout`,
   `app/orders`, `app/kitchen` must verify the user on the server via
   `getSessionContext()` (`lib/supabase/session.ts`) and `redirect("/login")` when
   signed out. `app/kitchen/page.tsx` must additionally redirect non-staff. Hiding a
   nav link is not protection.
5. **Server Actions re-check identity** — `app/actions/orders.ts` and
   `app/actions/kitchen.ts` are reachable by direct POST, so each must call
   `auth.getUser()` itself, and `updateOrderStatus` must re-check staff membership.
   A page-level redirect does not protect an action.
6. **Price integrity** — `placeOrder` must accept only menu item ids and quantities,
   look prices up from `menu_items` on the server, and compute `total_cents` itself.
   Any path where a price, line total or order total arrives from the browser is a
   BLOCKER. `user_id` must come from the verified session, never from a form field.
7. **Untrusted content stays data** — no `dangerouslySetInnerHTML` (or similar raw-HTML
   rendering) anywhere under `app/` or `components/`. Pay particular attention to the
   customer note rendered on the kitchen screen (`components/KitchenBoard.tsx`): that is
   text written by one user and displayed to another.
8. **Input validation** — enforced in the UI *and* in the database: `validateCheckout()`
   in `lib/orders.ts` (used by both the form and the action) plus `check` constraints on
   `orders`, `order_items` and `menu_items` in the schema.
9. **Status transitions** — `updateOrderStatus` must reject any move not listed in
   `ALLOWED_TRANSITIONS` rather than writing whatever status was sent.
10. **Safe errors** — user-facing error messages must not leak stack traces, tokens,
    or SQL.
11. **Least-privilege MCP** — `.mcp.json` and `.codex/config.toml` list only github,
    supabase (with `read_only=true`), and vercel.

## Report format

- Start with a one-line verdict: "READY" (no BLOCKERs) or "NOT READY (n blockers)".
- List findings grouped by severity, each with evidence.
- End with **Limits of this review**: static reading only — it cannot prove RLS, the
  column grant, or the staff allowlist are actually in place in the participant's
  Supabase project. The live tests are still required: the two-account test (Module 6),
  and for this app also the price-tamper test and the staff column-grant test.
