import { STATUS_CLASS, STATUS_LABEL } from "@/lib/orders";
import type { OrderStatus } from "@/lib/types";

export default function OrderStatusBadge({
  status,
  size = "sm",
}: {
  status: OrderStatus;
  size?: "sm" | "lg";
}) {
  return (
    <span
      className={`inline-block rounded-full border font-medium ${STATUS_CLASS[status]} ${
        size === "lg" ? "px-4 py-1.5 text-base" : "px-3 py-1 text-xs"
      }`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
