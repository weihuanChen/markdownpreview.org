import { Mail } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { Disclaimer } from "@/components/disclaimer"
import { getSupportContent, SUPPORT_PRIMARY_LOCALE } from "@/lib/support-content"
import type { Locale } from "@/lib/types"

interface SupportPageProps {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata({ params }: SupportPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale })

  return {
    title: t("support_meta_title"),
    description: t("support_meta_description"),
    robots: {
      index: false,
      follow: true,
      googleBot: {
        index: false,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  }
}

export default async function SupportPage({ params }: SupportPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale })
  const content = getSupportContent(locale)
  const primaryLanguageLabel =
    SUPPORT_PRIMARY_LOCALE === "en" ? t("lang_en") : SUPPORT_PRIMARY_LOCALE.toUpperCase()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-12 max-w-5xl space-y-10">
        <header className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight">{t("support_title")}</h1>
          <p className="text-lg text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: content.intro }} />
          <p className="text-muted-foreground">
            {t("support_intro")}
          </p>
          <Disclaimer
            title={t("support_disclaimer_title")}
            message={t("support_disclaimer_body", { language: primaryLanguageLabel })}
            note={t("support_disclaimer_note")}
          />
        </header>

        <section className="grid gap-6">
          {content.sections.map((section) => (
            <article key={section.title} className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-2">{section.title}</h2>
              <div className="space-y-3 text-muted-foreground">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: paragraph }} />
                ))}
                {section.bullets ? (
                  <ul className="list-disc space-y-2 pl-5 text-sm">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} dangerouslySetInnerHTML={{ __html: bullet }} />
                    ))}
                  </ul>
                ) : null}
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-xl border border-border bg-muted/40 p-6 shadow-sm">
          <p className="text-muted-foreground mb-4" dangerouslySetInnerHTML={{ __html: content.contact.note || '' }} />
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-primary" aria-hidden="true" />
            <a
              href={`mailto:${content.contact.email}`}
              className="text-foreground hover:text-primary transition-colors"
            >
              {content.contact.email}
            </a>
          </div>
        </section>
      </main>
    </div>
  )
}
