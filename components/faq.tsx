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
  faqData?: FaqItem[]
}

export function Faq({ titleKey = "faq_title", faqData: customFaqData }: FaqProps = {}) {
  const t = useTranslations()
  const [openIndex, setOpenIndex] = useState<number | null>(null)

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

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 text-foreground">{t(titleKey)}</h2>
        <div className="space-y-4">
          {faqData.map((item, index) => (
            <div key={index} className="border border-border rounded-lg bg-card overflow-hidden">
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
              >
                <span className="font-medium text-foreground">{item.question}</span>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground transition-transform ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 py-4 border-t border-border bg-muted/20">
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
