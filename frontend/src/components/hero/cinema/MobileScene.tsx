"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import { Steam } from "@/components/art/art";
import {
  BREW_PROGRESS,
  GRIND_PROGRESS,
  HAND_PROGRESS,
  POUR_PROGRESS,
  RESOLVE_PROGRESS,
} from "@/components/hero/cinema/beats";

interface MobileSceneProps {
  progress: MotionValue<number>;
  className?: string;
  reduced?: boolean;
}

/**
 * Mobile cinematic: the same coffee-making story in a portrait composition.
 * Fewer simultaneous elements, larger objects, no unreadable tiny details.
 * The barista stands on the left; grinder, brewer and cup work right of the
 * figure; the hand travels the same beat sequence as the desktop scene.
 */
export function MobileScene({ progress, className, reduced }: MobileSceneProps) {
  /* ---- hand path (portrait viewBox units, tightened) ---- */
  const handX = useTransform(
    progress,
    HAND_PROGRESS,
    [150, 178, 175, 172, 168, 190, 222, 152, 152, 220, 250, 286, 270, 150, 150],
  );
  const handY = useTransform(
    progress,
    HAND_PROGRESS,
    [430, 450, 445, 420, 400, 370, 342, 428, 428, 455, 440, 388, 400, 425, 425],
  );

  /* ---- scoop ---- */
  const scoopOpacity = useTransform(progress, [0.12, 0.16, 0.40, 0.44], [0, 1, 1, 0]);
  const scoopRotate = useTransform(progress, [0.22, 0.28, 0.38], [0, -70, -70]);

  /* ---- dose cup ---- */
  const doseOpacity = useTransform(progress, [0.46, 0.52, 0.64, 0.68], [0, 1, 1, 0]);
  const doseGrounds = useTransform(progress, [0.48, 0.56, 0.62, 0.66], [0, 1, 1, 0.15]);

  /* ---- beans arc into the hopper ---- */
  const beanAX = useTransform(progress, POUR_PROGRESS, [232, 252]);
  const beanAY = useTransform(progress, POUR_PROGRESS, [334, 356]);
  const beanAOpacity = useTransform(progress, [0.28, 0.32, 0.36], [0, 1, 0]);
  const beanBX = useTransform(progress, [0.31, 0.40], [230, 250]);
  const beanBY = useTransform(progress, [0.31, 0.40], [338, 358]);
  const beanBOpacity = useTransform(progress, [0.31, 0.35, 0.40], [0, 1, 0]);

  /* ---- grinder operates ---- */
  const grinderShake = useTransform(progress, GRIND_PROGRESS, [0, 1.6, -1.6, 2, -2, 1, 0]);
  const hopperJiggle = useTransform(progress, [0.42, 0.46, 0.50, 0.54], [0, -1.5, 0, 0]);

  /* ---- brewing ---- */
  const streamOpacity = useTransform(progress, BREW_PROGRESS, [0, 1, 1, 0]);
  const coneGrounds = useTransform(progress, [0.60, 0.68], [0, 1]);
  const cupFillTop = useTransform(progress, [0.66, 0.88], [-6, -36]);
  const steamOpacity = useTransform(progress, [0.64, 0.74, 0.88, 1], [0, 0.9, 0.9, 1]);

  /* ---- resolve ---- */
  const cupX = useTransform(progress, RESOLVE_PROGRESS, [0, 30]);
  const cupScale = useTransform(progress, [0.82, 0.94], [1, 1.1]);
  const bloom = useTransform(progress, [0.78, 1], [0, 0.5]);
  const camScale = useTransform(progress, [0, 1], [1, 1.04]);

  return (
    <svg viewBox="0 0 400 620" className={className} aria-hidden>
      <defs>
        <linearGradient id="cin-mob-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#181009" />
          <stop offset="55%" stopColor="#241b13" />
          <stop offset="100%" stopColor="#2c2117" />
        </linearGradient>
        <radialGradient id="cin-mob-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(201,155,99,0.30)" />
          <stop offset="55%" stopColor="rgba(201,155,99,0.09)" />
          <stop offset="100%" stopColor="rgba(201,155,99,0)" />
        </radialGradient>
        <clipPath id="cin-mob-cup">
          <path d="M -34 -58 L 34 -58 L 26 -4 C 14 2 -14 2 -26 -4 Z" />
        </clipPath>
      </defs>

      <rect width="400" height="620" fill="url(#cin-mob-bg)" />

      {/* warm working glow + bloom */}
      <ellipse cx="255" cy="420" rx="260" ry="260" fill="url(#cin-mob-glow)" opacity="0.55" />
      <motion.ellipse cx="255" cy="420" rx="260" ry="260" fill="url(#cin-mob-glow)" style={{ opacity: bloom }} />

      {/* camera group */}
      <motion.g
        style={{ scale: camScale, transformBox: "fill-box", transformOrigin: "50% 60%" }}
      >
        {/* counter */}
        <rect x="30" y="520" width="340" height="100" fill="#171009" />
        <rect x="30" y="518" width="340" height="3" fill="#c29b63" opacity="0.26" />

        {/* ---- grinder ---- */}
        <motion.g style={{ x: grinderShake }}>
          <g transform="translate(235,360)">
            <rect x="10" y="136" width="76" height="14" rx="5" fill="#1c130c" />
            <path d="M 14 36 L 82 36 L 76 136 L 20 136 Z" fill="#241b13" stroke="#c29b63" strokeOpacity="0.14" strokeWidth="1.5" />
            <path d="M 48 36 L 48 136" stroke="rgba(0,0,0,0.35)" strokeWidth="2" />
            <path d="M 24 0 L 72 0 L 80 36 L 16 36 Z" fill="#2a2016" stroke="#c29b63" strokeOpacity="0.22" strokeWidth="1.5" />
            <motion.g style={{ y: hopperJiggle }}>
              <ellipse cx="40" cy="14" rx="5.4" ry="3.8" transform="rotate(-15 40 14)" fill="#4a382a" />
              <ellipse cx="54" cy="12" rx="5.4" ry="3.8" transform="rotate(20 54 12)" fill="#4a382a" />
              <ellipse cx="62" cy="20" rx="5" ry="3.6" transform="rotate(-5 62 20)" fill="#54402f" />
            </motion.g>
            <path d="M 20 120 L 6 138 L 3 134 L 16 116 Z" fill="#171009" />
          </g>
        </motion.g>

        {/* dose cup below the chute */}
        <g transform="translate(241,520)">
          <path d="M -11 0 L -11 -16 C -11 -20 -7 -22 0 -22 C 7 -22 11 -20 11 -16 L 11 0 Z" fill="#2a2016" stroke="#c29b63" strokeOpacity="0.22" strokeWidth="1.2" />
          <motion.rect
            x="-8"
            y="-16"
            width="16"
            height="14"
            fill="#241b13"
            style={{ scaleY: doseGrounds, transformBox: "fill-box", transformOrigin: "0% 100%" }}
          />
        </g>

        {/* ---- brewer + cup ---- */}
        <motion.g style={{ x: cupX, scale: cupScale, transformBox: "fill-box", transformOrigin: "50% 100%" }}>
          <g transform="translate(320,520)">
            <path d="M -36 -130 L 36 -130 L 12 -64 L -12 -64 Z" fill="#241b13" stroke="#c29b63" strokeOpacity="0.2" strokeWidth="1.5" />
            <path d="M -20 -130 L -4 -64 M 0 -130 L 0 -64 M 20 -130 L 4 -64" stroke="#c29b63" strokeOpacity="0.12" strokeWidth="1.2" />
            <motion.ellipse
              cx="0"
              cy="-72"
              rx="9"
              ry="7"
              fill="#241b13"
              style={{ scaleY: coneGrounds, transformBox: "fill-box", transformOrigin: "50% 100%" }}
            />
            <motion.g style={{ opacity: streamOpacity }}>
              {reduced ? (
                <>
                  <circle cx="-3" cy="-34" r="2.2" fill="#c29b63" opacity="0.45" />
                  <circle cx="4" cy="-34" r="2" fill="#c29b63" opacity="0.4" />
                </>
              ) : (
                <>
                  <circle cx="-3" cy="-56" r="2.2" fill="#c29b63" opacity="0.8">
                    <animate attributeName="cy" values="-56;-8" dur="1.1s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0.1" dur="1.1s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="4" cy="-56" r="2" fill="#c29b63" opacity="0.7">
                    <animate attributeName="cy" values="-56;-8" dur="1.3s" begin="0.45s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.7;0.08" dur="1.3s" begin="0.45s" repeatCount="indefinite" />
                  </circle>
                </>
              )}
            </motion.g>
            <path d="M -34 -58 L 34 -58 L 26 -4 C 14 2 -14 2 -26 -4 Z" fill="#f4efe6" stroke="rgba(29,23,18,0.24)" strokeWidth="1.4" />
            <path d="M -26 -4 C -14 2 14 2 26 -4 Z" fill="rgba(29,23,18,0.12)" />
            <path d="M 26 -28 C 44 -28 46 -6 28 -2" fill="none" stroke="#f4efe6" strokeWidth="6" strokeLinecap="round" />
            <g clipPath="url(#cin-mob-cup)">
              <motion.rect x="-42" width="84" height="74" fill="#241b13" style={{ y: cupFillTop }} />
              <motion.rect x="-42" width="84" height="5" fill="#c29b63" opacity="0.95" style={{ y: cupFillTop }} />
            </g>
          </g>
        </motion.g>

        {/* steam above the cup */}
        <motion.g style={{ opacity: steamOpacity }} transform="translate(320,310)">
          <Steam className="h-auto w-32" />
        </motion.g>

        {/* pour stream from above */}
        <motion.path
          d="M 312 120 C 314 220 316 300 318 384"
          fill="none"
          stroke="#c29b63"
          strokeWidth="2.2"
          strokeLinecap="round"
          style={{ opacity: streamOpacity }}
        />

        {/* scoop station on the counter */}
        <g transform="translate(185,515)">
          <path d="M -17 0 C -17 12 17 12 17 0 C 13 -2 6 -3 0 -3 C -6 -3 -13 -2 -17 0 Z" fill="#2a2016" stroke="#c29b63" strokeOpacity="0.22" strokeWidth="1.3" />
          <ellipse cx="-5" cy="-5" rx="4.2" ry="2.9" transform="rotate(-20 -5 -5)" fill="#4a382a" />
          <ellipse cx="4" cy="-4" rx="4.2" ry="2.9" transform="rotate(14 4 -4)" fill="#4a382a" />
          <ellipse cx="0" cy="-8" rx="3.6" ry="2.5" transform="rotate(-4 0 -8)" fill="#54402f" />
        </g>

        {/* ---- the barista (figure in profile, facing the work) ---- */}
        <g transform="translate(58,340)">
          <path d="M 0 0 L 44 0 Q 56 14 52 58 L 48 180 L -6 180 L -6 34 Q -4 12 0 0 Z" fill="#1c130c" />
          <path d="M 44 0 Q 56 14 52 58 L 48 180" fill="none" stroke="#c29b63" strokeWidth="2.5" opacity="0.4" strokeLinecap="round" />
          <rect x="14" y="-16" width="14" height="18" fill="#1c130c" />
          <circle cx="22" cy="-46" r="18" fill="#1c130c" />
          <circle cx="10" cy="-58" r="6" fill="#1c130c" />
          <polygon points="36,-48 44,-44 36,-40" fill="#1c130c" />
          <path d="M 6 -58 A 18 18 0 0 1 4 -42 A 18 18 0 0 1 12 -56" fill="none" stroke="#c29b63" strokeWidth="1.6" opacity="0.35" />
          <path d="M 44 10 L 78 12 Q 84 18 80 26 L 44 28 Z" fill="#1c130c" stroke="#c29b63" strokeOpacity="0.22" strokeWidth="1.2" />
        </g>

        {/* ---- the working hand + carried items ---- */}
        <motion.g style={{ x: handX, y: handY }}>
          <ellipse cx="-12" cy="4" rx="15" ry="8" fill="#241b13" opacity="0.9" />
          <ellipse cx="0" cy="0" rx="11" ry="7.6" fill="#1c130c" stroke="#c29b63" strokeOpacity="0.4" strokeWidth="1.3" />
          <ellipse cx="7" cy="-4" rx="4" ry="2.7" transform="rotate(-25 7 -4)" fill="#1c130c" />
          <motion.g
            style={{ opacity: scoopOpacity, rotate: scoopRotate, transformBox: "fill-box", transformOrigin: "20% 40%" }}
          >
            <path d="M -16 0 C -16 13 16 13 16 0 C 12 -2 5 -4 0 -4 C -5 -4 -12 -2 -16 0 Z" fill="#2a2016" stroke="#c29b63" strokeOpacity="0.25" strokeWidth="1.3" />
            <ellipse cx="-4" cy="-6" rx="4" ry="2.8" transform="rotate(-20 -4 -6)" fill="#4a382a" />
            <ellipse cx="4" cy="-5" rx="4" ry="2.8" transform="rotate(14 4 -5)" fill="#4a382a" />
          </motion.g>
          <motion.g style={{ opacity: doseOpacity }}>
            <path d="M -12 2 L -12 -15 C -12 -19 -8 -21 0 -21 C 8 -21 12 -19 12 -15 L 12 2 Z" fill="#2a2016" stroke="#c29b63" strokeOpacity="0.28" strokeWidth="1.2" />
            <motion.rect
              x="-9"
              y="-15"
              width="18"
              height="14"
              fill="#241b13"
              style={{ scaleY: doseGrounds, transformBox: "fill-box", transformOrigin: "50% 100%" }}
            />
          </motion.g>
        </motion.g>

        {/* beans arcing into the hopper */}
        <motion.circle style={{ cx: beanAX, cy: beanAY, opacity: beanAOpacity }} r="4.2" fill="#4a382a" />
        <motion.circle style={{ cx: beanBX, cy: beanBY, opacity: beanBOpacity }} r="4" fill="#54402f" />
      </motion.g>

      {/* foreground depth */}
      <rect x="0" y="596" width="400" height="24" fill="#100a06" opacity="0.65" />
    </svg>
  );
}
