"use client"

import { useTranslations } from 'next-intl'

export function KeyFeatures() {
  const t = useTranslations()
  return (
    <section className="py-16 px-4 bg-background border-b border-border">
      <div className="max-w-6xl mx-auto space-y-6">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">
          {t("key_features_title")}
        </h2>
        <div className="space-y-6">
          <ul className="text-base leading-relaxed text-muted-foreground max-w-3xl space-y-2 list-disc list-inside">
            <li>{t("key_features_li1")}</li>
            <li>{t("key_features_li2")}</li>
            <li>{t("key_features_li3")}</li>
            <li>{t("key_features_li4")}</li>
            <li>{t("key_features_li5")}</li>
            <li>{t("key_features_li6")}</li>
          </ul>
        </div>
      </div>
    </section>
  )
}

