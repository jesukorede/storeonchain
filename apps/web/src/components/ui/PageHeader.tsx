import React from "react"
import { twMerge } from "tailwind-merge"

type Props = {
  title: string
  subtitle?: string
  align?: "center" | "left"
  meta?: React.ReactNode
}

export default function PageHeader({ title, subtitle, align = "center", meta }: Props) {
  const isCenter = align === "center"
  return (
    <div className={twMerge("space-y-3", isCenter ? "text-center" : "")}>
      <div
        className={twMerge(
          "inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 mb-4",
          isCenter ? "mx-auto" : ""
        )}
      />
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{title}</h1>
      {subtitle && <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">{subtitle}</p>}
      {meta}
    </div>
  )
}