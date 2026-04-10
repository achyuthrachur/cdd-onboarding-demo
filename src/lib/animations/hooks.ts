'use client';

/**
 * Animation Hooks - Custom hooks for animation control
 */

import { useReducedMotion, useSpring, useTransform, useMotionValue, useInView, useScroll, animate } from 'framer-motion';
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
  /** Pass true to trigger the animation (e.g., from an IntersectionObserver) */
  enabled?: boolean;
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
    enabled = true,
  } = options;

  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!startOnMount || !enabled) return;

    if (shouldReduceMotion) {
      count.set(targetValue);
      setDisplayValue(targetValue);
      return;
    }

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
  }, [targetValue, animDuration, delay, startOnMount, enabled, shouldReduceMotion, count]);

  return displayValue;
}

/**
 * Hook for count-up that triggers when element scrolls into view.
 * Returns [ref, displayValue] - attach ref to the container element.
 */
export function useCountUpOnScroll(
  targetValue: number,
  options: Omit<UseCountUpOptions, 'enabled' | 'startOnMount'> = {}
) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref as RefObject<Element>, { once: true, amount: 0.5 });
  const displayValue = useCountUp(targetValue, { ...options, enabled: isInView });

  return [ref, displayValue] as const;
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

// ============================================
// Parallax Hook
// ============================================

export function useParallax(ref: RefObject<Element | null>, speed: number = 0.3) {
  const { scrollYProgress } = useScroll({
    target: ref as RefObject<HTMLElement>,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [speed * 100, speed * -100]);

  return y;
}

// ============================================
// Page Scroll Progress Hook
// ============================================

export function useScrollProgress() {
  const { scrollYProgress } = useScroll();
  return scrollYProgress;
}

// ============================================
// Section Scroll Progress Hook
// ============================================

export function useSectionProgress(ref: RefObject<Element | null>) {
  const { scrollYProgress } = useScroll({
    target: ref as RefObject<HTMLElement>,
    offset: ['start end', 'end start'],
  });

  return scrollYProgress;
}
