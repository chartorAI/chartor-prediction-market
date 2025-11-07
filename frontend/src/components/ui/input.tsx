import * as React from "react"
import { cn } from "@/lib/utils/cn"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md bg-glass-medium backdrop-blur-md border border-border-medium px-3 py-1 text-sm text-text-primary shadow-sm transition-all",
          "placeholder:text-text-secondary",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary focus-visible:bg-[rgba(255,255,255,0.12)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
