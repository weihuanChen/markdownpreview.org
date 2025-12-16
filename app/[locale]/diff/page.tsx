"use client"

import { MarkdownDiff } from "@/components/markdown-diff"
import { Faq } from "@/components/faq"
import { RelatedTools } from "@/components/related-tools"
import { useTranslations } from "next-intl"

export default function MarkdownDiffPage() {
  const t = useTranslations()

  const diffFaqData = [
    {
      question: t("diff_faq_q1"),
      answer: t("diff_faq_a1"),
    },
    {
      question: t("diff_faq_q2"),
      answer: t("diff_faq_a2"),
    },
    {
      question: t("diff_faq_q3"),
      answer: t("diff_faq_a3"),
    },
    {
      question: t("diff_faq_q4"),
      answer: t("diff_faq_a4"),
    },
  ]

  return (
    <main className="min-h-screen bg-background">
      <MarkdownDiff />
      <section className="px-4 py-8 md:py-10 border-t border-border bg-background">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 text-sm md:text-base">
          <h2 className="text-lg md:text-xl font-semibold text-foreground">
            {t("diff_page_how_it_works_title")}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {t("diff_page_how_it_works_p1")}
          </p>
          <p className="text-muted-foreground leading-relaxed">
            {t("diff_page_how_it_works_p2")}
          </p>

          <div className="space-y-3 md:space-y-4">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              {t("diff_page_language_support_title")}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("diff_page_language_support_p1")}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {t("diff_page_language_support_p2")}
            </p>
          </div>

          <div className="space-y-3 md:space-y-4">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              {t("diff_page_privacy_title")}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("diff_page_privacy_p1")}
            </p>
          </div>

          <div className="space-y-3 md:space-y-4">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              {t("diff_page_use_cases_title")}
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground leading-relaxed">
              <li>{t("diff_page_use_cases_li1")}</li>
              <li>{t("diff_page_use_cases_li2")}</li>
              <li>{t("diff_page_use_cases_li3")}</li>
              <li>{t("diff_page_use_cases_li4")}</li>
            </ul>
            <div className="pt-4">
              <div className="h-px w-full bg-border" />
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <div className="inline-block max-w-xl rounded-xl border border-[var(--brand-blue)]/70 bg-[rgba(0,117,222,0.04)] px-4 py-3 shadow-sm text-center">
              <p className="text-sm md:text-base leading-relaxed text-[var(--brand-blue)]">
                <span className="font-semibold">{t("diff_page_highlight_text")}</span>
              </p>
            </div>
          </div>
        </div>
      </section>
      <Faq titleKey="diff_faq_title" faqData={diffFaqData} />
      <RelatedTools />
    </main>
  )
}
