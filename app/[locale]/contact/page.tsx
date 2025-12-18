import { getTranslations } from "next-intl/server"

import { ContactForm } from "@/components/contact-form"
import type { Locale } from "@/lib/types"
import { defaultLocale } from "@/i18n"

interface ContactPageProps {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata({ params }: ContactPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale })
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://markdownpreview.org'

  const buildPath = (loc: string, path: string = '') =>
    loc === defaultLocale ? path : `/${loc}${path}`

  const canonicalUrl = `${baseUrl}${buildPath(locale, '/contact')}`

  return {
    title: t("contact_meta_title"),
    description: t("contact_meta_description"),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'ja': `${baseUrl}/contact`,
        'en': `${baseUrl}/en/contact`,
        'zh': `${baseUrl}/zh/contact`,
        'fr': `${baseUrl}/fr/contact`,
        'x-default': `${baseUrl}/contact`,
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

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale })

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-12 max-w-3xl space-y-8">
        <header className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight">{t("contact_title")}</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {t("contact_description")}
          </p>
        </header>

        <ContactForm />
      </main>
    </div>
  )
}
