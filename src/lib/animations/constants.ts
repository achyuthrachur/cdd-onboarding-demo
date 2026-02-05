/**
 * Animation Constants - Design System
 *
 * These constants mirror the CSS custom properties in globals.css
 * for use with Framer Motion animations.
 */

// Duration tokens (in seconds for Framer Motion)
// Slightly slower for more polished, professional feel
export const duration = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.35,
  slow: 0.45,
  slower: 0.6,
} as const;

// Easing curves matching the design system
export const ease = {
  // For enter animations - fast start, gradual stop
  out: [0.16, 1, 0.3, 1] as const,
  // For exit animations - gradual start, fast end
  in: [0.7, 0, 0.84, 0] as const,
  // For symmetric animations
  inOut: [0.65, 0, 0.35, 1] as const,
  // For bouncy/spring-like feel
  spring: [0.34, 1.56, 0.64, 1] as const,
};

// Spring configurations for physics-based animations
// Tuned for smooth, professional feel
export const spring = {
  // Snappy response
  snappy: { type: 'spring' as const, stiffness: 350, damping: 35 },
  // Gentle bounce
  gentle: { type: 'spring' as const, stiffness: 180, damping: 22 },
  // Bouncy feel
  bouncy: { type: 'spring' as const, stiffness: 280, damping: 18 },
  // Smooth, no overshoot
  smooth: { type: 'spring' as const, stiffness: 90, damping: 22 },
};

// Stagger delay between children (in seconds)
// Slightly slower for smoother visual flow
export const stagger = {
  fast: 0.07,
  normal: 0.1,
  slow: 0.15,
} as const;

// Common transition presets
export const transition = {
  // Default entrance transition
  enter: {
    duration: duration.normal,
    ease: ease.out,
  },
  // Default exit transition
  exit: {
    duration: duration.fast,
    ease: ease.in,
  },
  // For hover interactions
  hover: {
    duration: duration.fast,
    ease: ease.out,
  },
  // For page transitions
  page: {
    duration: duration.slow,
    ease: ease.out,
  },
} as const;
