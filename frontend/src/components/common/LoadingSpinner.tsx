import { cn } from "@/lib/utils/cn"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  label?: string
}

const sizeClasses = {
  sm: "w-4 h-4 border-2",
  md: "w-8 h-8 border-2",
  lg: "w-12 h-12 border-3",
  xl: "w-16 h-16 border-4",
}

export const LoadingSpinner = ({
  size = "md",
  className,
  label,
}: LoadingSpinnerProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={cn(
          "animate-spin rounded-full border-primary border-t-transparent",
          sizeClasses[size],
          className
        )}
        role="status"
        aria-label={label || "Loading"}
      />
      {label && (
        <p className="text-sm text-text-secondary animate-pulse">{label}</p>
      )}
    </div>
  )
}

interface LoadingOverlayProps {
  message?: string
}

export const LoadingOverlay = ({ message }: LoadingOverlayProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-medium p-8 rounded-xl flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        {message && <p className="text-text-primary font-medium">{message}</p>}
      </div>
    </div>
  )
}

interface LoadingDotsProps {
  className?: string
}

export const LoadingDots = ({ className }: LoadingDotsProps) => {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span
        className="w-2 h-2 bg-primary rounded-full animate-pulse"
        style={{ animationDelay: "0ms" }}
      />
      <span
        className="w-2 h-2 bg-primary rounded-full animate-pulse"
        style={{ animationDelay: "150ms" }}
      />
      <span
        className="w-2 h-2 bg-primary rounded-full animate-pulse"
        style={{ animationDelay: "300ms" }}
      />
    </div>
  )
}
