"use client"

import * as React from "react"
import { XIcon } from "lucide-react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { motion, AnimatePresence } from "framer-motion"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { modalOverlay, modalContent, useReducedMotion } from "@/lib/animations"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      asChild
      {...props}
    >
      <motion.div
        variants={shouldReduceMotion ? undefined : modalOverlay}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={cn(
          "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
          className
        )}
      />
    </DialogPrimitive.Overlay>
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <DialogPortal data-slot="dialog-portal">
      <AnimatePresence mode="wait">
        <DialogOverlay />
        <DialogPrimitive.Content
          data-slot="dialog-content"
          asChild
          {...props}
        >
          <motion.div
            variants={shouldReduceMotion ? undefined : modalContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              // Liquid glass dialog
              "fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 p-6 outline-none sm:max-w-lg",
              "bg-white/10 backdrop-blur-2xl rounded-2xl",
              "border border-white/20",
              "shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]",
              "text-white",
              className
            )}
          >
            {children}
            {showCloseButton && (
              <DialogPrimitive.Close
                data-slot="dialog-close"
                className="absolute top-4 right-4 rounded-lg p-1 text-white/80 transition-all hover:text-white hover:bg-white/10 focus:ring-2 focus:ring-white/30 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
              >
                <XIcon />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            )}
          </motion.div>
        </DialogPrimitive.Content>
      </AnimatePresence>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-white/80 text-sm", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
