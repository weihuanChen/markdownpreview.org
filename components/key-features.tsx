"use client"

import { useTranslations } from 'next-intl'

export function KeyFeatures() {
  const t = useTranslations()
  const features = [
    t("key_features_li1"),
    t("key_features_li2"),
    t("key_features_li3"),
    t("key_features_li4"),
    t("key_features_li5"),
    t("key_features_li6"),
  ]
  return (
    <section className="relative py-16 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_60%,rgba(15,118,110,0.08),transparent_35%),radial-gradient(circle_at_86%_60%,rgba(255,122,83,0.08),transparent_30%)]" />
      <div className="relative max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
            {t("key_features_title")}
          </h2>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-[var(--brand-blue)]" />
            {t("quickstart_hint")}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {features.map((feature, index) => (
            <div
              key={feature}
              className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/80 p-5 shadow-[0_18px_60px_-42px_rgba(15,23,42,0.5)]"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-r from-[var(--brand-blue)]/8 via-transparent to-[#ff7a53]/10" />
              <div className="relative flex items-start gap-3">
                <span className="mt-0.5 inline-flex size-10 items-center justify-center rounded-full bg-[var(--brand-blue)]/12 text-sm font-semibold text-[var(--brand-blue)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-sm text-foreground leading-relaxed">{feature}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
