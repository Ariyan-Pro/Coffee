/**
 * Editorial SVG art library for EMBER.
 * Self-contained vector art (no external imagery) keeps the experience
 * deterministic, fast and free of broken media. Drawn in a consistent
 * duotone illustration language shared across hero, products and story.
 */

import { motion, type MotionValue } from "framer-motion";

interface ArtProps {
  className?: string;
  title?: string;
}

/** A single coffee bean with the classic S crease. Colors adapt via CSS vars. */
export function Bean({ className, title = "Coffee bean" }: ArtProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label={title}>
      <defs>
        <radialGradient id="bean-shine" cx="32%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse
        cx="32"
        cy="32"
        rx="23"
        ry="15"
        transform="rotate(-24 32 32)"
        fill="var(--bean-color, #3a2c20)"
      />
      <path
        d="M 27 21 C 34 30 36 42 40 50"
        fill="none"
        stroke="var(--bean-crease, rgba(0,0,0,0.35))"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M 30 22 C 35 26 35 30 33 34"
        fill="none"
        stroke="var(--bean-crease, rgba(0,0,0,0.22))"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <ellipse
        cx="32"
        cy="32"
        rx="23"
        ry="15"
        transform="rotate(-24 32 32)"
        fill="url(#bean-shine)"
      />
    </svg>
  );
}

/** A cluster of beans arranged like a cupping spread. */
export function BeanCluster({ className, count = 7, title = "Roasted beans" }: ArtProps & { count?: number }) {
  const spots = [
    { x: 26, y: 30, r: 34, d: 0, o: 1 },
    { x: 60, y: 52, r: 30, d: 40, o: 0.9 },
    { x: 96, y: 28, r: 38, d: 15, o: 1 },
    { x: 130, y: 56, r: 30, d: 60, o: 0.95 },
    { x: 66, y: 78, r: 34, d: 90, o: 0.92 },
    { x: 112, y: 86, r: 32, d: 20, o: 0.9 },
    { x: 40, y: 84, r: 28, d: 70, o: 0.85 },
  ].slice(0, count);
  return (
    <svg viewBox="0 0 160 112" className={className} role="img" aria-label={title}>
      {spots.map((s, i) => (
        <g key={i} transform={`translate(${s.x} ${s.y}) rotate(${s.d})`} opacity={s.o}>
          <ellipse cx="0" cy="0" rx="13" ry="9" fill="var(--bean-color, #4a382a)" />
          <path
            d="M -6 -7 C -2 -2 -1 4 2 9"
            fill="none"
            stroke="var(--bean-crease, rgba(0,0,0,0.35))"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <ellipse cx="0" cy="0" rx="13" ry="9" fill="url(#bean-shine2)" opacity="0.4" />
        </g>
      ))}
      <defs>
        <radialGradient id="bean-shine2" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

/** Rising steam curls. */
export function Steam({ className, title = "Steam rising" }: ArtProps) {
  return (
    <svg viewBox="0 0 120 90" className={className} role="img" aria-label={title}>
      <path
        className="animate-steam"
        d="M 30 84 C 22 66 38 58 30 42 C 26 34 32 28 36 20"
        fill="none"
        stroke="var(--steam-color, rgba(255,255,255,0.55))"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0"
      />
      <path
        className="animate-steam"
        style={{ animationDelay: "-2.2s" }}
        d="M 62 84 C 56 70 70 62 62 48 C 58 40 64 34 66 26"
        fill="none"
        stroke="var(--steam-color, rgba(255,255,255,0.4))"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0"
      />
      <path
        className="animate-steam"
        style={{ animationDelay: "-3.7s" }}
        d="M 92 84 C 86 68 100 60 92 46 C 88 38 94 32 96 24"
        fill="none"
        stroke="var(--steam-color, rgba(255,255,255,0.32))"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0"
      />
    </svg>
  );
}

/** Pour-over dripper with drips falling into a cup. */
export function PourOver({ className, title = "Pour-over brewing" }: ArtProps) {
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label={title}>
      <g transform="translate(70 34)">
        {/* cone */}
        <path
          d="M 0 0 L 60 0 L 40 66 L 20 66 Z"
          fill="var(--pour-cone, #33271c)"
          stroke="var(--pour-rim, rgba(255,255,255,0.18))"
          strokeWidth="1.5"
        />
        {/* inner coffee bed */}
        <path d="M 10 26 L 50 26 L 42 52 L 18 52 Z" fill="var(--pour-bed, #241b13)" opacity="0.9" />
        {/* drips */}
        <circle cx="30" cy="78" r="2.4" fill="var(--pour-drop, #9c6b3a)" opacity="0.9">
          <animate attributeName="cy" values="78;112" dur="1.1s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.9;0.15" dur="1.1s" repeatCount="indefinite" />
        </circle>
        <circle cx="30" cy="78" r="2" fill="var(--pour-drop, #9c6b3a)" opacity="0.8">
          <animate attributeName="cy" values="88;114" dur="1.3s" begin="0.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0.1" dur="1.3s" begin="0.4s" repeatCount="indefinite" />
        </circle>
      </g>
      {/* kettle stream (concept line) */}
      <path
        d="M 40 70 C 52 80 60 92 74 92"
        fill="none"
        stroke="var(--pour-drop, #c29b63)"
        strokeWidth="1.6"
        strokeDasharray="3 4"
        opacity="0.5"
      />
      {/* cup */}
      <path
        d="M 78 142 C 92 166 146 166 160 142 L 168 118 C 168 110 160 104 150 104 L 88 104 C 78 104 70 110 70 118 Z"
        fill="var(--cup-body, #f4efe6)"
        stroke="var(--cup-rim, rgba(29,23,18,0.2))"
        strokeWidth="1.4"
      />
      <path d="M 78 142 C 92 166 146 166 160 142 Z" fill="var(--cup-shadow, rgba(29,23,18,0.12))" />
      {/* liquid */}
      <path
        d="M 84 128 C 94 140 144 140 154 128 L 160 116 C 160 112 152 106 144 106 L 94 106 C 86 106 78 112 78 116 Z"
        fill="var(--cup-liquid, #9c6b3a)"
      />
      <ellipse cx="119" cy="112" rx="36" ry="6" fill="var(--cup-crema, #c29b63)" />
    </svg>
  );
}

/** Filling cup — liquid level is a fraction 0..1 (plain number or MotionValue). */
export function CupFill({
  className,
  level = 0.6,
  title = "A freshly brewed cup",
}: ArtProps & { level?: MotionValue<number> | number }) {
  const rimY = 84;
  const bottomY = 168;
  const fillTop =
    typeof level === "number"
      ? rimY + (bottomY - rimY) * (1 - level)
      : undefined;
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label={title}>
      <path
        d="M 74 92 C 88 172 150 172 164 92 L 174 74 C 174 66 166 60 156 60 L 82 60 C 72 60 64 66 64 74 Z"
        fill="var(--cup-body, #f4efe6)"
        stroke="var(--cup-rim, rgba(29,23,18,0.22))"
        strokeWidth="1.4"
      />
      {/* liquid */}
      <clipPath id="cup-clip">
        <path d="M 74 92 C 88 172 150 172 164 92 L 172 74 C 172 68 166 62 158 62 L 80 62 C 72 62 66 68 66 74 Z" />
      </clipPath>
      <g clipPath="url(#cup-clip)">
        {typeof level === "number" ? (
          <g>
            <rect x="60" y={fillTop} width="120" height={200 - (fillTop ?? 0)} fill="var(--cup-liquid, #241b13)" />
            <rect x="60" y={fillTop} width="120" height="10" fill="var(--cup-crema, #c29b63)" opacity="0.9" />
          </g>
        ) : (
          <motion.g>
            <motion.rect
              x="60"
              width="120"
              height={200}
              fill="var(--cup-liquid, #241b13)"
              initial={false}
              style={{ y: level }}
            />
            <motion.rect
              x="60"
              width="120"
              height="10"
              fill="var(--cup-crema, #c29b63)"
              opacity="0.9"
              initial={false}
              style={{ y: level }}
            />
          </motion.g>
        )}
      </g>
      {/* handle */}
      <path
        d="M 164 100 C 184 100 188 136 170 142"
        fill="none"
        stroke="var(--cup-body, #f4efe6)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M 164 100 C 184 100 188 136 170 142"
        fill="none"
        stroke="var(--cup-rim, rgba(29,23,18,0.18))"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray="1 9"
      />
    </svg>
  );
}
