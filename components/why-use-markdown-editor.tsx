"use client"

import { useTranslations } from 'next-intl'

export function WhyUseMarkdownEditor() {
  const t = useTranslations()
  return (
    <section className="py-16 px-4 bg-background border-b border-border">
      <div className="max-w-6xl mx-auto space-y-6">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">
          {t("why_use_editor_title")}
        </h2>
        <div className="space-y-6">
          <p className="text-base leading-relaxed text-muted-foreground max-w-3xl">
            {t("why_use_editor_p1")}
          </p>
          <ul className="text-base leading-relaxed text-muted-foreground max-w-3xl space-y-2 list-disc list-inside">
            <li>{t("why_use_editor_li1")}</li>
            <li>{t("why_use_editor_li2")}</li>
            <li>{t("why_use_editor_li3")}</li>
            <li>{t("why_use_editor_li4")}</li>
          </ul>
        </div>
      </div>
    </section>
  )
}

