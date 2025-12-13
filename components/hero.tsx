"use client"

import { useTranslations } from 'next-intl'

export function Hero() {
  const t = useTranslations()
  const description = t("hero_description")
  return (
    <section className="py-12 px-4 bg-background border-b border-border">
      <div className="max-w-4xl mx-auto text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground">
          {t("hero_title")}
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto whitespace-pre-line">
          {description}
        </p>
      </div>
    </section>
  )
}

