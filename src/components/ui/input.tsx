import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-gray-900 dark:file:text-white placeholder:text-gray-500 dark:placeholder:text-white/80 selection:bg-crowe-amber/30 selection:text-gray-900 dark:selection:text-white bg-white dark:bg-white/10 border-gray-200 dark:border-white/20 text-gray-900 dark:text-white h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-gray-400 dark:focus-visible:border-white/40 focus-visible:ring-gray-300 dark:focus-visible:ring-white/20 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
