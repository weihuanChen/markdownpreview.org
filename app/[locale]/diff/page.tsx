"use client"

import { MarkdownDiff } from "@/components/markdown-diff"
import { Faq } from "@/components/faq"
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
      <Faq titleKey="diff_faq_title" faqData={diffFaqData} />
    </main>
  )
}
