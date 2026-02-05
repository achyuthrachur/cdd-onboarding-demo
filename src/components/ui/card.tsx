'use client';

import * as React from "react"
import { motion, HTMLMotionProps } from "framer-motion"

import { cn } from "@/lib/utils"
import { staggerItem, useReducedMotion } from "@/lib/animations"

// ============================================
// Static Card Components (unchanged)
// ============================================

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

// ============================================
// Animated Card Components
// ============================================

interface AnimatedCardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  /** Enable hover lift effect (default: true) */
  enableHover?: boolean;
  /** Use as a stagger child (uses staggerItem variants) */
  asStaggerChild?: boolean;
}

/**
 * AnimatedCard - Card with entrance animation and optional hover lift effect
 *
 * @example
 * // Basic usage with entrance animation
 * <AnimatedCard>Content</AnimatedCard>
 *
 * @example
 * // As a stagger child (use inside CardGroup)
 * <CardGroup>
 *   <AnimatedCard asStaggerChild>Card 1</AnimatedCard>
 *   <AnimatedCard asStaggerChild>Card 2</AnimatedCard>
 * </CardGroup>
 *
 * @example
 * // Disable hover effect
 * <AnimatedCard enableHover={false}>Content</AnimatedCard>
 */
const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ className, enableHover = true, asStaggerChild = false, ...props }, ref) => {
    const shouldReduceMotion = useReducedMotion();

    // Determine animation props based on usage mode
    const animationProps = asStaggerChild
      ? {
          // When used as stagger child, inherit animation from parent
          variants: staggerItem,
          whileHover: shouldReduceMotion || !enableHover ? undefined : { y: -4 },
        }
      : {
          // Standalone entrance animation
          initial: shouldReduceMotion ? undefined : { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          whileHover: shouldReduceMotion || !enableHover ? undefined : { y: -4 },
          transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const },
        };

    return (
      <motion.div
        ref={ref}
        data-slot="animated-card"
        className={cn(
          "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm transition-shadow",
          enableHover && !shouldReduceMotion && "hover:shadow-lg",
          className
        )}
        {...animationProps}
        {...props}
      />
    );
  }
);
AnimatedCard.displayName = "AnimatedCard";

// ============================================
// Card Group - Stagger Container
// ============================================

interface CardGroupProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  /** Children cards (should use AnimatedCard with asStaggerChild) */
  children: React.ReactNode;
  /** Stagger speed variant */
  staggerSpeed?: "fast" | "normal" | "slow";
}

/**
 * CardGroup - Stagger container for multiple AnimatedCards
 *
 * @example
 * <CardGroup className="grid grid-cols-3 gap-4">
 *   <AnimatedCard asStaggerChild>Card 1</AnimatedCard>
 *   <AnimatedCard asStaggerChild>Card 2</AnimatedCard>
 *   <AnimatedCard asStaggerChild>Card 3</AnimatedCard>
 * </CardGroup>
 */
const CardGroup = React.forwardRef<HTMLDivElement, CardGroupProps>(
  ({ children, className, staggerSpeed = "normal", ...props }, ref) => {
    const shouldReduceMotion = useReducedMotion();

    // Adjust stagger timing based on speed prop
    const staggerDelays = {
      fast: 0.05,
      normal: 0.08,
      slow: 0.12,
    };

    const customStaggerContainer = {
      hidden: { opacity: shouldReduceMotion ? 1 : 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: shouldReduceMotion ? 0 : staggerDelays[staggerSpeed],
          delayChildren: shouldReduceMotion ? 0 : 0.1,
        },
      },
    };

    return (
      <motion.div
        ref={ref}
        className={className}
        initial="hidden"
        animate="visible"
        variants={customStaggerContainer}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
CardGroup.displayName = "CardGroup";

// ============================================
// Exports
// ============================================

export {
  // Static components
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  // Animated components
  AnimatedCard,
  CardGroup,
}
