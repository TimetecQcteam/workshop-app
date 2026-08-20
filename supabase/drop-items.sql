-- ════════════════════════════════════════════════════════════════
-- DESTRUCTIVE — read this before running it.
--
-- This removes the old notes table from the workshop starter, along
-- with every row in it. There is no undo.
--
-- Run it LAST, and only once the food ordering app works end to end.
-- Nothing in the app references public.items any more, so leaving this
-- table in place is harmless if you would rather keep the data.
-- ════════════════════════════════════════════════════════════════

drop table if exists public.items;
