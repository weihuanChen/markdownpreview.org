"use client"

import { useTranslations } from "next-intl"
import { Pin } from "lucide-react"

import { Button } from "@/components/ui/button"

interface EditorPinnedBannerProps {
  onUnpin: () => void
}

export function EditorPinnedBanner({ onUnpin }: EditorPinnedBannerProps) {
  const t = useTranslations()

  return (
    <div className="w-full animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-[var(--brand-blue)]/50 bg-gradient-to-r from-[var(--brand-blue)]/15 via-[var(--brand-blue)]/10 to-[var(--brand-blue)]/15 backdrop-blur-sm shadow-lg">
        <div className="flex-shrink-0">
          <Pin className="h-5 w-5 text-[var(--brand-blue)] animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--brand-blue)]">
            {t("editor_pinned_title")}
          </p>
          <p className="text-xs text-[var(--brand-blue)]/80 mt-0.5">
            {t("editor_pinned_description")}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onUnpin}
          className="ml-auto flex-shrink-0 h-auto px-3 py-1.5 text-[var(--brand-blue)] hover:bg-[var(--brand-blue)]/20 hover:text-[var(--brand-blue)] font-medium transition-colors"
        >
          {t("editor_pinned_unpin")}
        </Button>
      </div>
    </div>
  )
}

