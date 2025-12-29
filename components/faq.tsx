"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { useTranslations } from 'next-intl'

interface FaqItem {
  question: string
  answer: string
}

interface FaqProps {
  titleKey?: string
  title?: string
  faqData?: FaqItem[]
}

export function Faq({ titleKey, title, faqData: customFaqData }: FaqProps = {}) {
  const t = useTranslations()
  const displayTitle = title || (titleKey ? t(titleKey) : t("faq_title"))
  const defaultFaqData: FaqItem[] = [
    {
      question: t("faq_q1"),
      answer: t("faq_a1"),
    },
    {
      question: t("faq_q2"),
      answer: t("faq_a2"),
    },
    {
      question: t("faq_q3"),
      answer: t("faq_a3"),
    },
    {
      question: t("faq_q4"),
      answer: t("faq_a4"),
    },
  ]

  const faqData = customFaqData || defaultFaqData
  
  // 默认展开所有条目
  const [openIndices, setOpenIndices] = useState<Set<number>>(
    new Set(faqData.map((_, index) => index))
  )

  const toggleItem = (index: number) => {
    setOpenIndices((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  return (
    <section className="relative py-16 px-4">
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/40 via-transparent to-card/60" />
      <div className="relative max-w-4xl mx-auto rounded-3xl border border-border/70 bg-card/80 shadow-[0_18px_60px_-42px_rgba(15,23,42,0.55)] backdrop-blur px-6 md:px-10 py-10">
        <h2 className="text-3xl font-semibold text-center mb-10 text-foreground">
          {displayTitle}
        </h2>
        <div className="space-y-4">
          {faqData.map((item, index) => (
            <div key={index} className="border border-border/70 rounded-2xl bg-card/80 overflow-hidden">
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[var(--brand-blue)]/8 transition-colors"
              >
                <span className="font-medium text-foreground">{item.question}</span>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground transition-transform ${
                    openIndices.has(index) ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndices.has(index) && (
                <div className="px-6 py-4 border-t border-border/60 bg-secondary/40">
                  <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
