/**
 * Shared animation constants per Emil Kowalski best practices.
 * @see .cursor/skills/emilkowal-animations/SKILL.md
 *
 * - timing-300ms-max: UI animations under 300ms
 * - ease-out-default: cubic-bezier for responsive feel
 * - transform-never-scale-zero: min scale 0.95
 * - props-transform-opacity: animate only transform + opacity
 */

/** Custom cubic-bezier (ease-out). Starts fast, settles smoothly. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** 200ms — micro UI (buttons, toggles), max for interaction feedback. */
export const DURATION_FAST = 0.2;

/** 200ms — standard UI transitions. */
export const DURATION_NORMAL = 0.2;

/** 200ms — max for UI. */
export const DURATION_SLOW = 0.2;

/** Min enter scale (never scale(0) per transform-never-scale-zero). */
export const SCALE_ENTER_MIN = 0.95;

/** Stagger delay between children (ms). */
export const STAGGER_CHILDREN = 0.04;

/** fadeUp variant — opacity + y. Use with stagger parent. */
export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION_NORMAL, ease: EASE_OUT },
  },
};

/** fadeUp with custom delay (for non-stagger usage). */
export function fadeUpWithDelay(delay = 0) {
  return {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: DURATION_NORMAL, ease: EASE_OUT, delay },
    },
  };
}

/** fadeUp with custom index for stagger (visible: (i) =>). */
export function fadeUpCustom(staggerDelay = 0.06, duration = DURATION_NORMAL) {
  return {
    hidden: { opacity: 0, y: 16 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * staggerDelay, duration, ease: EASE_OUT },
    }),
  };
}

/** stagger variant — orchestrates children. */
export const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: STAGGER_CHILDREN } },
};

/** Tab/content switch for AnimatePresence. */
export const tabContent = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.16, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.14, ease: EASE_OUT },
  },
};

/** Simple fade (opacity only). */
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION_NORMAL, ease: EASE_OUT } },
};

/** Modal/drawer enter — scale from 0.95, opacity. */
export const modalEnter = {
  initial: { opacity: 0, scale: SCALE_ENTER_MIN },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATION_NORMAL, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    scale: SCALE_ENTER_MIN,
    transition: { duration: DURATION_FAST },
  },
};
