import { Mail, Globe2 } from "lucide-react"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { Disclaimer } from "@/components/disclaimer"
import { getUserServiceContent, USER_SERVICE_PRIMARY_LOCALE } from "@/lib/user-service-content"
import type { Locale } from "@/lib/types"
import { defaultLocale, locales } from "@/i18n"

interface UserServicePageProps {
  params: Promise<{ locale: Locale }>
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: UserServicePageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale })
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://markdownpreview.org'

  const buildPath = (loc: string, path: string = '') =>
    loc === defaultLocale ? path : `/${loc}${path}`

  const canonicalUrl = `${baseUrl}${buildPath(locale, '/user-service')}`

  return {
    title: t("user_service_meta_title"),
    description: t("user_service_meta_description"),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'ja': `${baseUrl}/user-service`,
        'en': `${baseUrl}/en/user-service`,
        'zh': `${baseUrl}/zh/user-service`,
        'fr': `${baseUrl}/fr/user-service`,
        'x-default': `${baseUrl}/user-service`,
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  }
}

export default async function UserServicePage({ params }: UserServicePageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale })
  const content = getUserServiceContent(locale)
  const primaryLanguageLabel =
    USER_SERVICE_PRIMARY_LOCALE === "en" ? t("lang_en") : USER_SERVICE_PRIMARY_LOCALE.toUpperCase()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-12 max-w-5xl space-y-10">
        <header className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("user_service_effective_date", { date: content.effectiveDate })}
          </p>
          <h1 className="text-4xl font-bold leading-tight">{t("user_service_title")}</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">{content.intro}</p>
          <p className="text-muted-foreground">{content.summary}</p>
          <Disclaimer
            title={t("user_service_disclaimer_title")}
            message={t("user_service_disclaimer_body", { language: primaryLanguageLabel })}
            note={t("user_service_disclaimer_note")}
          />
        </header>

        <section className="grid gap-6">
          {content.sections.map((section) => (
            <article key={section.title} className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-2">{section.title}</h2>
              <div className="space-y-3 text-muted-foreground">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="leading-relaxed">
                    {paragraph}
                  </p>
                ))}
                {section.bullets ? (
                  <ul className="list-disc space-y-2 pl-5 text-sm">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-xl border border-border bg-muted/40 p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">{t("user_service_contact_title")}</h3>
          <p className="text-muted-foreground mb-4">{content.contact.note}</p>
          <div className="grid gap-3">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-primary" aria-hidden="true" />
              <a
                href={`mailto:${content.contact.email}`}
                className="text-foreground hover:text-primary transition-colors"
              >
                {content.contact.email}
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Globe2 className="h-5 w-5 text-primary" aria-hidden="true" />
              <a
                href={`https://${content.contact.site}`}
                className="text-foreground hover:text-primary transition-colors"
                target="_blank"
                rel="noreferrer"
              >
                {content.contact.site}
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
