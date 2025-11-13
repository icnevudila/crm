import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6366f1] disabled:pointer-events-none disabled:shadow-none disabled:bg-slate-200 disabled:text-slate-500 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "overflow-hidden bg-gradient-to-r from-[#6366f1] via-[#7c3aed] to-[#8b5cf6] text-white shadow-lg hover:from-[#4f46e5] hover:via-[#6d28d9] hover:to-[#7c3aed] hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 before:absolute before:inset-0 before:bg-white/10 before:opacity-0 hover:before:opacity-20 before:transition-opacity disabled:from-slate-300 disabled:via-slate-300 disabled:to-slate-300",
        destructive:
          "bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0",
        outline:
          "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
        secondary:
          "bg-[#8b5cf6] text-white shadow-md hover:bg-[#7c3aed] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0",
        ghost:
          "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        link: "text-[#4f46e5] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2.5",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-8",
        icon: "h-10 w-10",
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
    // Hydration hatasını önlemek için id prop'unu suppress et
    const { id, ...restProps } = props
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        suppressHydrationWarning
        {...restProps}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
