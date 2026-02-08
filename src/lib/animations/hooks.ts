'use client';

/**
 * Animation Hooks - Custom hooks for animation control
 */

import { useReducedMotion, useSpring, useTransform, useMotionValue, useInView, animate } from 'framer-motion';
import { useEffect, useRef, RefObject, useState } from 'react';
import { duration, ease } from './constants';

// Re-export useReducedMotion for convenience
export { useReducedMotion };

// ============================================
// Count Up Animation Hook
// ============================================

interface UseCountUpOptions {
  duration?: number;
  delay?: number;
  startOnMount?: boolean;
}

/**
 * Hook for animated count-up effect.
 * Returns an object with both the MotionValue and a display-ready string.
 */
export function useCountUp(
  targetValue: number,
  options: UseCountUpOptions = {}
) {
  const {
    duration: animDuration = 1,
    delay = 0,
    startOnMount = true,
  } = options;

  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const shouldReduceMotion = useReducedMotion();
  // Always start at 0 to avoid SSR mismatch (shouldReduceMotion can differ server vs client)
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!startOnMount) return;

    if (shouldReduceMotion) {
      count.set(targetValue);
      setDisplayValue(targetValue);
      return;
    }

    // If target is 0, nothing to animate
    if (targetValue === 0) {
      setDisplayValue(0);
      return;
    }

    let animationRef: { stop: () => void } | null = null;

    const timeout = setTimeout(() => {
      animationRef = animate(count, targetValue, {
        duration: animDuration,
        ease: ease.out,
        onUpdate: (latest) => setDisplayValue(Math.round(latest)),
      });
    }, delay * 1000);

    return () => {
      clearTimeout(timeout);
      animationRef?.stop();
    };
  }, [targetValue, animDuration, delay, startOnMount, shouldReduceMotion, count]);

  return displayValue;
}

// ============================================
// Scroll Trigger Hook
// ============================================

interface UseScrollTriggerOptions {
  threshold?: number;
  once?: boolean;
}

export function useScrollTrigger(
  ref: RefObject<Element>,
  options: UseScrollTriggerOptions = {}
) {
  const { threshold = 0.2, once = true } = options;

  const isInView = useInView(ref, {
    amount: threshold,
    once,
  });

  return isInView;
}

// ============================================
// Stagger Delay Calculator
// ============================================

export function useStaggerDelay(index: number, baseDelay: number = 0.08) {
  return index * baseDelay;
}

// ============================================
// Progress Animation Hook
// ============================================

export function useAnimatedProgress(value: number, maxValue: number = 100) {
  const shouldReduceMotion = useReducedMotion();
  const progress = useSpring(0, {
    stiffness: 100,
    damping: 20,
  });

  useEffect(() => {
    if (shouldReduceMotion) {
      progress.set(value);
    } else {
      progress.set(value);
    }
  }, [value, shouldReduceMotion, progress]);

  const percentage = useTransform(progress, (v) => `${(v / maxValue) * 100}%`);

  return { progress, percentage };
}

// ============================================
// Entrance Animation Hook (for list items)
// ============================================

interface UseEntranceAnimationOptions {
  delay?: number;
  duration?: number;
}

export function useEntranceAnimation(options: UseEntranceAnimationOptions = {}) {
  const {
    delay = 0,
    duration: animDuration = duration.normal,
  } = options;

  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return {
      initial: undefined,
      animate: undefined,
      transition: undefined,
    };
  }

  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: animDuration,
      delay,
      ease: ease.out,
    },
  };
}

// ============================================
// Hover Animation Hook
// ============================================

export function useHoverAnimation() {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return {
      whileHover: undefined,
      whileTap: undefined,
    };
  }

  return {
    whileHover: { y: -4, transition: { duration: duration.fast } },
    whileTap: { scale: 0.98 },
  };
}

// ============================================
// Focus Animation Hook
// ============================================

export function useFocusAnimation() {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return {
      whileFocus: undefined,
    };
  }

  return {
    whileFocus: {
      scale: 1.02,
      transition: { duration: duration.fast },
    },
  };
}

// ============================================
// Typing Indicator Hook
// ============================================

export function useTypingIndicator() {
  const shouldReduceMotion = useReducedMotion();

  const dotVariants = {
    initial: { y: 0 },
    animate: (i: number) => ({
      y: shouldReduceMotion ? 0 : [0, -6, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        delay: i * 0.15,
        ease: 'easeInOut',
      },
    }),
  };

  return { dotVariants };
}
