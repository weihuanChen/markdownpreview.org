"use client"

import { useTranslations } from 'next-intl'

export function CommonUseCases() {
  const t = useTranslations()
  const useCases = [
    t("common_use_cases_li1"),
    t("common_use_cases_li2"),
    t("common_use_cases_li3"),
    t("common_use_cases_li4"),
    t("common_use_cases_li5"),
  ]
  return (
    <section className="relative py-16 px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-card/70 via-transparent to-secondary/50" />
      <div className="relative max-w-6xl mx-auto space-y-8">
        <div className="space-y-4">
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
            {t("common_use_cases_title")}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground max-w-3xl">
            {t("common_use_cases_p1")}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {useCases.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-[0_18px_60px_-42px_rgba(15,23,42,0.5)] backdrop-blur"
            >
              <p className="text-sm text-foreground leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
