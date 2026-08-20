/** Shapes returned by the queries in this app. Kept in one place so the
 *  server pages and the client components agree on them. */

export type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  is_available: boolean;
};

export type MenuCategory = {
  id: string;
  name: string;
  items: MenuItem[];
};

export type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export type OrderType = "pickup" | "dine_in";

export type OrderLine = {
  id: string;
  name_snapshot: string;
  unit_price_cents: number;
  quantity: number;
  line_total_cents: number;
};

export type Order = {
  id: string;
  status: OrderStatus;
  order_type: OrderType;
  customer_name: string;
  note: string | null;
  total_cents: number;
  created_at: string;
  order_items: OrderLine[];
};
