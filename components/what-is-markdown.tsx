"use client"

import { useTranslations } from 'next-intl'

export function WhatIsMarkdown() {
  const t = useTranslations()
  return (
    <section className="py-16 px-4 bg-background border-b border-border">
      <div className="max-w-6xl mx-auto space-y-6">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">
          {t("what_is_markdown_title")}
        </h2>
        <div className="space-y-6">
          <p className="text-base leading-relaxed text-muted-foreground max-w-3xl">
            {t("what_is_markdown_p1")}
          </p>
          <hr className="border-border" />
          <p className="text-base leading-relaxed text-muted-foreground max-w-3xl">
            {t("what_is_markdown_p2")}
          </p>
        </div>
      </div>
    </section>
  )
}

