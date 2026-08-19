/**
 * Shared choreography timing for the hero cinematic.
 * Phase 4: tightened to eliminate dead zones. Every scroll interval
 * now contains meaningful visual activity.
 *
 * Compressed narrative:
 *   0.00 -> reach for beans
 *   0.08 -> hand touches beans
 *   0.14 -> scoop appears, beans lift
 *   0.20 -> hand carries scoop toward grinder (overlapping with scoop rotation)
 *   0.28 -> scoop tilts, beans pour
 *   0.36 -> beans arc into hopper
 *   0.42 -> grinder shakes
 *   0.52 -> grounds settle, dose cup appears
 *   0.58 -> hand carries dose cup to brewer
 *   0.64 -> brewing begins (drips)
 *   0.72 -> cup fills
 *   0.82 -> cup resolves forward
 *   0.92 -> bloom + steam
 *   1.00 -> finished
 *
 * Hand path waypoints (one per scene, in that scene's viewBox units).
 * Indexes correspond to HAND_PROGRESS.
 */

/** Scroll-progress keyframes for the hand's travel path. */
export const HAND_PROGRESS = [
  0, 0.08, 0.14, 0.18, 0.24, 0.28, 0.36, 0.42, 0.52, 0.58, 0.64, 0.72, 0.82, 0.92, 1,
];

export const POUR_PROGRESS = [0.28, 0.38];
export const GRIND_PROGRESS = [0.42, 0.45, 0.48, 0.50, 0.52, 0.54, 0.56];
export const BREW_PROGRESS = [0.64, 0.70, 0.80, 0.88];
export const RESOLVE_PROGRESS = [0.82, 0.94];


