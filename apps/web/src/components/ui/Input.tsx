import React, { forwardRef } from "react"
import { twMerge } from "tailwind-merge"

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  hint?: string
  error?: string
  containerClassName?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className, containerClassName, ...props }, ref) => {
    const inputClasses = twMerge(
      "w-full px-4 py-2 rounded-md bg-slate-900/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition",
      className
    )
    return (
      <div className={twMerge("space-y-2", containerClassName)}>
        {label && <label className="text-sm font-medium text-slate-300">{label}</label>}
        <input ref={ref} className={inputClasses} {...props} />
        {hint && <p className="text-xs text-slate-500">{hint}</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  }
)

export default Input