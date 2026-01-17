import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://markdownpreview.org"
  const currentUrl = `${baseUrl}/${locale}/academic-check/clarity`

  const titles: Record<string, string> = {
    en: "Clarity & Readability Check – Improve Academic Document Quality",
    ja: "Clarity & Readability Check – Improve Academic Document Quality",
    zh: "Clarity & Readability Check – Improve Academic Document Quality",
    fr: "Clarity & Readability Check – Improve Academic Document Quality",
    es: "Clarity & Readability Check – Improve Academic Document Quality",
  }

  const descriptions: Record<string, string> = {
    en: "Improve the clarity and readability of your academic documents. Checks sentence length, heading misuse, table readability, paragraph flow, and provides suggestions for better document quality.",
    ja: "Improve the clarity and readability of your academic documents. Checks sentence length, heading misuse, table readability, paragraph flow, and provides suggestions for better document quality.",
    zh: "Improve the clarity and readability of your academic documents. Checks sentence length, heading misuse, table readability, paragraph flow, and provides suggestions for better document quality.",
    fr: "Improve the clarity and readability of your academic documents. Checks sentence length, heading misuse, table readability, paragraph flow, and provides suggestions for better document quality.",
    es: "Improve the clarity and readability of your academic documents. Checks sentence length, heading misuse, table readability, paragraph flow, and provides suggestions for better document quality.",
  }

  const title = titles[locale] || titles.en
  const description = descriptions[locale] || descriptions.en

  const localeMap: Record<string, string> = {
    en: "en_US",
    ja: "ja_JP",
    zh: "zh_CN",
    fr: "fr_FR",
    es: "es_ES",
  }

  return {
    title,
    description,
    keywords: ['readability checker', 'clarity checker', 'academic writing', 'document quality', 'writing improvement'],
    alternates: {
      canonical: currentUrl,
    },
    openGraph: {
      title,
      description,
      url: currentUrl,
      siteName: "MarkdownPreview.org",
      locale: localeMap[locale] || "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}
