import { AlertTriangle } from "lucide-react"

import { cn } from "@/lib/utils"

interface DisclaimerProps {
  title: string
  message: string
  note?: string
  className?: string
}

export function Disclaimer({ title, message, note, className }: DisclaimerProps) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 shadow-sm",
        "dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100",
        className,
      )}
    >
      <div className="mt-0.5">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-300" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-sm leading-relaxed text-amber-900/90 dark:text-amber-50/90">{message}</p>
        {note ? <p className="text-xs text-amber-900/80 dark:text-amber-50/80">{note}</p> : null}
      </div>
    </div>
  )
}
