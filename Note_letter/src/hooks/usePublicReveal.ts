import { createContext, useContext } from 'react';
import type { MotionProps } from 'framer-motion';

/**
 * PublicLayout owns the single reduced-motion decision for all landing pages.
 * Pages read it from context so they don't each create their own media-query
 * listeners or store subscriptions.
 */
export const PublicMotionContext = createContext(false);
export const usePublicMotionDisabled = () => useContext(PublicMotionContext);

type RevealOptions = {
  delay?: number;
  y?: number;
  duration?: number;
};

const REVEAL_DURATION = 0.45;
const REVEAL_DISTANCE = 16;
const STAGGER_STEP = 0.08;

/** Fade + slight upward entrance for a single meaningful content block. */
export function getRevealProps(disabled: boolean, options: RevealOptions = {}): MotionProps {
  const { delay = 0, y = REVEAL_DISTANCE, duration = REVEAL_DURATION } = options;
  if (disabled) return { initial: false };
  return {
    initial: { opacity: 0, y },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.15 },
    transition: { duration, delay, ease: 'easeOut' },
  };
}

/** Parent that gently staggers its direct motion children into view. */
export function getRevealGroupProps(disabled: boolean, stagger = STAGGER_STEP): MotionProps {
  if (disabled) return {};
  return {
    initial: 'hidden',
    whileInView: 'show',
    viewport: { once: true, amount: 0.12 },
    variants: {
      hidden: {},
      show: { transition: { staggerChildren: stagger } },
    },
  };
}

/** Direct child of a reveal group. */
export function getRevealItemProps(disabled: boolean): MotionProps {
  if (disabled) return {};
  return {
    variants: {
      hidden: { opacity: 0, y: REVEAL_DISTANCE },
      show: {
        opacity: 1,
        y: 0,
        transition: { duration: REVEAL_DURATION, ease: 'easeOut' },
      },
    },
  };
}
