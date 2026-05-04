import type { Transition } from "motion/react";

export const gmpMotionEase = {
  control: [0.2, 1, 0.2, 1] as [number, number, number, number],
  display: [0.22, 1, 0.36, 1] as [number, number, number, number],
} as const;

export const gmpMotionDurations = {
  fast: 0.18,
  fade: 0.25,
  enter: 0.24,
  panel: 0.3,
  slow: 0.4,
  loading: 0.5,
} as const;

export const gmpMotionTransitions = {
  controlFade: { duration: gmpMotionDurations.fade, ease: gmpMotionEase.control } satisfies Transition,
  controlEnter: { duration: gmpMotionDurations.panel, ease: gmpMotionEase.control } satisfies Transition,
  controlReveal: { duration: gmpMotionDurations.slow, ease: gmpMotionEase.control } satisfies Transition,
  controlLoading: { duration: gmpMotionDurations.loading, ease: gmpMotionEase.control } satisfies Transition,
  displayEnter: { duration: gmpMotionDurations.enter, ease: gmpMotionEase.display } satisfies Transition,
  displayHover: { duration: gmpMotionDurations.fast, ease: gmpMotionEase.display } satisfies Transition,
} as const;

export const gmpMotionSprings = {
  tracker: { type: "spring", stiffness: 400, damping: 35 } satisfies Transition,
} as const;
