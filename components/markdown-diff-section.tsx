"use client"

import { useTranslations } from 'next-intl'
import { Link } from '@/navigation'

export function MarkdownDiffSection() {
  const t = useTranslations()
  return (
    <>
      <section className="py-16 px-4 bg-background border-b border-border">
        <div className="max-w-6xl mx-auto space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            {t('markdown_diff_section_title')}
          </h2>
          <div className="space-y-6">
            <p className="text-base leading-relaxed text-muted-foreground max-w-3xl">
              {t('markdown_diff_section_p1_prefix')}{' '}
              <Link
                href="/diff"
                className="text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
              >
                {t('markdown_diff_section_p1_link')}
              </Link>
              {' '}{t('markdown_diff_section_p1_suffix')}
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-background border-b border-border">
        <div className="max-w-6xl mx-auto space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            {t('markdown_diff_section_formatter_title')}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground max-w-3xl">
            {t('markdown_diff_section_formatter_prefix')}{' '}
            <Link
              href="/formatter"
              className="text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
            >
              {t('markdown_diff_section_formatter_link')}
            </Link>
            {' '}{t('markdown_diff_section_formatter_suffix')}
          </p>
        </div>
      </section>
    </>
  )
}

