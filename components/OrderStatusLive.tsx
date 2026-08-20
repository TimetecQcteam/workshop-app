"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import OrderStatusBadge from "./OrderStatusBadge";
import type { OrderStatus } from "@/lib/types";

/**
 * The customer's live status badge.
 *
 * Realtime applies the same RLS policies as an ordinary query, so this
 * subscription can only ever deliver rows this customer is allowed to read —
 * the filter below is for efficiency, not for access control.
 */
export default function OrderStatusLive({
  orderId,
  initialStatus,
}: {
  orderId: string;
  initialStatus: OrderStatus;
}) {
  const [status, setStatus] = useState<OrderStatus>(initialStatus);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`order-status-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const next = (payload.new as { status?: OrderStatus }).status;
          if (next) setStatus(next);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [orderId]);

  return <OrderStatusBadge status={status} size="lg" />;
}
