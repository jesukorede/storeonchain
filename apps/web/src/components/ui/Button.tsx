import React from "react"
import { cva } from "class-variance-authority"
import { twMerge } from "tailwind-merge"
import { Loader2 } from "lucide-react"

const styles = cva(
  "inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        primary: "btn-primary-gradient text-white",
        secondary: "bg-white/10 text-white hover:bg-white/20",
        ghost: "bg-transparent text-slate-200 hover:bg-white/10",
        link: "text-slate-300 underline underline-offset-4 hover:text-white bg-transparent",
      },
      size: {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
)

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "link"
  size?: "sm" | "md" | "lg"
  loading?: boolean
  href?: string
  className?: string
}

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  href,
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = twMerge(styles({ variant, size }), loading ? "opacity-75 cursor-not-allowed" : "", className)

  if (href) {
    return (
      <a href={href} className={classes} {...(props as any)}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </a>
    )
  }

  return (
    <button className={classes} disabled={loading || props.disabled} {...props}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}