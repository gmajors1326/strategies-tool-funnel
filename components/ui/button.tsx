import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "text-sm font-semibold",
    "transition-all duration-200",
    "disabled:pointer-events-none disabled:opacity-50",
    "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "rounded-full",
    "shadow-[0_10px_25px_rgba(0,0,0,0.12)]",
    "hover:shadow-[0_14px_35px_rgba(0,0,0,0.16)]",
    "active:scale-[0.98]",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-[#1f3b2b] text-white hover:bg-[#7ee6a3] hover:text-[#1f3b2b]",
        destructive:
          "bg-[#1f3b2b] text-white hover:bg-[#7ee6a3] hover:text-[#1f3b2b]",
        outline:
          "border border-[#1f3b2b] bg-[#1f3b2b] text-white hover:bg-[#7ee6a3] hover:text-[#1f3b2b] shadow-none",
        secondary:
          "bg-[#1f3b2b] text-white hover:bg-[#7ee6a3] hover:text-[#1f3b2b] shadow-none",
        ghost:
          "bg-[#1f3b2b] text-white hover:bg-[#7ee6a3] hover:text-[#1f3b2b] shadow-none",
        link:
          "text-[#1f3b2b] underline-offset-4 hover:underline shadow-none",
        admin:
          "rounded-md h-9 px-4 text-sm bg-[#1f3b2b] text-white shadow-none hover:bg-[#7ee6a3] hover:text-[#1f3b2b]",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-11 w-11 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
