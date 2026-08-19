/**
 * Product bag artwork — the packaging visual system.
 * One flexible pouch composition; each coffee gets its own accent hue
 * within the EMBER warm family so the grid reads as one collection.
 */

import type { Product } from "@/types/domain";
import { roastByLevel } from "@/data/products";

export interface ProductArtConfig {
  bag: string; // pouch body
  bagDeep: string; // gusset / shadow
  label: string; // label panel
  ink: string; // text on label
  accent: string; // band + seal
  glow: string; // radial glow
}

export const productArtConfigs: Record<string, ProductArtConfig> = {
  "yirgacheffe-idido": {
    bag: "#efe6d4",
    bagDeep: "#d9cbb0",
    label: "#3a2c20",
    ink: "#f4efe6",
    accent: "#b08a4f",
    glow: "rgba(176,138,79,0.35)",
  },
  "huila-el-diviso": {
    bag: "#efe0d0",
    bagDeep: "#d8c0a6",
    label: "#2b2018",
    ink: "#f4efe6",
    accent: "#c2502a",
    glow: "rgba(194,80,42,0.3)",
  },
  "mandheling-reserve": {
    bag: "#e4d7c2",
    bagDeep: "#c9b698",
    label: "#241b13",
    ink: "#f4efe6",
    accent: "#7a6a52",
    glow: "rgba(122,106,82,0.35)",
  },
  "kieni-aa": {
    bag: "#e7e0d2",
    bagDeep: "#cbbfaa",
    label: "#2c2419",
    ink: "#f4efe6",
    accent: "#9c6b3a",
    glow: "rgba(156,107,58,0.35)",
  },
  "cerrado-sunrise": {
    bag: "#e9e0d3",
    bagDeep: "#cfc0aa",
    label: "#33271c",
    ink: "#f4efe6",
    accent: "#8a6b40",
    glow: "rgba(138,107,64,0.3)",
  },
  "antigua-volcan": {
    bag: "#e2d6c6",
    bagDeep: "#c6b59c",
    label: "#1d1712",
    ink: "#f4efe6",
    accent: "#a43d2a",
    glow: "rgba(164,61,42,0.32)",
  },
};

const fallback: ProductArtConfig = {
  bag: "#efe6d4",
  bagDeep: "#d9cbb0",
  label: "#3a2c20",
  ink: "#f4efe6",
  accent: "#b08a4f",
  glow: "rgba(176,138,79,0.35)",
};

interface BagProps {
  product: Product;
  className?: string;
  /** Hide the printed metadata for small tiles */
  minimal?: boolean;
}

export function ProductBag({ product, className, minimal = false }: BagProps) {
  const c = productArtConfigs[product.slug] ?? fallback;
  const origin = product.origin_country;
  const roast = roastByLevel[product.roast_level];
  const weight = `${product.weight_grams}g`;

  return (
    <svg
      viewBox="0 0 240 300"
      className={className}
      role="img"
      aria-label={`${product.name}, ${roast} roast, ${origin}, ${weight}`}
    >
      <defs>
        <radialGradient id={`glow-${product.slug}`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={c.glow} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      <circle cx="120" cy="140" r="118" fill={`url(#glow-${product.slug})`} />

      {/* pouch body */}
      <path
        d="M 78 58 C 78 36 162 36 162 58 L 172 226 C 172 248 156 262 120 262 C 84 262 68 248 68 226 Z"
        fill={c.bag}
      />
      {/* gusset bottom */}
      <path d="M 68 226 C 84 248 156 248 172 226 L 168 244 C 154 258 86 258 72 244 Z" fill={c.bagDeep} />
      {/* top seal band */}
      <rect x="72" y="44" width="96" height="14" rx="3" fill={c.accent} opacity="0.92" />

      {/* label panel */}
      {!minimal ? (
        <g>
          <rect x="78" y="82" width="84" height="120" rx="6" fill={c.label} />
          <rect x="86" y="94" width="68" height="3" fill={c.accent} />
          <text
            x="120"
            y="128"
            textAnchor="middle"
            fontFamily="ui-serif, Georgia, serif"
            fontSize="13"
            fontWeight="600"
            fill={c.ink}
          >
            {product.name.length > 16 ? product.name.slice(0, 14) + "…" : product.name}
          </text>
          <text
            x="120"
            y="146"
            textAnchor="middle"
            fontFamily="ui-sans-serif, system-ui"
            fontSize="8.5"
            letterSpacing="1.5"
            fill={c.ink}
            opacity="0.75"
          >
            {origin}
          </text>
          <text
            x="120"
            y="162"
            textAnchor="middle"
            fontFamily="ui-sans-serif, system-ui"
            fontSize="8.5"
            fill={c.ink}
            opacity="0.75"
          >
            {roast} roast
          </text>
          <circle cx="120" cy="182" r="8" fill={c.accent} />
          <text
            x="120"
            y="185"
            textAnchor="middle"
            fontFamily="ui-sans-serif, system-ui"
            fontSize="7"
            fontWeight="700"
            fill="#1d1712"
          >
            E
          </text>
        </g>
      ) : (
        <circle cx="120" cy="120" r="26" fill={c.label} opacity="0.85" />
      )}
    </svg>
  );
}
