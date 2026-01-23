import * as React from "react"
import { cn } from "@/lib/utils"

interface AppPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "subtle"
}

const AppPanel = React.forwardRef<HTMLDivElement, AppPanelProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border border-[hsl(var(--border))] p-3 sm:p-4",
        variant === "default"
          ? "bg-[hsl(var(--surface-3))] text-[hsl(var(--text))]"
          : "bg-[hsl(var(--surface-2))]/50 text-[hsl(var(--text))]",
        className
      )}
      {...props}
    />
  )
)
AppPanel.displayName = "AppPanel"

export { AppPanel }
