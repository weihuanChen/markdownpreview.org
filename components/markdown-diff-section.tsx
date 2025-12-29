"use client"

import { useTranslations } from 'next-intl'
import { Link } from '@/navigation'

export function MarkdownDiffSection() {
  const t = useTranslations()
  const cards = [
    {
      title: t('markdown_diff_section_title'),
      prefix: t('markdown_diff_section_p1_prefix'),
      linkText: t('markdown_diff_section_p1_link'),
      suffix: t('markdown_diff_section_p1_suffix'),
      href: "/diff",
    },
    {
      title: t('markdown_diff_section_formatter_title'),
      prefix: t('markdown_diff_section_formatter_prefix'),
      linkText: t('markdown_diff_section_formatter_link'),
      suffix: t('markdown_diff_section_formatter_suffix'),
      href: "/formatter",
    },
  ]
  return (
    <section className="relative py-16 px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_40%,rgba(15,118,110,0.1),transparent_32%),radial-gradient(circle_at_90%_52%,rgba(255,122,83,0.1),transparent_30%)]" />
      <div className="relative max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
            {t('markdown_diff_section_title')}
          </h2>
          <span className="hidden md:inline-flex items-center gap-2 rounded-full bg-[var(--brand-blue)]/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue)]">
            {t("quickstart_label")}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {cards.map((card) => (
            <div
              key={card.href}
              className="relative rounded-2xl border border-border/70 bg-card/80 p-6 shadow-[0_18px_60px_-42px_rgba(15,23,42,0.5)] backdrop-blur"
            >
              <div className="absolute inset-0 rounded-2xl border border-white/5 opacity-0 hover:opacity-100 transition-opacity duration-200 bg-gradient-to-br from-[var(--brand-blue)]/8 via-transparent to-[#ff7a53]/10" />
              <div className="relative space-y-3">
                <h3 className="text-xl font-semibold text-foreground">{card.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {card.prefix}{" "}
                  <Link
                    href={card.href}
                    className="inline-flex items-center gap-1 text-[var(--brand-blue)] hover:text-[var(--brand-blue)]/80 underline underline-offset-4 decoration-[var(--brand-blue)]/60 transition-colors"
                  >
                    {card.linkText}
                  </Link>
                  {" "}
                  {card.suffix}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
