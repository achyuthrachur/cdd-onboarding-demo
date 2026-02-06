"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Tabs as TabsPrimitive } from "radix-ui"
import { motion, AnimatePresence } from "framer-motion"

import { cn } from "@/lib/utils"
import { tabContent } from "@/lib/animations"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-[orientation=horizontal]:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "rounded-lg p-1 group-data-[orientation=horizontal]/tabs:h-10 data-[variant=line]:rounded-none group/tabs-list inline-flex w-fit items-center justify-center group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col",
  {
    variants: {
      variant: {
        default: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300",
        line: "gap-1 bg-transparent text-gray-600 dark:text-gray-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // Base styles
        "relative inline-flex h-8 flex-1 items-center justify-center gap-2 rounded-md border border-transparent px-4 py-2 text-sm font-medium whitespace-nowrap transition-all",
        // Layout variants
        "group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start",
        // Focus styles
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:border-gray-300 focus-visible:ring-gray-300 dark:focus-visible:border-white/30 dark:focus-visible:ring-white/20",
        // Disabled styles
        "disabled:pointer-events-none disabled:opacity-50",
        // Icon styles
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // Inactive state - visible text with hover
        "text-gray-600 dark:text-gray-300",
        "hover:text-gray-900 dark:hover:text-white",
        "hover:bg-white/50 dark:hover:bg-white/10",
        // Active state - clear visual distinction
        "data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm",
        "dark:data-[state=active]:bg-white/20 dark:data-[state=active]:text-white",
        // Line variant overrides
        "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent",
        "group-data-[variant=line]/tabs-list:data-[state=active]:shadow-none",
        // Amber underline for line variant
        "after:bg-crowe-amber after:absolute after:opacity-0 after:transition-opacity",
        "group-data-[orientation=horizontal]/tabs:after:inset-x-0 group-data-[orientation=horizontal]/tabs:after:bottom-[-5px] group-data-[orientation=horizontal]/tabs:after:h-0.5",
        "group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:-right-1 group-data-[orientation=vertical]/tabs:after:w-0.5",
        "group-data-[variant=line]/tabs-list:data-[state=active]:after:opacity-100",
        className
      )}
      {...props}
    />
  )
}

// Check for reduced motion preference
function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  return prefersReducedMotion
}

interface TabsContentProps
  extends React.ComponentProps<typeof TabsPrimitive.Content> {
  /** Disable animations for this content */
  disableAnimation?: boolean
}

function TabsContent({
  className,
  children,
  value,
  disableAnimation = false,
  ...props
}: TabsContentProps) {
  const prefersReducedMotion = useReducedMotion()
  const shouldAnimate = !disableAnimation && !prefersReducedMotion

  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      value={value}
      asChild={shouldAnimate}
      {...props}
    >
      {shouldAnimate ? (
        <motion.div
          key={value}
          variants={tabContent}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {children}
        </motion.div>
      ) : (
        children
      )}
    </TabsPrimitive.Content>
  )
}

interface AnimatedTabsContentProps extends TabsContentProps {
  /** The currently active tab value - required for AnimatePresence */
  activeValue?: string
}

/**
 * Animated TabsContent wrapper with enter/exit transitions.
 * Use this when you want full enter/exit animations with AnimatePresence.
 *
 * @example
 * ```tsx
 * <Tabs defaultValue="tab1">
 *   <TabsList>
 *     <TabsTrigger value="tab1">Tab 1</TabsTrigger>
 *     <TabsTrigger value="tab2">Tab 2</TabsTrigger>
 *   </TabsList>
 *   <AnimatedTabsContent value="tab1" activeValue={activeTab}>
 *     Content 1
 *   </AnimatedTabsContent>
 *   <AnimatedTabsContent value="tab2" activeValue={activeTab}>
 *     Content 2
 *   </AnimatedTabsContent>
 * </Tabs>
 * ```
 */
function AnimatedTabsContent({
  className,
  children,
  value,
  activeValue,
  disableAnimation = false,
  ...props
}: AnimatedTabsContentProps) {
  const prefersReducedMotion = useReducedMotion()
  const shouldAnimate = !disableAnimation && !prefersReducedMotion
  const isActive = activeValue === value

  // Only render when active (AnimatePresence handles exit animation)
  if (!shouldAnimate) {
    return (
      <TabsPrimitive.Content
        data-slot="tabs-content"
        className={cn("flex-1 outline-none", className)}
        value={value}
        {...props}
      >
        {children}
      </TabsPrimitive.Content>
    )
  }

  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <TabsPrimitive.Content
          data-slot="tabs-content"
          className={cn("flex-1 outline-none", className)}
          value={value}
          forceMount
          asChild
          {...props}
        >
          <motion.div
            key={value}
            variants={tabContent}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {children}
          </motion.div>
        </TabsPrimitive.Content>
      )}
    </AnimatePresence>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, AnimatedTabsContent, tabsListVariants }
