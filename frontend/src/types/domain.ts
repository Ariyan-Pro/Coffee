/**
 * Domain types mirroring the backend contract (app/schemas + app/models/enums).
 * The UI consumes these domain objects — never raw HTTP payloads — so mock
 * and live API repositories stay interchangeable (see src/lib/api/).
 */

/* ---- Enums (string unions, backend stores strings) ---- */

export type ProductStatus = "DRAFT" | "ACTIVE" | "INACTIVE";
export type RoastLevel = "LIGHT" | "MEDIUM" | "MEDIUM_DARK" | "DARK";
export type GrindOption = "WHOLE_BEAN" | "COARSE" | "MEDIUM" | "FINE" | "ESPRESSO";
export type PlanFrequency = "WEEKLY" | "BIWEEKLY" | "MONTHLY";
export type PlanStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "RETIRED";
export type SubscriptionStatus = "TRIALING" | "ACTIVE" | "PAUSED" | "CANCELLED" | "EXPIRED";
export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "PACKED"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED"
  | "RETURNED"
  | "FAILED";
export type PaymentStatus = "PENDING" | "INITIATED" | "COMPLETED" | "FAILED" | "CANCELLED" | "REFUNDED";
export type PaymentMethod = "JAZZCASH" | "EASYPAISA" | "COD";
export type DeliveryStatus =
  | "SCHEDULED"
  | "ASSIGNED"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED"
  | "RETURNED";

/* ---- Envelope ---- */

export interface APIResponse<T> {
  success: boolean;
  message: string | null;
  data: T | null;
}

/* ---- Structured data (JSON-LD) ---- */

export type JsonLd = Record<string, unknown>;

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

/* ---- Product ---- */

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  description: string | null;
  summary: string | null;
  origin_country: string;
  region: string | null;
  farm: string | null;
  altitude_m: number | null;
  processing_method: string | null;
  roast_level: RoastLevel;
  grind_options: string[];
  flavor_notes: string[];
  price_per_unit: number;
  weight_grams: number;
  stock_quantity: number;
  status: ProductStatus;
  image_url: string | null;
  is_featured: boolean;
  created_at: string;
}

/* ---- Subscription plans ---- */

export interface Plan {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  frequency: PlanFrequency;
  billing_interval_days: number;
  discount_percent: number;
  status: PlanStatus;
  sort_order: number;
}

/* ---- Auth ---- */

export interface AuthResult {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: Customer;
}

/* ---- Customer / addresses ---- */

export interface Customer {
  id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: "ADMIN" | "STAFF" | "CUSTOMER";
  status: "ACTIVE" | "INACTIVE" | "BLOCKED";
  is_email_verified: boolean;
  is_phone_verified: boolean;
  created_at: string;
}

export interface Address {
  id: number;
  user_id: number;
  label: string;
  recipient_name: string;
  phone: string;
  street_address: string;
  city: string;
  province: string | null;
  postal_code: string | null;
  is_default: boolean;
}

/* ---- Subscription ---- */

export interface Subscription {
  id: number;
  customer_id: number;
  plan_id: number;
  product_id: number;
  address_id: number | null;
  quantity: number;
  status: SubscriptionStatus;
  next_delivery_date: string;
  current_period_start: string | null;
  current_period_end: string | null;
  auto_renew: boolean;
  paused_until: string | null;
  cancellation_reason: string | null;
}

/* ---- Orders ---- */

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface Order {
  id: number;
  order_number: string;
  customer_id: number;
  subscription_id: number | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal: number;
  discount_amount: number;
  delivery_fee: number;
  total_amount: number;
  currency: string;
  address_snapshot: Record<string, unknown> | null;
  notes: string | null;
  paid_at: string | null;
  delivered_at: string | null;
  items: OrderItem[];
  created_at: string;
}

export interface Payment {
  id: number;
  order_id: number;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  provider_reference: string | null;
  created_at: string;
}

/* ---- Frontend presentation extensions (mock fixtures only, not backend) ---- */

export interface RoastMeta {
  label: string;
  intensity: number; // 0..1 for scale display
  description: string;
}

export const ROAST_META: Record<RoastLevel, RoastMeta> = {
  LIGHT: { label: "Light", intensity: 0.25, description: "Bright, tea-like body. Lets origin character lead." },
  MEDIUM: { label: "Medium", intensity: 0.5, description: "Balanced sweetness with a rounded, syrupy body." },
  MEDIUM_DARK: { label: "Medium-Dark", intensity: 0.75, description: "Deeper roast sugars; cocoa and warmth." },
  DARK: { label: "Dark", intensity: 1, description: "Bold, bittersweet, low-acid with a long finish." },
};
