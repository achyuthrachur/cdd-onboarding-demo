import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        // Primary action button - Crowe Indigo with white text
        default:
          "bg-crowe-indigo dark:bg-crowe-indigo " +
          "text-white " +
          "hover:bg-crowe-indigo-dark dark:hover:bg-crowe-indigo-bright " +
          "border border-crowe-indigo dark:border-crowe-indigo-bright " +
          "focus-visible:ring-crowe-indigo/30",
        // Destructive action - clear red styling
        destructive:
          "bg-red-600 dark:bg-red-600 " +
          "text-white " +
          "hover:bg-red-700 dark:hover:bg-red-500 " +
          "border border-red-700 " +
          "focus-visible:ring-red-500/20 dark:focus-visible:ring-red-500/40",
        // Outline - visible border with solid background in light mode
        outline:
          "bg-white text-gray-900 " +
          "border-2 border-gray-300 " +
          "hover:bg-gray-50 hover:border-gray-400 " +
          "dark:bg-transparent dark:text-white dark:border-gray-500 " +
          "dark:hover:bg-white/10 dark:hover:border-gray-400 " +
          "focus-visible:ring-gray-400/30 dark:focus-visible:ring-white/30",
        // Secondary - Crowe Amber accent
        secondary:
          "bg-crowe-amber dark:bg-crowe-amber " +
          "text-crowe-indigo-dark " +
          "hover:bg-crowe-amber-dark dark:hover:bg-crowe-amber-bright " +
          "border border-crowe-amber-dark " +
          "focus-visible:ring-crowe-amber/30",
        // Ghost - subtle background, not invisible
        ghost:
          "bg-gray-100 text-gray-700 " +
          "hover:bg-gray-200 hover:text-gray-900 " +
          "dark:bg-white/10 dark:text-gray-200 " +
          "dark:hover:bg-white/20 dark:hover:text-white " +
          "focus-visible:ring-gray-400/30 dark:focus-visible:ring-white/30",
        // Link style
        link:
          "text-crowe-indigo dark:text-crowe-amber " +
          "underline-offset-4 hover:underline",
        // Demo data button - prominent gradient styling
        demoData:
          "bg-gradient-to-r from-amber-500 to-orange-500 " +
          "dark:from-amber-400 dark:to-orange-400 " +
          "text-white dark:text-crowe-indigo-dark " +
          "font-semibold " +
          "border border-amber-600 dark:border-amber-300 " +
          "shadow-md hover:shadow-lg " +
          "hover:from-amber-600 hover:to-orange-600 " +
          "dark:hover:from-amber-300 dark:hover:to-orange-300 " +
          "focus-visible:ring-amber-500/30",
        // Soft/subtle button for secondary actions
        soft:
          "bg-gray-100 dark:bg-white/10 " +
          "text-gray-900 dark:text-white " +
          "hover:bg-gray-200 dark:hover:bg-white/20 " +
          "focus-visible:ring-gray-400/30 dark:focus-visible:ring-white/30",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
        // Touch-friendly sizes (44x44px minimum touch target)
        "icon-touch": "size-11 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
