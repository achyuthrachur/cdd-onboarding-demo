/**
 * Framer Motion Variants - Reusable Animation Patterns
 *
 * Usage:
 * <motion.div variants={fadeInUp} initial="hidden" animate="visible" />
 */

import { Variants } from 'framer-motion';
import { duration, ease, stagger } from './constants';

// ============================================
// Basic Fade Animations
// ============================================

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: duration.normal, ease: ease.out },
  },
  exit: {
    opacity: 0,
    transition: { duration: duration.fast, ease: ease.in },
  },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.normal, ease: ease.out },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: duration.fast, ease: ease.in },
  },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.normal, ease: ease.out },
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: { duration: duration.fast, ease: ease.in },
  },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: duration.normal, ease: ease.out },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: duration.fast, ease: ease.in },
  },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: duration.normal, ease: ease.out },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: duration.fast, ease: ease.in },
  },
};

// ============================================
// Scale Animations
// ============================================

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: duration.normal, ease: ease.out },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: duration.fast, ease: ease.in },
  },
};

export const scaleInBounce: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: duration.slow, ease: ease.spring },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: duration.fast, ease: ease.in },
  },
};

// ============================================
// Modal/Dialog Animations
// ============================================

export const modalOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: duration.fast },
  },
  exit: {
    opacity: 0,
    transition: { duration: duration.fast },
  },
};

export const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: duration.normal, ease: ease.out },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: duration.fast, ease: ease.in },
  },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: '100%' },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.slow, ease: ease.out },
  },
  exit: {
    opacity: 0,
    y: '100%',
    transition: { duration: duration.normal, ease: ease.in },
  },
};

// ============================================
// Stagger Container Variants
// ============================================

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: stagger.normal,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: stagger.fast,
      staggerDirection: -1,
    },
  },
};

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: stagger.fast,
      delayChildren: 0.05,
    },
  },
};

export const staggerContainerSlow: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: stagger.slow,
      delayChildren: 0.15,
    },
  },
};

// Stagger item (use with stagger containers)
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.normal, ease: ease.out },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: duration.fast },
  },
};

export const staggerItemScale: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: duration.normal, ease: ease.out },
  },
};

// ============================================
// Tab/Content Transitions
// ============================================

export const tabContent: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.normal, ease: ease.out },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: duration.fast, ease: ease.in },
  },
};

export const tabContentHorizontal: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: duration.normal, ease: ease.out },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: duration.fast, ease: ease.in },
  },
};

// ============================================
// Card Hover Effects
// ============================================

export const cardHover: Variants = {
  initial: { y: 0, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.07)' },
  hover: {
    y: -4,
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.12)',
    transition: { duration: duration.fast, ease: ease.out },
  },
};

export const cardHoverSubtle: Variants = {
  initial: { y: 0 },
  hover: {
    y: -2,
    transition: { duration: duration.fast, ease: ease.out },
  },
};

// ============================================
// List Item Animations
// ============================================

export const listItem: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: duration.normal, ease: ease.out },
  },
  exit: {
    opacity: 0,
    x: 10,
    height: 0,
    transition: { duration: duration.fast },
  },
};

// ============================================
// Chat Message Animation
// ============================================

export const chatMessage: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: duration.normal, ease: ease.out },
  },
};

// ============================================
// Progress/Loading Animations
// ============================================

export const progressBar: Variants = {
  hidden: { scaleX: 0 },
  visible: (percent: number) => ({
    scaleX: percent / 100,
    transition: { duration: duration.slow, ease: ease.out },
  }),
};

export const pulse: Variants = {
  initial: { scale: 1 },
  pulse: {
    scale: [1, 1.05, 1],
    transition: { duration: 0.6, repeat: Infinity },
  },
};

// ============================================
// Badge/Status Animations
// ============================================

export const badgeUpdate: Variants = {
  initial: { scale: 1 },
  update: {
    scale: [1, 1.2, 1],
    transition: { duration: duration.normal, ease: ease.spring },
  },
};

export const checkmark: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: duration.slow, ease: ease.out },
  },
};
