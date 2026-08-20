"use server";

import { refresh } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isStaff } from "@/lib/supabase/session";
import { canTransition } from "@/lib/orders";
import type { OrderStatus } from "@/lib/types";

/**
 * Move an order along the kitchen queue.
 *
 * The /kitchen page already turns non-staff away, but that only protects the
 * screen — this action is reachable by a direct POST from anyone signed in.
 * So staff membership is checked HERE, against the database, every time.
 *
 * Three layers have to agree before a status changes:
 *   this check → the orders_update_staff RLS policy → the column grant that
 *   makes `status` the only updatable column on the table.
 */
export async function updateOrderStatus(
  orderId: string,
  nextStatus: OrderStatus
): Promise<{ error: string } | { error: null }> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Backend not connected yet." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Please sign in again." };

  if (!(await isStaff(supabase, user.id))) {
    return { error: "You don't have access to the kitchen screen." };
  }

  // Read the current status so we can check the move is a legal one. A
  // status is not a free-text field the client gets to set — only the
  // transitions in ALLOWED_TRANSITIONS are written.
  const { data: order, error: readError } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .maybeSingle();

  if (readError || !order) return { error: "That order no longer exists." };

  if (!canTransition(order.status as OrderStatus, nextStatus)) {
    return { error: "That status change isn't allowed." };
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({ status: nextStatus })
    .eq("id", orderId);

  if (updateError) return { error: "Couldn't update that order. Please try again." };

  // Refresh the kitchen screen for this staff member. The customer's page
  // updates on its own — Realtime pushes the row change to them.
  refresh();
  return { error: null };
}
