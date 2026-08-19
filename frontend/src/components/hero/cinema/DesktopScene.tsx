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

interface DesktopSceneProps {
  progress: MotionValue<number>;
  className?: string;
  reduced?: boolean;
}

/**
 * Desktop cinematic: a stylised barista visibly makes coffee as you scroll.
 * Every element is driven by the scroll progress MotionValue through
 * useTransform chains (rAF-backed, no React re-renders per frame), so the
 * scene flows continuously:
 *
 *   reach for beans -> beans lifted -> beans pour into the grinder ->
 *   grinder operates -> grounds carried to the brewer -> brewing -> cup fills
 *   -> finished cup resolves forward.
 *
 * Composition: warm backlight, a figure in profile, depth layers with
 * parallax, a slow camera push-in, and a lighting bloom at the resolve.
 */
export function DesktopScene({ progress, className, reduced }: DesktopSceneProps) {
  /* ---- hand path (viewBox units; tightened choreography) ---- */
  const handX = useTransform(
    progress,
    HAND_PROGRESS,
    [700, 712, 710, 706, 690, 670, 655, 706, 706, 612, 560, 495, 460, 700, 700],
  );
  const handY = useTransform(
    progress,
    HAND_PROGRESS,
    [412, 428, 420, 380, 360, 340, 322, 410, 410, 440, 420, 345, 370, 412, 412],
  );

  /* ---- scoop (carries the beans; tilts as it pours) ---- */
  const scoopOpacity = useTransform(progress, [0.12, 0.16, 0.40, 0.44], [0, 1, 1, 0]);
  const scoopRotate = useTransform(progress, [0.22, 0.28, 0.38], [0, -70, -70]);

  /* ---- dose cup (carries the grounds from grinder to brewer) ---- */
  const doseOpacity = useTransform(progress, [0.46, 0.52, 0.64, 0.68], [0, 1, 1, 0]);
  const doseGrounds = useTransform(progress, [0.48, 0.56, 0.62, 0.66], [0, 1, 1, 0.15]);

  /* ---- beans arc from the scoop into the grinder hopper ---- */
  const beanAX = useTransform(progress, POUR_PROGRESS, [668, 640]);
  const beanAY = useTransform(progress, POUR_PROGRESS, [314, 342]);
  const beanAOpacity = useTransform(progress, [0.28, 0.32, 0.36], [0, 1, 0]);
  const beanBX = useTransform(progress, [0.31, 0.40], [666, 636]);
  const beanBY = useTransform(progress, [0.31, 0.40], [320, 344]);
  const beanBOpacity = useTransform(progress, [0.31, 0.35, 0.40], [0, 1, 0]);
  const beanCX = useTransform(progress, [0.30, 0.39], [662, 638]);
  const beanCY = useTransform(progress, [0.30, 0.39], [318, 341]);
  const beanCOpacity = useTransform(progress, [0.30, 0.34, 0.39], [0, 1, 0]);

  /* ---- grinder operates ---- */
  const grinderShake = useTransform(progress, GRIND_PROGRESS, [0, 1.6, -1.6, 2, -2, 1, 0]);
  const hopperJiggle = useTransform(progress, [0.42, 0.46, 0.50, 0.54], [0, -1.5, 0, 0]);
  const dustOpacity = useTransform(progress, [0.44, 0.48, 0.54, 0.58], [0, 0.7, 0.35, 0]);

  /* ---- brewing ---- */
  const streamOpacity = useTransform(progress, BREW_PROGRESS, [0, 1, 1, 0]);
  const coneGrounds = useTransform(progress, [0.60, 0.68], [0, 1]);
  const cupFillTop = useTransform(progress, [0.66, 0.88], [-6, -36]);
  const steamOpacity = useTransform(progress, [0.64, 0.74, 0.88, 1], [0, 0.9, 0.9, 1]);

  /* ---- resolve: the finished cup comes forward ---- */
  const cupX = useTransform(progress, RESOLVE_PROGRESS, [0, 46]);
  const cupScale = useTransform(progress, [0.82, 0.94], [1, 1.12]);
  const bloom = useTransform(progress, [0.78, 1], [0, 0.55]);

  /* ---- atmosphere / depth ---- */
  const shelfX = useTransform(progress, [0, 1], [0, 26]);
  const camScale = useTransform(progress, [0, 1], [1, 1.05]);

  return (
    <svg viewBox="0 0 1000 560" className={className} aria-hidden>
      <defs>
        <linearGradient id="cin-desk-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#181009" />
          <stop offset="55%" stopColor="#241b13" />
          <stop offset="100%" stopColor="#2c2117" />
        </linearGradient>
        <radialGradient id="cin-desk-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(201,155,99,0.30)" />
          <stop offset="55%" stopColor="rgba(201,155,99,0.09)" />
          <stop offset="100%" stopColor="rgba(201,155,99,0)" />
        </radialGradient>
        <clipPath id="cin-desk-cup">
          <path d="M -30 -58 L 30 -58 L 22 -4 C 12 2 -12 2 -22 -4 Z" />
        </clipPath>
      </defs>

      <rect width="1000" height="560" fill="url(#cin-desk-bg)" />

      {/* back shelf (slow parallax layer) */}
      <motion.g style={{ x: shelfX }} opacity={0.4}>
        <line x1="80" y1="212" x2="320" y2="212" stroke="#c29b63" strokeOpacity="0.14" strokeWidth="1.5" />
        <g transform="translate(128,150)">
          <rect x="0" y="28" width="30" height="34" rx="3" fill="#241b13" stroke="#c29b63" strokeOpacity="0.16" />
          <rect x="4" y="22" width="22" height="8" rx="2" fill="#1c130c" />
        </g>
        <g transform="translate(182,158)">
          <rect x="0" y="26" width="24" height="28" rx="3" fill="#2a2016" stroke="#c29b63" strokeOpacity="0.14" />
          <rect x="4" y="20" width="16" height="8" rx="2" fill="#1c130c" />
        </g>
      </motion.g>

      {/* warm working glow + bloom */}
      <ellipse cx="600" cy="370" rx="430" ry="300" fill="url(#cin-desk-glow)" opacity="0.55" />
      <motion.ellipse cx="600" cy="370" rx="430" ry="300" fill="url(#cin-desk-glow)" style={{ opacity: bloom }} />

      {/* camera group: slow push-in over the whole narrative */}
      <motion.g
        style={{ scale: camScale, transformBox: "fill-box", transformOrigin: "50% 55%" }}
      >
        {/* counter */}
        <rect x="60" y="470" width="880" height="90" fill="#171009" />
        <rect x="60" y="468" width="880" height="3" fill="#c29b63" opacity="0.26" />
        <rect x="60" y="476" width="880" height="2" fill="#3a2c20" opacity="0.5" />

        {/* loose beans on the counter */}
        <g opacity="0.9">
          <ellipse cx="716" cy="461" rx="6" ry="4.2" transform="rotate(-18 716 461)" fill="#4a382a" />
          <path d="M 712 459 C 714 460 715 462 716 464" stroke="rgba(0,0,0,0.4)" strokeWidth="1.2" fill="none" />
          <ellipse cx="733" cy="458" rx="5" ry="3.6" transform="rotate(22 733 458)" fill="#4a382a" />
          <ellipse cx="726" cy="464" rx="5" ry="3.6" transform="rotate(-6 726 464)" fill="#54402f" />
        </g>

        {/* ---- grinder ---- */}
        <motion.g style={{ x: grinderShake }}>
          <g transform="translate(590,336)">
            {/* base */}
            <rect x="12" y="120" width="96" height="14" rx="5" fill="#1c130c" />
            <rect x="12" y="120" width="96" height="2" fill="#c29b63" opacity="0.2" />
            {/* body */}
            <path d="M 18 36 L 102 36 L 95 120 L 25 120 Z" fill="#241b13" stroke="#c29b63" strokeOpacity="0.14" strokeWidth="1.5" />
            <path d="M 60 36 L 60 120" stroke="rgba(0,0,0,0.35)" strokeWidth="2" />
            {/* grounds window */}
            <rect x="44" y="66" width="32" height="22" rx="4" fill="#171009" stroke="#c29b63" strokeOpacity="0.16" />
            <rect x="48" y="80" width="24" height="6" rx="2" fill="#241b13" />
            {/* hopper */}
            <path d="M 30 0 L 90 0 L 100 36 L 20 36 Z" fill="#2a2016" stroke="#c29b63" strokeOpacity="0.22" strokeWidth="1.5" />
            <path d="M 34 6 L 86 6" stroke="#c29b63" strokeOpacity="0.18" strokeWidth="1.2" />
            {/* beans inside the hopper */}
            <motion.g style={{ y: hopperJiggle }}>
              <ellipse cx="52" cy="14" rx="6" ry="4.2" transform="rotate(-15 52 14)" fill="#4a382a" />
              <ellipse cx="66" cy="12" rx="6" ry="4.2" transform="rotate(20 66 12)" fill="#4a382a" />
              <ellipse cx="76" cy="18" rx="5.5" ry="4" transform="rotate(-5 76 18)" fill="#54402f" />
              <ellipse cx="58" cy="20" rx="5.5" ry="4" transform="rotate(30 58 20)" fill="#4a382a" />
            </motion.g>
            {/* chute */}
            <path d="M 26 104 L 10 122 L 6 118 L 22 100 Z" fill="#171009" />
          </g>
        </motion.g>

        {/* dose cup on the counter below the chute */}
        <g transform="translate(600,470)">
          <path d="M -12 0 L -12 -18 C -12 -22 -8 -24 0 -24 C 8 -24 12 -22 12 -18 L 12 0 Z" fill="#2a2016" stroke="#c29b63" strokeOpacity="0.22" strokeWidth="1.2" />
          <motion.rect
            x="-9"
            y="-18"
            width="18"
            height="16"
            fill="#241b13"
            style={{ scaleY: doseGrounds, transformBox: "fill-box", transformOrigin: "0% 100%" }}
          />
        </g>

        {/* ---- brewer + cup ---- */}
        <motion.g style={{ x: cupX, scale: cupScale, transformBox: "fill-box", transformOrigin: "50% 100%" }}>
          <g transform="translate(470,470)">
            {/* cone */}
            <path d="M -44 -130 L 44 -130 L 10 -64 L -10 -64 Z" fill="#241b13" stroke="#c29b63" strokeOpacity="0.2" strokeWidth="1.5" />
            <path d="M -26 -130 L -4 -64 M 0 -130 L 0 -64 M 26 -130 L 4 -64" stroke="#c29b63" strokeOpacity="0.12" strokeWidth="1.2" />
            {/* grounds mound in the cone */}
            <motion.ellipse
              cx="0"
              cy="-72"
              rx="9"
              ry="7"
              fill="#241b13"
              style={{ scaleY: coneGrounds, transformBox: "fill-box", transformOrigin: "50% 100%" }}
            />
            {/* drips (gated by brew) */}
            <motion.g style={{ opacity: streamOpacity }}>
              {reduced ? (
                <>
                  <circle cx="-3" cy="-34" r="2" fill="#c29b63" opacity="0.45" />
                  <circle cx="4" cy="-34" r="1.8" fill="#c29b63" opacity="0.4" />
                </>
              ) : (
                <>
                  <circle cx="-3" cy="-56" r="2" fill="#c29b63" opacity="0.8">
                    <animate attributeName="cy" values="-56;-10" dur="1.1s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0.1" dur="1.1s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="4" cy="-56" r="1.8" fill="#c29b63" opacity="0.7">
                    <animate attributeName="cy" values="-56;-10" dur="1.3s" begin="0.45s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.7;0.08" dur="1.3s" begin="0.45s" repeatCount="indefinite" />
                  </circle>
                </>
              )}
            </motion.g>
            {/* cup */}
            <path d="M -30 -58 L 30 -58 L 22 -4 C 12 2 -12 2 -22 -4 Z" fill="#f4efe6" stroke="rgba(29,23,18,0.24)" strokeWidth="1.4" />
            <path d="M -22 -4 C -12 2 12 2 22 -4 Z" fill="rgba(29,23,18,0.12)" />
            {/* handle */}
            <path d="M 22 -28 C 40 -28 42 -6 24 -2" fill="none" stroke="#f4efe6" strokeWidth="6" strokeLinecap="round" />
            {/* liquid + crema */}
            <g clipPath="url(#cin-desk-cup)">
              <motion.rect x="-40" width="80" height="70" fill="#241b13" style={{ y: cupFillTop }} />
              <motion.rect x="-40" width="80" height="5" fill="#c29b63" opacity="0.95" style={{ y: cupFillTop }} />
            </g>
          </g>
        </motion.g>

        {/* steam above the cup */}
        <motion.g style={{ opacity: steamOpacity }} transform="translate(470,300)">
          <g transform="scale(0.85)">
            <Steam className="h-auto w-40" />
          </g>
        </motion.g>

        {/* kettle + pour stream */}
        <g transform="translate(350,470)">
          <path d="M -24 -58 C -30 -46 -30 -34 -24 -22 C -16 -10 10 -10 20 -20 C 28 -32 28 -48 20 -58 Z" fill="#241b13" stroke="#c29b63" strokeOpacity="0.18" strokeWidth="1.5" />
          <circle cx="0" cy="-62" r="3" fill="#c29b63" opacity="0.5" />
          <path d="M -24 -48 C -42 -48 -42 -28 -26 -30" fill="none" stroke="#241b13" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M 20 -44 L 40 -50 C 46 -51 48 -46 44 -42" fill="none" stroke="#241b13" strokeWidth="5" strokeLinecap="round" />
        </g>
        <motion.path
          d="M 394 424 C 428 404 452 382 468 346"
          fill="none"
          stroke="#c29b63"
          strokeWidth="2.2"
          strokeLinecap="round"
          style={{ opacity: streamOpacity }}
        />

        {/* ---- the barista (figure in profile, facing the work) ---- */}
        <g transform="translate(748,340)">
          {/* torso */}
          <path d="M 0 0 L 52 0 Q 66 14 62 58 L 56 130 L -8 130 L -8 34 Q -6 12 0 0 Z" fill="#1c130c" />
          {/* rim light along the back */}
          <path d="M 52 0 Q 66 14 62 58 L 56 130" fill="none" stroke="#c29b63" strokeWidth="2.5" opacity="0.4" strokeLinecap="round" />
          {/* neck */}
          <rect x="18" y="-16" width="14" height="18" fill="#1c130c" />
          {/* head */}
          <circle cx="25" cy="-42" r="19" fill="#1c130c" />
          {/* hair bun */}
          <circle cx="34" cy="-56" r="6.5" fill="#1c130c" />
          {/* nose (facing left) */}
          <polygon points="4,-46 -3,-42 4,-38" fill="#1c130c" />
          {/* head rim light */}
          <path d="M 40 -54 A 19 19 0 0 1 44 -40 A 19 19 0 0 1 36 -52" fill="none" stroke="#c29b63" strokeWidth="1.6" opacity="0.35" />
          {/* shoulder cuff toward the work */}
          <path d="M 0 8 L -32 10 Q -38 16 -34 24 L 2 26 Z" fill="#1c130c" stroke="#c29b63" strokeOpacity="0.22" strokeWidth="1.2" />
        </g>

        {/* ---- the working hand + carried items ---- */}
        <motion.g style={{ x: handX, y: handY }}>
          {/* forearm + hand */}
          <ellipse cx="-14" cy="4" rx="18" ry="9" fill="#241b13" opacity="0.9" />
          <ellipse cx="0" cy="0" rx="12" ry="8.5" fill="#1c130c" stroke="#c29b63" strokeOpacity="0.4" strokeWidth="1.4" />
          <ellipse cx="8" cy="-4" rx="4.5" ry="3" transform="rotate(-25 8 -4)" fill="#1c130c" />
          {/* scoop of beans */}
          <motion.g
            style={{ opacity: scoopOpacity, rotate: scoopRotate, transformBox: "fill-box", transformOrigin: "20% 40%" }}
          >
            <path d="M -18 0 C -18 14 18 14 18 0 C 14 -2 6 -4 0 -4 C -6 -4 -14 -2 -18 0 Z" fill="#2a2016" stroke="#c29b63" strokeOpacity="0.25" strokeWidth="1.4" />
            <ellipse cx="-5" cy="-6" rx="4.4" ry="3" transform="rotate(-20 -5 -6)" fill="#4a382a" />
            <ellipse cx="4" cy="-5" rx="4.4" ry="3" transform="rotate(14 4 -5)" fill="#4a382a" />
            <ellipse cx="-1" cy="-9" rx="3.8" ry="2.6" transform="rotate(-4 -1 -9)" fill="#54402f" />
          </motion.g>
          {/* dose cup of grounds */}
          <motion.g style={{ opacity: doseOpacity }}>
            <path d="M -13 2 L -13 -16 C -13 -20 -8 -22 0 -22 C 8 -22 13 -20 13 -16 L 13 2 Z" fill="#2a2016" stroke="#c29b63" strokeOpacity="0.28" strokeWidth="1.3" />
            <motion.rect
              x="-10"
              y="-16"
              width="20"
              height="15"
              fill="#241b13"
              style={{ scaleY: doseGrounds, transformBox: "fill-box", transformOrigin: "50% 100%" }}
            />
          </motion.g>
        </motion.g>

        {/* beans arcing into the hopper */}
        <motion.circle style={{ cx: beanAX, cy: beanAY, opacity: beanAOpacity }} r="4.5" fill="#4a382a" />
        <motion.circle style={{ cx: beanBX, cy: beanBY, opacity: beanBOpacity }} r="4.2" fill="#54402f" />
        <motion.circle style={{ cx: beanCX, cy: beanCY, opacity: beanCOpacity }} r="4" fill="#4a382a" />

        {/* grind dust */}
        <motion.g style={{ opacity: dustOpacity }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <circle
              key={i}
              cx={610 + i * 16}
              cy={300 + ((i * 11) % 26)}
              r={1.6 + (i % 3) * 0.7}
              fill="#c29b63"
              opacity={0.7 - i * 0.08}
            />
          ))}
        </motion.g>
      </motion.g>

      {/* foreground depth */}
      <rect x="0" y="540" width="1000" height="20" fill="#100a06" opacity="0.65" />
    </svg>
  );
}
