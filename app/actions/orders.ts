"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  MAX_QUANTITY,
  validateCheckout,
  type PlaceOrderInput,
  type PlaceOrderResult,
} from "@/lib/orders";

/**
 * The ONLY way an order gets created.
 *
 * Two things make this safe, and both matter:
 *
 *  1. Identity is verified here, not just on the page. Server Actions are
 *     reachable by a direct POST, so a page-level redirect protects the
 *     screen, never the action.
 *  2. Prices come from the database. The browser sends item ids and
 *     quantities; it does not send prices, names or a total, and none would
 *     be believed if it did. That is why a tampered cart cannot buy a
 *     RM 15 rendang for RM 0.
 *
 * Returns the new order's id on success, or a friendly message on failure.
 */
export async function placeOrder(
  input: PlaceOrderInput
): Promise<PlaceOrderResult> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return { ok: false, error: "Backend not connected yet." };

  // 1 ── Who is this, really?
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Your session expired. Please sign in again." };
  }

  // 2 ── Is the request even shaped correctly?
  const invalid = validateCheckout(input);
  if (invalid) return { ok: false, error: invalid };

  // Collapse any duplicate ids the client may have sent, so one item can't
  // appear twice and slip past the per-line quantity cap.
  const quantities = new Map<string, number>();
  for (const line of input.lines) {
    quantities.set(
      line.menuItemId,
      (quantities.get(line.menuItemId) ?? 0) + line.quantity
    );
  }
  if ([...quantities.values()].some((q) => q > MAX_QUANTITY)) {
    return {
      ok: false,
      error: `Each item is limited to ${MAX_QUANTITY} per order.`,
    };
  }

  // 3 ── The authoritative price lookup. Everything about money starts here.
  const menuItemIds = [...quantities.keys()];
  const { data: menuRows, error: menuError } = await supabase
    .from("menu_items")
    .select("id, name, price_cents, is_available")
    .in("id", menuItemIds);

  if (menuError || !menuRows) {
    return {
      ok: false,
      error: "Couldn't reach the menu just now. Please try again.",
    };
  }

  const lines = [];
  for (const menuItemId of menuItemIds) {
    const menuItem = menuRows.find((row) => row.id === menuItemId);
    if (!menuItem || !menuItem.is_available) {
      return {
        ok: false,
        error: "Something in your cart is no longer available. Please review it.",
      };
    }
    const quantity = quantities.get(menuItemId)!;
    lines.push({
      menu_item_id: menuItem.id,
      // Frozen at order time: editing the menu tomorrow must not rewrite
      // what this customer ordered today.
      name_snapshot: menuItem.name,
      unit_price_cents: menuItem.price_cents,
      quantity,
      line_total_cents: menuItem.price_cents * quantity,
    });
  }

  const totalCents = lines.reduce((sum, l) => sum + l.line_total_cents, 0);

  // 4 ── Write the order, then its lines.
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id, // from the verified session, never from the form
      customer_name: input.customerName.trim(),
      order_type: input.orderType,
      note: input.note.trim() || null,
      total_cents: totalCents, // computed above, never sent by the browser
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return { ok: false, error: "Couldn't place your order. Please try again." };
  }

  const { error: linesError } = await supabase
    .from("order_items")
    .insert(lines.map((line) => ({ ...line, order_id: order.id })));

  if (linesError) {
    // Don't leave an order with a total and no food in it. The narrow
    // delete policy on pending orders exists for exactly this.
    await supabase.from("orders").delete().eq("id", order.id);
    return { ok: false, error: "Couldn't place your order. Please try again." };
  }

  // The caller navigates to /orders/[id]. That page reads cookies, so it is
  // never cached and always renders this order fresh.
  return { ok: true, orderId: order.id };
}
