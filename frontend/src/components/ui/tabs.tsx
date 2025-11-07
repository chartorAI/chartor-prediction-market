import * as React from "react"
import { cn } from "@/lib/utils/cn"

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined)

const useTabs = () => {
  const context = React.useContext(TabsContext)
  if (!context) {
    throw new Error("Tabs components must be used within Tabs")
  }
  return context
}

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  (
    { defaultValue, value: controlledValue, onValueChange, children, ...props },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue || "")

    const isControlled = controlledValue !== undefined
    const value = isControlled ? controlledValue : internalValue

    const handleValueChange = React.useCallback(
      (newValue: string) => {
        if (isControlled) {
          onValueChange?.(newValue)
        } else {
          setInternalValue(newValue)
          onValueChange?.(newValue)
        }
      },
      [isControlled, onValueChange]
    )

    return (
      <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
        <div ref={ref} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    )
  }
)
Tabs.displayName = "Tabs"

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex h-9 items-center justify-center rounded-lg bg-glass-light backdrop-blur-md border border-border-subtle p-1 text-text-secondary",
      className
    )}
    {...props}
  />
))
TabsList.displayName = "TabsList"

interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value: triggerValue, ...props }, ref) => {
    const { value, onValueChange } = useTabs()
    const isActive = value === triggerValue

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
          "disabled:pointer-events-none disabled:opacity-50",
          isActive
            ? "bg-glass-medium backdrop-blur-md text-text-primary shadow-sm border border-border-medium"
            : "hover:bg-glass-light hover:text-text-primary",
          className
        )}
        onClick={() => onValueChange(triggerValue)}
        {...props}
      />
    )
  }
)
TabsTrigger.displayName = "TabsTrigger"

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value: contentValue, ...props }, ref) => {
    const { value } = useTabs()

    if (value !== contentValue) return null

    return (
      <div
        ref={ref}
        className={cn(
          "mt-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary animate-fade-in",
          className
        )}
        {...props}
      />
    )
  }
)
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
