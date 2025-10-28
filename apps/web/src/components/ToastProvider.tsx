"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { X } from "lucide-react"

type Toast = {
  id: string
  title?: string
  message: string
  variant?: "info" | "success" | "error"
  duration?: number // ms
  action?: { label: string; href: string }
}

type ToastContextType = {
  toast: (t: Omit<Toast, "id">) => void
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export default function ToastProvider({ children }: { children?: React.ReactNode }) {
  const [list, setList] = useState<Toast[]>([])

  const remove = useCallback((id: string) => {
    setList((l) => l.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2)
    const item: Toast = { id, duration: 9000, variant: "info", ...t }
    setList((l) => [...l, item])
    const timer = setTimeout(() => remove(id), item.duration)
    // ensure GC
    return () => clearTimeout(timer)
  }, [remove])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container */}
      <div className="fixed z-[1000] bottom-4 right-4 sm:right-4 left-4 sm:left-auto flex flex-col gap-3 max-w-sm">
        {list.map((t) => {
          const base = "rounded-xl border p-4 shadow-xl backdrop-blur";
          const variant = t.variant === "success"
            ? "bg-green-500/10 border-green-500/30 text-green-200"
            : t.variant === "error"
            ? "bg-red-500/10 border-red-500/30 text-red-200"
            : "bg-slate-800/70 border-slate-700/50 text-slate-200";
          return (
            <div key={t.id} className={`${base} ${variant}`}>
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  {t.title && <div className="text-sm font-semibold">{t.title}</div>}
                  <div className="text-sm">{t.message}</div>
                </div>
                {t.action && (
                  <a href={t.action.href} target="_blank" rel="noreferrer" className="ml-2 text-xs underline decoration-white/40 hover:decoration-white">
                    {t.action.label}
                  </a>
                )}
                <button onClick={() => remove(t.id)} className="p-1 rounded hover:bg-white/10">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
