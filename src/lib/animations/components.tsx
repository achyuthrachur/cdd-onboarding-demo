'use client';

/**
 * Animated Components - Reusable Animation Wrappers
 *
 * These components provide easy-to-use animation patterns
 * that respect user's reduced motion preferences.
 */

import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ReactNode, ComponentProps, useRef } from 'react';
import {
  fadeIn,
  fadeInUp,
  scaleIn,
  staggerContainer,
  staggerItem,
  tabContent,
  modalOverlay,
  modalContent,
  chatMessage,
  cardHover,
  scrollRevealUp,
  scrollRevealDown,
  scrollRevealLeft,
  scrollRevealRight,
  scrollScale,
  scrollStaggerContainer,
  scrollStaggerItem,
} from './variants';
import { duration, ease } from './constants';

// ============================================
// Fade In Component
// ============================================

interface AnimatedProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function FadeIn({ children, className, delay = 0 }: AnimatedProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={fadeIn}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// Fade In Up Component
// ============================================

export function FadeInUp({ children, className, delay = 0 }: AnimatedProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={fadeInUp}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// Scale In Component
// ============================================

export function ScaleIn({ children, className, delay = 0 }: AnimatedProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={scaleIn}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// Stagger Container & Item
// ============================================

interface StaggerContainerProps extends AnimatedProps {
  as?: 'div' | 'ul' | 'ol' | 'section' | 'article';
}

export function StaggerContainer({
  children,
  className,
  as = 'div',
}: StaggerContainerProps) {
  const shouldReduceMotion = useReducedMotion();
  const Component = motion[as];

  if (shouldReduceMotion) {
    const StaticComponent = as;
    return <StaticComponent className={className}>{children}</StaticComponent>;
  }

  return (
    <Component
      className={className}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={staggerContainer}
    >
      {children}
    </Component>
  );
}

interface StaggerItemProps extends AnimatedProps {
  as?: 'div' | 'li' | 'article';
}

export function StaggerItem({
  children,
  className,
  as = 'div',
}: StaggerItemProps) {
  const shouldReduceMotion = useReducedMotion();
  const Component = motion[as];

  if (shouldReduceMotion) {
    const StaticComponent = as;
    return <StaticComponent className={className}>{children}</StaticComponent>;
  }

  return (
    <Component className={className} variants={staggerItem}>
      {children}
    </Component>
  );
}

// ============================================
// Animated Card with Hover
// ============================================

interface AnimatedCardProps extends AnimatedProps {
  onClick?: () => void;
  whileHover?: boolean;
}

export function AnimatedCard({
  children,
  className,
  onClick,
  whileHover = true,
}: AnimatedCardProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className={className} onClick={onClick}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      onClick={onClick}
      initial="initial"
      whileHover={whileHover ? 'hover' : undefined}
      variants={cardHover}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// Tab Content with AnimatePresence
// ============================================

interface AnimatedTabContentProps {
  children: ReactNode;
  activeKey: string;
  className?: string;
}

export function AnimatedTabContent({
  children,
  activeKey,
  className,
}: AnimatedTabContentProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeKey}
        className={className}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={tabContent}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================
// Modal Animation Wrapper
// ============================================

interface AnimatedModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: ReactNode;
  overlayClassName?: string;
  contentClassName?: string;
}

export function AnimatedModal({
  isOpen,
  children,
  overlayClassName,
  contentClassName,
}: AnimatedModalProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className={overlayClassName}
            initial={shouldReduceMotion ? undefined : 'hidden'}
            animate="visible"
            exit="exit"
            variants={modalOverlay}
          />
          <motion.div
            className={contentClassName}
            initial={shouldReduceMotion ? undefined : 'hidden'}
            animate="visible"
            exit="exit"
            variants={modalContent}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================
// Chat Message Animation
// ============================================

interface AnimatedChatMessageProps extends AnimatedProps {
  index?: number;
}

export function AnimatedChatMessage({
  children,
  className,
  index = 0,
}: AnimatedChatMessageProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={chatMessage}
      transition={{ delay: index * 0.05 }}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// Animated List
// ============================================

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedList({ children, className }: AnimatedListProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <ul className={className}>{children}</ul>;
  }

  return (
    <motion.ul
      className={className}
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {children}
    </motion.ul>
  );
}

export function AnimatedListItem({ children, className }: AnimatedListProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <li className={className}>{children}</li>;
  }

  return (
    <motion.li className={className} variants={staggerItem}>
      {children}
    </motion.li>
  );
}

// ============================================
// Page Transition Wrapper
// ============================================

interface PageTransitionProps extends AnimatedProps {
  /** Unique key for the page (usually the route) */
  pageKey: string;
}

export function PageTransition({
  children,
  className,
  pageKey,
}: PageTransitionProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pageKey}
        className={className}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: duration.slow, ease: ease.out }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================
// Presence Animation (for conditional rendering)
// ============================================

interface PresenceProps {
  children: ReactNode;
  isVisible: boolean;
  className?: string;
}

export function Presence({ children, isVisible, className }: PresenceProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return isVisible ? <div className={className}>{children}</div> : null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={className}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={fadeInUp}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// Scroll Reveal Component (Apple-style viewport reveals)
// ============================================

type ScrollDirection = 'up' | 'down' | 'left' | 'right';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  direction?: ScrollDirection;
  delay?: number;
  once?: boolean;
  amount?: number;
}

const directionVariantMap = {
  up: scrollRevealUp,
  down: scrollRevealDown,
  left: scrollRevealLeft,
  right: scrollRevealRight,
};

export function ScrollReveal({
  children,
  className,
  direction = 'up',
  delay = 0,
  once = true,
  amount = 0.2,
}: ScrollRevealProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={directionVariantMap[direction]}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// Scroll Scale Component (product reveal style)
// ============================================

interface ScrollScaleProps {
  children: ReactNode;
  className?: string;
  once?: boolean;
  amount?: number;
}

export function ScrollScale({
  children,
  className,
  once = true,
  amount = 0.3,
}: ScrollScaleProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={scrollScale}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// Scroll Stagger Container (cards/grids revealing on scroll)
// ============================================

interface ScrollStaggerProps {
  children: ReactNode;
  className?: string;
  once?: boolean;
  amount?: number;
  as?: 'div' | 'ul' | 'section' | 'article';
}

export function ScrollStagger({
  children,
  className,
  once = true,
  amount = 0.15,
  as = 'div',
}: ScrollStaggerProps) {
  const shouldReduceMotion = useReducedMotion();
  const Component = motion[as];

  if (shouldReduceMotion) {
    const StaticComponent = as;
    return <StaticComponent className={className}>{children}</StaticComponent>;
  }

  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={scrollStaggerContainer}
    >
      {children}
    </Component>
  );
}

export function ScrollStaggerItem({
  children,
  className,
  as = 'div',
}: { children: ReactNode; className?: string; as?: 'div' | 'li' | 'article' }) {
  const shouldReduceMotion = useReducedMotion();
  const Component = motion[as];

  if (shouldReduceMotion) {
    const StaticComponent = as;
    return <StaticComponent className={className}>{children}</StaticComponent>;
  }

  return (
    <Component className={className} variants={scrollStaggerItem}>
      {children}
    </Component>
  );
}

// ============================================
// Parallax Layer Component
// ============================================

interface ParallaxLayerProps {
  children: ReactNode;
  className?: string;
  speed?: number;
}

export function ParallaxLayer({
  children,
  className,
  speed = 0.3,
}: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [speed * 100, speed * -100]);

  if (shouldReduceMotion) {
    return <div ref={ref} className={className}>{children}</div>;
  }

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>
        {children}
      </motion.div>
    </div>
  );
}

// ============================================
// Scroll Progress Bar
// ============================================

interface ScrollProgressProps {
  className?: string;
}

export function ScrollProgress({ className }: ScrollProgressProps) {
  const { scrollYProgress } = useScroll();
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) return null;

  return (
    <motion.div
      className={`fixed top-0 left-0 right-0 h-[2px] bg-crowe-amber origin-left z-[1000] ${className || ''}`}
      style={{ scaleX: scrollYProgress }}
    />
  );
}

// ============================================
// Re-export motion and AnimatePresence
// ============================================

export { motion, AnimatePresence };
export type { MotionProps } from 'framer-motion';
