"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"
import { motion, useSpring, useTransform } from "framer-motion"

import { cn } from "@/lib/utils"
import { spring, useReducedMotion } from "@/lib/animations"

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-gray-200 dark:bg-white/10 relative h-2 w-full overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="bg-crowe-amber h-full w-full flex-1 transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

// ============================================
// Animated Progress Component
// ============================================

interface AnimatedProgressProps
  extends Omit<React.ComponentProps<typeof ProgressPrimitive.Root>, "value"> {
  /** Progress value (0-100) */
  value?: number
  /** Show shimmer effect during loading */
  showShimmer?: boolean
  /** Custom color for the progress bar */
  indicatorClassName?: string
}

const AnimatedProgress = React.forwardRef<
  React.ComponentRef<typeof ProgressPrimitive.Root>,
  AnimatedProgressProps
>(
  (
    { className, value = 0, showShimmer = false, indicatorClassName, ...props },
    ref
  ) => {
    const shouldReduceMotion = useReducedMotion()

    // Use spring animation for smooth progress updates
    const springValue = useSpring(value, shouldReduceMotion ? { duration: 0 } : spring.smooth)
    const width = useTransform(springValue, (v) => `${v}%`)

    // Update spring when value changes
    React.useEffect(() => {
      springValue.set(value)
    }, [value, springValue])

    return (
      <ProgressPrimitive.Root
        ref={ref}
        data-slot="progress"
        className={cn(
          "bg-gray-200 dark:bg-white/10 relative h-2 w-full overflow-hidden rounded-full",
          className
        )}
        value={value}
        {...props}
      >
        <motion.div
          data-slot="progress-indicator"
          className={cn(
            "bg-crowe-amber h-full rounded-full",
            showShimmer && "relative overflow-hidden",
            indicatorClassName
          )}
          style={{ width }}
        >
          {showShimmer && !shouldReduceMotion && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          )}
        </motion.div>
      </ProgressPrimitive.Root>
    )
  }
)
AnimatedProgress.displayName = "AnimatedProgress"

// ============================================
// Progress with Label Component
// ============================================

interface LabeledProgressProps extends AnimatedProgressProps {
  /** Label to display above progress bar */
  label?: string
  /** Show percentage value */
  showPercentage?: boolean
}

const LabeledProgress = React.forwardRef<
  React.ComponentRef<typeof ProgressPrimitive.Root>,
  LabeledProgressProps
>(({ label, showPercentage = true, value = 0, ...props }, ref) => {
  const shouldReduceMotion = useReducedMotion()
  const springValue = useSpring(value, shouldReduceMotion ? { duration: 0 } : spring.smooth)
  const displayValue = useTransform(springValue, (v) => Math.round(v))
  const [displayNum, setDisplayNum] = React.useState(0)

  React.useEffect(() => {
    springValue.set(value)
  }, [value, springValue])

  React.useEffect(() => {
    const unsubscribe = displayValue.on("change", (v) => {
      setDisplayNum(v)
    })
    return unsubscribe
  }, [displayValue])

  return (
    <div className="space-y-1.5">
      {(label || showPercentage) && (
        <div className="flex justify-between text-sm">
          {label && <span className="text-gray-500 dark:text-white/60">{label}</span>}
          {showPercentage && (
            <span className="font-medium tabular-nums text-gray-900 dark:text-white">{displayNum}%</span>
          )}
        </div>
      )}
      <AnimatedProgress ref={ref} value={value} {...props} />
    </div>
  )
})
LabeledProgress.displayName = "LabeledProgress"

export { Progress, AnimatedProgress, LabeledProgress }
