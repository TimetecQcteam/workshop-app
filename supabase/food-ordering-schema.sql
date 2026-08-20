-- ════════════════════════════════════════════════════════════════
-- Food ordering schema
-- Run this ONCE in your Supabase project's SQL editor.
-- Safe to re-run by accident: every statement is guarded.
-- Contains NO destructive statements (no drop / truncate / delete).
--
-- The one idea to hold on to: the MENU is shared, the ORDERS are private.
-- That is why the policies below are not all the same shape.
--
-- Money is stored as whole cents (sen) in an integer column — never a
-- decimal or float. RM 12.00 is written as 1200.
-- ════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────
-- 1) MENU — shared reference data. Everyone signed in reads it;
--    nobody writes it from the browser (see policies in step 6).
-- ────────────────────────────────────────────────────────────────
create table if not exists public.menu_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique check (char_length(name) between 1 and 60),
  sort_order int  not null default 0
);

create table if not exists public.menu_items (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid not null references public.menu_categories (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 120),
  description  text check (description is null or char_length(description) <= 500),
  price_cents  int  not null check (price_cents >= 0),
  image_url    text,
  is_available boolean not null default true,
  sort_order   int  not null default 0,
  unique (category_id, name)
);

create index if not exists menu_items_category_sort_idx
  on public.menu_items (category_id, sort_order);

-- ────────────────────────────────────────────────────────────────
-- 2) STAFF — a plain allowlist. One row here = this user can see the
--    kitchen screen and advance an order's status.
--    Add yourself once, by hand:
--      insert into public.staff_members (user_id) values ('<your-user-uuid>');
--    (Find your uuid in Supabase → Authentication → Users.)
-- ────────────────────────────────────────────────────────────────
create table if not exists public.staff_members (
  user_id  uuid primary key references auth.users (id) on delete cascade,
  added_at timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────
-- 3) ORDERS — one row per placed order, owned by the customer.
--    total_cents is written by the server only. Nothing the browser
--    sends is trusted for money (see app/actions/orders.ts).
-- ────────────────────────────────────────────────────────────────
create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  status        text not null default 'pending'
                check (status in ('pending','preparing','ready','completed','cancelled')),
  order_type    text not null default 'pickup'
                check (order_type in ('pickup','dine_in')),
  -- Captured at checkout so the kitchen screen never needs to read auth.users.
  customer_name text not null check (char_length(customer_name) between 1 and 80),
  note          text check (note is null or char_length(note) <= 500),
  total_cents   int  not null check (total_cents >= 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- "List MY orders, newest first" — what the customer's history page does.
create index if not exists orders_user_created_idx
  on public.orders (user_id, created_at desc);

-- "List the active queue, oldest first" — what the kitchen screen does.
create index if not exists orders_status_created_idx
  on public.orders (status, created_at);

-- ────────────────────────────────────────────────────────────────
-- 4) ORDER ITEMS — the lines of an order.
--    name and price are SNAPSHOT here on purpose: editing the menu
--    tomorrow must never rewrite what somebody paid today.
-- ────────────────────────────────────────────────────────────────
create table if not exists public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders (id) on delete cascade,
  menu_item_id     uuid references public.menu_items (id) on delete set null,
  name_snapshot    text not null check (char_length(name_snapshot) between 1 and 120),
  unit_price_cents int  not null check (unit_price_cents >= 0),
  quantity         int  not null check (quantity between 1 and 99),
  line_total_cents int  not null check (line_total_cents >= 0)
);

create index if not exists order_items_order_idx
  on public.order_items (order_id);

-- ────────────────────────────────────────────────────────────────
-- 5) Keep updated_at fresh. The kitchen screen sorts on it, so it has
--    to move whenever a status changes.
-- ────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────
-- 6) Row Level Security. RLS denies everything by default, so a table
--    with no policy for an action simply cannot be used that way.
-- ────────────────────────────────────────────────────────────────
alter table public.menu_categories enable row level security;
alter table public.menu_items      enable row level security;
alter table public.staff_members   enable row level security;
alter table public.orders          enable row level security;
alter table public.order_items     enable row level security;

do $$
begin
  -- MENU: readable by anyone signed in. Deliberately NO insert/update/delete
  -- policy — that is what makes it impossible to change a price from a browser.
  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'menu_categories'
                   and policyname = 'menu_categories_read') then
    create policy menu_categories_read on public.menu_categories
      for select to authenticated using (true);
  end if;

  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'menu_items'
                   and policyname = 'menu_items_read') then
    create policy menu_items_read on public.menu_items
      for select to authenticated using (true);
  end if;

  -- STAFF: you may read your OWN row, i.e. "am I staff?". You cannot list
  -- other staff, and you cannot make yourself staff.
  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'staff_members'
                   and policyname = 'staff_members_read_own') then
    create policy staff_members_read_own on public.staff_members
      for select to authenticated using (auth.uid() = user_id);
  end if;

  -- ORDERS: the customer sees their own; staff see all (they have to).
  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'orders'
                   and policyname = 'orders_select_own_or_staff') then
    create policy orders_select_own_or_staff on public.orders
      for select to authenticated
      using (
        auth.uid() = user_id
        or exists (select 1 from public.staff_members s where s.user_id = auth.uid())
      );
  end if;

  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'orders'
                   and policyname = 'orders_insert_own') then
    create policy orders_insert_own on public.orders
      for insert to authenticated with check (auth.uid() = user_id);
  end if;

  -- Customers get NO update policy at all: a customer who could update their
  -- own row could set total_cents = 0 or mark the order completed.
  --
  -- They DO get a narrow delete, limited to orders the kitchen has not started.
  -- That covers "cancel before it's cooked", and it lets the server undo a
  -- half-written order if the line-items insert fails. Once an order leaves
  -- 'pending' it is real work, and the customer can no longer erase it.
  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'orders'
                   and policyname = 'orders_delete_own_pending') then
    create policy orders_delete_own_pending on public.orders
      for delete to authenticated
      using (auth.uid() = user_id and status = 'pending');
  end if;

  -- Only staff may update an order, and (thanks to step 7) only its status.
  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'orders'
                   and policyname = 'orders_update_staff') then
    create policy orders_update_staff on public.orders
      for update to authenticated
      using      (exists (select 1 from public.staff_members s where s.user_id = auth.uid()))
      with check (exists (select 1 from public.staff_members s where s.user_id = auth.uid()));
  end if;

  -- ORDER ITEMS: reachable through the parent order you are allowed to see.
  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'order_items'
                   and policyname = 'order_items_select_own_or_staff') then
    create policy order_items_select_own_or_staff on public.order_items
      for select to authenticated
      using (
        exists (select 1 from public.orders o
                where o.id = order_id and o.user_id = auth.uid())
        or exists (select 1 from public.staff_members s where s.user_id = auth.uid())
      );
  end if;

  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'order_items'
                   and policyname = 'order_items_insert_own') then
    create policy order_items_insert_own on public.order_items
      for insert to authenticated
      with check (
        exists (select 1 from public.orders o
                where o.id = order_id and o.user_id = auth.uid())
      );
  end if;
end $$;

-- ────────────────────────────────────────────────────────────────
-- 7) Column privileges — the other half of "staff may change status
--    and nothing else".
--
--    An RLS policy is a ROW filter: it decides WHICH rows you may touch,
--    never WHICH COLUMNS. Without the two lines below, orders_update_staff
--    would let any staff member rewrite total_cents on any order.
--    This is the most important pair of statements in this file.
-- ────────────────────────────────────────────────────────────────
revoke update on public.orders from authenticated;
grant  update (status) on public.orders to authenticated;

-- ────────────────────────────────────────────────────────────────
-- 8) Realtime — lets the customer watch their status change without
--    refreshing. Realtime applies the same RLS policies as everything
--    else, so a customer still only receives their own rows.
-- ────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime'
                   and schemaname = 'public' and tablename = 'orders') then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;

-- ────────────────────────────────────────────────────────────────
-- 9) Seed the menu, so the app has something to show immediately.
--    Re-running changes nothing (on conflict do nothing).
--    Edit prices here, or in the table editor — never from the app.
-- ────────────────────────────────────────────────────────────────
insert into public.menu_categories (name, sort_order) values
  ('Mains',  1),
  ('Sides',  2),
  ('Drinks', 3)
on conflict (name) do nothing;

insert into public.menu_items (category_id, name, description, price_cents, sort_order)
select c.id, v.name, v.description, v.price_cents, v.sort_order
from (values
  ('Mains',  'Nasi Lemak Ayam',   'Coconut rice, fried chicken, sambal, egg and peanuts.', 1200, 1),
  ('Mains',  'Mee Goreng Mamak',  'Stir-fried noodles with egg, tofu and greens.',          900, 2),
  ('Mains',  'Chicken Rice',      'Poached chicken, fragrant rice, ginger and chilli.',    1100, 3),
  ('Mains',  'Beef Rendang Rice', 'Slow-cooked beef rendang with steamed rice.',           1500, 4),
  ('Sides',  'Roti Canai',        'Flaky flatbread with dhal.',                             250, 1),
  ('Sides',  'Satay Ayam (5)',    'Five chicken skewers with peanut sauce.',                800, 2),
  ('Sides',  'Keropok Lekor',     'Crispy fish crackers with chilli dip.',                  500, 3),
  ('Drinks', 'Teh Tarik',         'Pulled milk tea, hot or iced.',                          350, 1),
  ('Drinks', 'Kopi O',            'Black coffee, local roast.',                             300, 2),
  ('Drinks', 'Sirap Bandung',     'Rose syrup with milk.',                                  400, 3)
) as v(category, name, description, price_cents, sort_order)
join public.menu_categories c on c.name = v.category
on conflict (category_id, name) do nothing;
