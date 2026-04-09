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
        destructive:
          "bg-crowe-coral dark:bg-crowe-coral " +
          "text-white " +
          "hover:bg-crowe-coral-dark dark:hover:bg-crowe-coral-bright " +
          "border border-crowe-coral-dark " +
          "focus-visible:ring-crowe-coral/20 dark:focus-visible:ring-crowe-coral/40",
        outline:
          "bg-white text-tint-900 " +
          "border-2 border-crowe-indigo-dark " +
          "hover:bg-tint-50 hover:border-crowe-indigo " +
          "dark:bg-transparent dark:text-white dark:border-white " +
          "dark:hover:bg-white/10 dark:hover:border-tint-300 " +
          "focus-visible:ring-crowe-indigo/30 dark:focus-visible:ring-white/30 " +
          "!text-crowe-indigo-dark dark:!text-white",
        // Secondary - Crowe Amber accent
        secondary:
          "bg-crowe-amber dark:bg-crowe-amber " +
          "text-crowe-indigo-dark " +
          "hover:bg-crowe-amber-dark dark:hover:bg-crowe-amber-bright " +
          "border border-crowe-amber-dark " +
          "focus-visible:ring-crowe-amber/30",
        ghost:
          "bg-tint-100 text-tint-700 border border-tint-300 " +
          "hover:bg-tint-200 hover:text-tint-900 hover:border-tint-500 " +
          "dark:bg-white/10 dark:text-tint-300 dark:border-white/20 " +
          "dark:hover:bg-white/20 dark:hover:text-white dark:hover:border-white/30 " +
          "focus-visible:ring-crowe-indigo/30 dark:focus-visible:ring-white/30 " +
          "!text-tint-950 dark:!text-white",
        // Link style
        link:
          "text-crowe-indigo dark:text-crowe-amber " +
          "underline-offset-4 hover:underline",
        demoData:
          "bg-gradient-to-r from-crowe-amber to-crowe-amber-dark " +
          "dark:from-crowe-amber dark:to-crowe-amber-bright " +
          "text-white dark:text-crowe-indigo-dark " +
          "font-semibold " +
          "border border-crowe-amber-dark dark:border-crowe-amber " +
          "shadow-crowe-md hover:shadow-crowe-hover " +
          "hover:from-crowe-amber-dark hover:to-crowe-amber " +
          "dark:hover:from-crowe-amber-bright dark:hover:to-crowe-amber " +
          "focus-visible:ring-crowe-amber/30",
        soft:
          "bg-tint-100 dark:bg-white/10 border border-tint-200 dark:border-white/10 " +
          "text-tint-900 dark:text-white " +
          "hover:bg-tint-200 dark:hover:bg-white/20 hover:border-tint-300 dark:hover:border-white/20 " +
          "focus-visible:ring-crowe-indigo/30 dark:focus-visible:ring-white/30 " +
          "!text-tint-950 dark:!text-white",
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
