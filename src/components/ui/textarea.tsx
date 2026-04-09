import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-tint-200 dark:border-white/20 bg-white dark:bg-white/10 text-tint-900 dark:text-white placeholder:text-tint-500 dark:placeholder:text-white/80 focus-visible:border-tint-500 dark:focus-visible:border-white/40 focus-visible:ring-tint-300 dark:focus-visible:ring-white/20 aria-invalid:ring-destructive/20 aria-invalid:border-destructive selection:bg-crowe-amber/30 selection:text-tint-900 dark:selection:text-white flex field-sizing-content min-h-16 w-full rounded-md border px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
