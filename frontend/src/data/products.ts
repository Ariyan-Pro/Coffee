import type { Plan, Product, RoastLevel } from "@/types/domain";

/**
 * Local mock fixtures. Isolated from production components — swap the
 * repository implementation in src/lib/api to move to the live backend.
 */

/* ---- Product catalogue ---- */

export const products: Product[] = [
  {
    id: 1,
    name: "Yirgacheffe Idido",
    slug: "yirgacheffe-idido",
    sku: "EMBER-ETH-YIR-250",
    summary: "Washed Ethiopian classic. Florals, bergamot and a silky, tea-like finish.",
    description:
      "Grown on smallholder plots around the town of Idido in the Gedeo zone, this lot is washed and sun-dried on raised beds. It brews bright and delicate. The benchmark of Ethiopian terroir, and the first coffee we reach for in the morning.",
    origin_country: "Ethiopia",
    region: "Yirgacheffe, Gedeo Zone",
    farm: "Idido washing station, smallholder cooperative",
    altitude_m: 2000,
    processing_method: "Washed",
    roast_level: "LIGHT",
    grind_options: ["WHOLE_BEAN", "COARSE", "MEDIUM", "FINE", "ESPRESSO"],
    flavor_notes: ["Bergamot", "Jasmine", "Stone fruit"],
    price_per_unit: 2450,
    weight_grams: 250,
    stock_quantity: 42,
    status: "ACTIVE",
    image_url: null,
    is_featured: true,
    created_at: "2026-07-01T00:00:00Z",
  },
  {
    id: 2,
    name: "Huila El Diviso",
    slug: "huila-el-diviso",
    sku: "EMBER-COL-HUI-250",
    summary: "Colombian micro-lot with tropical fruit, caramel and a round, honeyed body.",
    description:
      "From high-altitude farms in Huila, this lot is naturally processed to preserve its fruit-forward character. Expect juicy acidity wrapped in caramel sweetness. An everyday favourite that also drinks beautifully cold.",
    origin_country: "Colombia",
    region: "Huila",
    farm: "El Diviso micro-lot farms",
    altitude_m: 1800,
    processing_method: "Natural",
    roast_level: "MEDIUM",
    grind_options: ["WHOLE_BEAN", "COARSE", "MEDIUM", "FINE", "ESPRESSO"],
    flavor_notes: ["Red apple", "Guava", "Caramel"],
    price_per_unit: 2150,
    weight_grams: 250,
    stock_quantity: 38,
    status: "ACTIVE",
    image_url: null,
    is_featured: true,
    created_at: "2026-07-01T00:00:00Z",
  },
  {
    id: 3,
    name: "Mandheling Reserve",
    slug: "mandheling-reserve",
    sku: "EMBER-IDN-MAN-250",
    summary: "Indonesian classic. Dark chocolate, cedar and a full, low-acid body.",
    description:
      "Semi-washed Sumatran coffee from the Mandheling region, known for its heavy body and earthy depth. The reserve lot is aged gently in the husk, producing a cup that is thick, sweet and grounding.",
    origin_country: "Indonesia",
    region: "Mandheling, North Sumatra",
    farm: "Gayo highlands smallholders",
    altitude_m: 1400,
    processing_method: "Semi-washed (Giling Basah)",
    roast_level: "MEDIUM_DARK",
    grind_options: ["WHOLE_BEAN", "COARSE", "MEDIUM", "FINE"],
    flavor_notes: ["Dark chocolate", "Cedar", "Molasses"],
    price_per_unit: 1950,
    weight_grams: 250,
    stock_quantity: 55,
    status: "ACTIVE",
    image_url: null,
    is_featured: true,
    created_at: "2026-07-01T00:00:00Z",
  },
  {
    id: 4,
    name: "Kieni AA",
    slug: "kieni-aa",
    sku: "EMBER-KEN-KIE-250",
    summary: "Kenyan AA with blackcurrant, grapefruit and a wine-like finish.",
    description:
      "A double-washed AA lot from the Kieni estate in Nyeri County. High-altitude, volcanic soil and a meticulous 48-hour fermentation give this coffee its signature bright, fruit-forward profile.",
    origin_country: "Kenya",
    region: "Kieni, Nyeri County",
    farm: "Kieni estate",
    altitude_m: 1900,
    processing_method: "Double washed",
    roast_level: "LIGHT",
    grind_options: ["WHOLE_BEAN", "COARSE", "MEDIUM", "FINE"],
    flavor_notes: ["Blackcurrant", "Grapefruit", "Brown sugar"],
    price_per_unit: 2650,
    weight_grams: 250,
    stock_quantity: 27,
    status: "ACTIVE",
    image_url: null,
    is_featured: false,
    created_at: "2026-07-01T00:00:00Z",
  },
  {
    id: 5,
    name: "Cerrado Sunrise",
    slug: "cerrado-sunrise",
    sku: "EMBER-BRA-CER-250",
    summary: "Brazilian classic. Cocoa, roasted peanut and a soft, easy-drinking body.",
    description:
      "From the Cerrado plateau, this natural-process lot is the coffee we recommend to everyone switching away from commodity blends. Smooth, chocolatey and forgiving to brew. A dependable daily cup.",
    origin_country: "Brazil",
    region: "Cerrado Mineiro",
    farm: "Cooperative lots, Cerrado plateau",
    altitude_m: 1100,
    processing_method: "Natural",
    roast_level: "MEDIUM",
    grind_options: ["WHOLE_BEAN", "COARSE", "MEDIUM", "FINE", "ESPRESSO"],
    flavor_notes: ["Cocoa", "Roasted peanut", "Nougat"],
    price_per_unit: 1750,
    weight_grams: 250,
    stock_quantity: 64,
    status: "ACTIVE",
    image_url: null,
    is_featured: false,
    created_at: "2026-07-01T00:00:00Z",
  },
  {
    id: 6,
    name: "Antigua Volcán",
    slug: "antigua-volcan",
    sku: "EMBER-GTM-ANT-250",
    summary: "Volcanic Guatemalan roast. Bittersweet cocoa, tobacco and warm spice.",
    description:
      "Grown on the slopes of Volcán de Agua and roasted darker to lean into its structure. Expect a bold, low-acid cup with lingering cocoa. A natural fit for milk or a strong after-dinner brew.",
    origin_country: "Guatemala",
    region: "Antigua Valley",
    farm: "Highland volcanic lots",
    altitude_m: 1600,
    processing_method: "Washed",
    roast_level: "DARK",
    grind_options: ["WHOLE_BEAN", "COARSE", "MEDIUM", "FINE"],
    flavor_notes: ["Bittersweet cocoa", "Tobacco", "Cinnamon"],
    price_per_unit: 2250,
    weight_grams: 250,
    stock_quantity: 31,
    status: "ACTIVE",
    image_url: null,
    is_featured: true,
    created_at: "2026-07-01T00:00:00Z",
  },
];

export const getProductBySlug = (slug: string): Product | undefined =>
  products.find((p) => p.slug === slug);

export const getFeaturedProducts = (): Product[] => products.filter((p) => p.is_featured);

/* ---- Subscription plans (mirror backend PlanOut) ---- */

export const plans: Plan[] = [
  {
    id: 1,
    name: "Weekly",
    slug: "weekly",
    description: "Never run dry. A fresh bag every 7 days.",
    frequency: "WEEKLY",
    billing_interval_days: 7,
    discount_percent: 10,
    status: "ACTIVE",
    sort_order: 1,
  },
  {
    id: 2,
    name: "Every Two Weeks",
    slug: "biweekly",
    description: "The balanced rhythm for a single drinker.",
    frequency: "BIWEEKLY",
    billing_interval_days: 14,
    discount_percent: 12,
    status: "ACTIVE",
    sort_order: 2,
  },
  {
    id: 3,
    name: "Monthly",
    slug: "monthly",
    description: "One exceptional bag, delivered every month.",
    frequency: "MONTHLY",
    billing_interval_days: 30,
    discount_percent: 15,
    status: "ACTIVE",
    sort_order: 3,
  },
];

/** The two schedule concepts exposed in the configurator (per spec section 16). */
export const configuratorPlans = [plans[0], plans[2]];

/* ---- Grind options ---- */

export const grindOptions = [
  { value: "WHOLE_BEAN", label: "Whole bean" },
  { value: "COARSE", label: "Coarse" },
  { value: "MEDIUM", label: "Medium" },
  { value: "FINE", label: "Fine" },
  { value: "ESPRESSO", label: "Espresso" },
] as const;

export const roastByLevel: Record<RoastLevel, string> = {
  LIGHT: "Light",
  MEDIUM: "Medium",
  MEDIUM_DARK: "Medium-dark",
  DARK: "Dark",
};
