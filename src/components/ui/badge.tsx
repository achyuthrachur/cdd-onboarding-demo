"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { motion, AnimatePresence } from "framer-motion"

import { cn } from "@/lib/utils"
import { duration, useReducedMotion } from "@/lib/animations"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:ring-white/30 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-white/10 text-white border-white/20 [a&]:hover:bg-white/15",
        secondary:
          "bg-crowe-amber/20 text-crowe-amber border-crowe-amber/30 [a&]:hover:bg-crowe-amber/30",
        destructive:
          "bg-destructive/20 text-destructive border-destructive/30 [a&]:hover:bg-destructive/30 focus-visible:ring-destructive/20",
        outline:
          "border-white/20 text-white/80 bg-transparent [a&]:hover:bg-white/10 [a&]:hover:text-white",
        ghost: "border-transparent text-white/70 [a&]:hover:bg-white/10 [a&]:hover:text-white",
        link: "text-crowe-amber border-transparent underline-offset-4 [a&]:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

// ============================================
// Animated Badge Component
// ============================================

interface AnimatedBadgeProps
  extends React.ComponentProps<typeof motion.span>,
    VariantProps<typeof badgeVariants> {
  /** Enable pulse animation on mount or status change */
  pulse?: boolean
}

const AnimatedBadge = React.forwardRef<HTMLSpanElement, AnimatedBadgeProps>(
  ({ className, variant = "default", pulse = false, ...props }, ref) => {
    const shouldReduceMotion = useReducedMotion()

    return (
      <motion.span
        ref={ref}
        data-slot="badge"
        data-variant={variant}
        className={cn(badgeVariants({ variant }), className)}
        initial={{ scale: 1, opacity: 0 }}
        animate={{
          scale: pulse && !shouldReduceMotion ? [1, 1.1, 1] : 1,
          opacity: 1,
        }}
        whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
        whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
        transition={{
          duration: duration.fast,
          scale: pulse
            ? {
                duration: duration.normal,
                times: [0, 0.5, 1],
              }
            : undefined,
        }}
        {...props}
      />
    )
  }
)
AnimatedBadge.displayName = "AnimatedBadge"

// ============================================
// Status Badge with Color Transition
// ============================================

interface StatusBadgeProps
  extends Omit<AnimatedBadgeProps, "variant"> {
  /** The status determines the badge variant */
  status: "success" | "warning" | "error" | "info" | "default"
}

const statusVariantMap: Record<StatusBadgeProps["status"], VariantProps<typeof badgeVariants>["variant"]> = {
  success: "default",
  warning: "secondary",
  error: "destructive",
  info: "outline",
  default: "ghost",
}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, className, ...props }, ref) => {
    const shouldReduceMotion = useReducedMotion()
    const variant = statusVariantMap[status]

    return (
      <AnimatePresence mode="wait">
        <motion.span
          key={status}
          ref={ref}
          data-slot="badge"
          data-variant={variant}
          data-status={status}
          className={cn(badgeVariants({ variant }), className)}
          initial={shouldReduceMotion ? false : { scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={shouldReduceMotion ? undefined : { scale: 0.8, opacity: 0 }}
          whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
          transition={{ duration: duration.fast }}
          {...props}
        />
      </AnimatePresence>
    )
  }
)
StatusBadge.displayName = "StatusBadge"

export { Badge, AnimatedBadge, StatusBadge, badgeVariants }
