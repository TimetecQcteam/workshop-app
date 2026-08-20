import Link from "next/link";
import { formatOrderCode, formatOrderTime, formatPrice } from "@/lib/format";
import { ORDER_TYPE_LABEL } from "@/lib/orders";
import type { Order } from "@/lib/types";
import OrderStatusBadge from "./OrderStatusBadge";

/** One row in the customer's order history. */
export default function OrderCard({ order }: { order: Order }) {
  const itemCount = order.order_items.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <Link
      href={`/orders/${order.id}`}
      className="block rounded-2xl border border-black/5 bg-white/75 shadow-sm backdrop-blur-sm p-4 hover:bg-white"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{formatOrderCode(order.id)}</p>
          <p className="mt-0.5 text-sm text-gray-500">
            {formatOrderTime(order.created_at)} · {ORDER_TYPE_LABEL[order.order_type]}
          </p>
          <p className="mt-2 min-w-0 break-words text-sm text-gray-600">
            {order.order_items.map((line) => line.name_snapshot).join(", ")}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <OrderStatusBadge status={order.status} />
          <p className="mt-2 font-medium">{formatPrice(order.total_cents)}</p>
          <p className="text-xs text-gray-500">
            {itemCount} item{itemCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>
    </Link>
  );
}
