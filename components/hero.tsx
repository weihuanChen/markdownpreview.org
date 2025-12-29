"use client"

import { ArrowRight, Sparkles } from "lucide-react"
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { Link } from '@/navigation'

export function Hero() {
  const t = useTranslations()
  const description = t("hero_description")
  return (
    <section className="relative overflow-hidden px-4 pt-14 pb-6 md:pb-12">
      <div className="absolute inset-0 opacity-80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(15,118,110,0.18),transparent_34%),radial-gradient(circle_at_82%_14%,rgba(255,122,83,0.18),transparent_32%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,18,31,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(12,18,31,0.08)_1px,transparent_1px)] bg-[length:140px_140px] mix-blend-multiply" />
      </div>
      <div className="relative z-10 max-w-6xl mx-auto grid lg:grid-cols-[1.1fr,0.9fr] items-start gap-10">
        <div className="space-y-7">
          <div className="inline-flex items-center gap-3 rounded-full border border-border/80 bg-card/70 px-3 py-2 shadow-sm backdrop-blur">
            <span className="size-2 rounded-full bg-[var(--brand-blue)] shadow-[0_0_0_6px_rgba(15,118,110,0.15)]" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t("quickstart_label")}
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight text-foreground">
              <span className="bg-gradient-to-r from-[var(--brand-blue)] via-foreground to-[#ff7a53] bg-clip-text text-transparent">
                {t("hero_title")}
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl whitespace-pre-line">
              {description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button asChild className="h-11 px-5 text-base font-semibold bg-[var(--brand-blue)] text-[#052220] hover:bg-[var(--brand-blue)]/90 shadow-[0_15px_45px_-20px_rgba(15,118,110,0.65)]">
              <Link href="#editor-stage">
                <Sparkles className="h-4 w-4 mr-2" />
                {t("editor_quickstart")}
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 px-5 text-base font-semibold border-border/80 bg-card/60 backdrop-blur hover:border-foreground/30"
            >
              <Link href="#quickstart-section">
                {t("quickstart_title")}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border/80 bg-card/70 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1">{t("preview_title")}</p>
              <p className="text-sm text-foreground leading-relaxed">{t("quickstart_description")}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-secondary/70 via-card/80 to-card/60 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1">{t("quickstart_source_prefix")}</p>
              <p className="text-sm text-foreground leading-relaxed flex items-center gap-2">
                {t("quickstart_source_name")}
                <span className="inline-flex items-center rounded-full bg-[rgba(15,118,110,0.12)] px-2 py-0.5 text-[11px] font-medium text-[var(--brand-blue)]">
                  {t("quickstart_label")}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 blur-2xl bg-gradient-to-br from-[var(--brand-blue)]/15 via-transparent to-[#ff7a53]/20" />
          <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/80 shadow-[0_15px_60px_-35px_rgba(15,23,42,0.65)] backdrop-blur">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-[var(--brand-blue)]" />
                <span className="text-sm font-semibold text-foreground">{t("preview_title")}</span>
              </div>
              <span className="rounded-full bg-[rgba(255,122,83,0.12)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#b94824]">
                {t("quickstart_label")}
              </span>
            </div>
            <div className="px-5 pb-6 pt-4 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("quickstart_hint")}
              </p>
              <div className="rounded-2xl border border-border/80 bg-muted/60 p-4">
                <pre className="text-[13px] leading-relaxed text-foreground font-mono whitespace-pre-wrap">{t("quickstart_code_snippet")}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
