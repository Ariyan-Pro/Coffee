/**
 * API client + envelope handling for the live backend.
 * Kept isolated: mock repositories below never touch the network, and the
 * live repositories swap in without any UI change.
 *
 * API mode is enabled by building with NEXT_PUBLIC_API_MODE=api. The session
 * token (from register/login) is stored in sessionStorage and attached to
 * every request as a Bearer header.
 */

import { plans, products, getProductBySlug } from "@/data/products";
import type {
  APIResponse,
  Address,
  AuthResult,
  Customer,
  Order,
  Page,
  Plan,
  Product,
  Subscription,
} from "@/types/domain";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE ??
  "http://localhost:8000/api/v1";

const SESSION_TOKEN_KEY = "ember-session-token";

export function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setSessionToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) window.sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    else window.sessionStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {
    /* ignore quota errors */
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getSessionToken();
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers as Record<string, string>),
      },
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "Network error. Check your connection and try again.");
  }

  let body: APIResponse<T>;
  try {
    body = (await res.json()) as APIResponse<T>;
  } catch {
    throw new ApiError(res.status, "The server returned an unreadable response.");
  }

  if (!res.ok || !body.success) {
    throw new ApiError(res.status, body.message ?? `Request failed (${res.status}).`);
  }
  return body.data as T;
}

/* ---- Repository contracts ---- */

export interface NewAddress {
  label?: string;
  recipient_name: string;
  phone: string;
  street_address: string;
  city: string;
}

export interface AuthRepository {
  register(input: {
    full_name: string;
    email?: string;
    phone?: string;
    password: string;
  }): Promise<AuthResult>;
  login(input: { identifier: string; password: string }): Promise<AuthResult>;
}

export interface ProductRepository {
  list(params?: { page?: number; pageSize?: number }): Promise<Page<Product>>;
  getById(id: number): Promise<Product>;
  getBySlug(slug: string): Promise<Product | null>;
}

export interface PlanRepository {
  list(): Promise<Plan[]>;
}

export interface CustomerRepository {
  me(): Promise<Customer>;
  listAddresses(): Promise<Address[]>;
  createAddress(input: NewAddress): Promise<Address>;
}

export interface SubscriptionRepository {
  list(): Promise<Subscription[]>;
  create(input: {
    planId: number;
    productId: number;
    addressId: number;
    quantity: number;
    autoRenew: boolean;
  }): Promise<Subscription>;
}

export interface OrderRepository {
  list(): Promise<Order[]>;
}

/* ---- Live (API) implementations ---- */

export const apiAuthRepository: AuthRepository = {
  async register(input) {
    return request<AuthResult>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  async login(input) {
    return request<AuthResult>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};

export const apiProductRepository: ProductRepository = {
  async list({ page = 1, pageSize = 20 } = {}) {
    return request<Page<Product>>(`/products?page=${page}&page_size=${pageSize}`);
  },
  async getById(id) {
    return request<Product>(`/products/${id}`);
  },
  async getBySlug(slug) {
    const page = await apiProductRepository.list({ pageSize: 100 });
    return page.items.find((p) => p.slug === slug) ?? null;
  },
};

export const apiPlanRepository: PlanRepository = {
  async list() {
    return request<Plan[]>("/plans");
  },
};

export const apiCustomerRepository: CustomerRepository = {
  async me() {
    return request<Customer>("/customers/me");
  },
  async listAddresses() {
    return request<Address[]>("/customers/me/addresses");
  },
  async createAddress(input) {
    return request<Address>("/customers/me/addresses", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};

export const apiSubscriptionRepository: SubscriptionRepository = {
  async list() {
    return request<Subscription[]>("/subscriptions");
  },
  async create({ planId, productId, addressId, quantity, autoRenew }) {
    return request<Subscription>("/subscriptions", {
      method: "POST",
      body: JSON.stringify({
        plan_id: planId,
        product_id: productId,
        address_id: addressId,
        quantity,
        auto_renew: autoRenew,
      }),
    });
  },
};

export const apiOrderRepository: OrderRepository = {
  async list() {
    return request<Order[]>("/orders");
  },
};

/* ---- Mock (fixture) implementations — the Phase-2 default ---- */

const wait = (ms = 120) => new Promise((r) => setTimeout(r, ms));

const mockAuth: AuthResult = {
  access_token: "mock-token-not-valid-server-side",
  token_type: "bearer",
  expires_in: 0,
  user: {
    id: 1,
    full_name: "Demo Customer",
    email: null,
    phone: null,
    role: "CUSTOMER",
    status: "ACTIVE",
    is_email_verified: false,
    is_phone_verified: false,
    created_at: new Date().toISOString(),
  },
};

export const mockAuthRepository: AuthRepository = {
  async register() {
    await wait(300);
    return { ...mockAuth, user: { ...mockAuth.user, full_name: "Demo Customer" } };
  },
  async login() {
    await wait(300);
    return { ...mockAuth, user: { ...mockAuth.user, full_name: "Demo Customer" } };
  },
};

export const mockProductRepository: ProductRepository = {
  async list({ page = 1, pageSize = 20 } = {}) {
    await wait();
    const total = products.length;
    const start = (page - 1) * pageSize;
    return {
      items: products.slice(start, start + pageSize),
      total,
      page,
      page_size: pageSize,
      pages: Math.max(1, Math.ceil(total / pageSize)),
    };
  },
  async getById(id) {
    await wait();
    const product = products.find((p) => p.id === id);
    if (!product) throw new Error("Product not found.");
    return product;
  },
  async getBySlug(slug) {
    await wait();
    const product = getProductBySlug(slug);
    if (!product) throw new Error("Product not found.");
    return product;
  },
};

export const mockPlanRepository: PlanRepository = {
  async list() {
    await wait();
    return plans;
  },
};

export const mockCustomerRepository: CustomerRepository = {
  async me() {
    throw new ApiError(401, "Sign in required. This demo runs on local fixtures.");
  },
  async listAddresses() {
    return [];
  },
  async createAddress() {
    await wait();
    return {
      id: 1,
      user_id: 1,
      label: "Home",
      recipient_name: "Demo Customer",
      phone: "+923000000000",
      street_address: "Demo Street",
      city: "Lahore",
      province: null,
      postal_code: null,
      is_default: true,
    };
  },
};

export const mockSubscriptionRepository: SubscriptionRepository = {
  async list() {
    return [];
  },
  async create({ quantity }) {
    await wait(300);
    return {
      id: Date.now(),
      customer_id: 1,
      plan_id: 1,
      product_id: 1,
      address_id: 1,
      quantity,
      status: "ACTIVE",
      next_delivery_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      current_period_start: new Date().toISOString().slice(0, 10),
      current_period_end: null,
      auto_renew: true,
      paused_until: null,
      cancellation_reason: null,
    };
  },
};

export const mockOrderRepository: OrderRepository = {
  async list() {
    return [];
  },
};

/* ---- Adapter selection ---- */

export const MOCK_MODE = process.env.NEXT_PUBLIC_API_MODE !== "api";

export const authRepository: AuthRepository = MOCK_MODE
  ? mockAuthRepository
  : apiAuthRepository;
export const productRepository: ProductRepository = MOCK_MODE
  ? mockProductRepository
  : apiProductRepository;
export const planRepository: PlanRepository = MOCK_MODE ? mockPlanRepository : apiPlanRepository;
export const customerRepository: CustomerRepository = MOCK_MODE
  ? mockCustomerRepository
  : apiCustomerRepository;
export const subscriptionRepository: SubscriptionRepository = MOCK_MODE
  ? mockSubscriptionRepository
  : apiSubscriptionRepository;
export const orderRepository: OrderRepository = MOCK_MODE ? mockOrderRepository : apiOrderRepository;
