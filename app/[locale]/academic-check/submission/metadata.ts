import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://markdownpreview.org"
  const currentUrl = `${baseUrl}/${locale}/academic-check/submission`

  const titles: Record<string, string> = {
    en: "Submission Readiness Check – Academic Paper Formatting Checker",
    ja: "Submission Readiness Check – Academic Paper Formatting Checker",
    zh: "Submission Readiness Check – Academic Paper Formatting Checker",
    fr: "Submission Readiness Check – Academic Paper Formatting Checker",
    es: "Submission Readiness Check – Academic Paper Formatting Checker",
  }

  const descriptions: Record<string, string> = {
    en: "Check your academic paper for formatting compliance before submission. Detects heading numbering, figure/table caption formats, citation styles, and other formatting issues according to journal requirements (IEEE, ACM, APA).",
    ja: "Check your academic paper for formatting compliance before submission. Detects heading numbering, figure/table caption formats, citation styles, and other formatting issues according to journal requirements (IEEE, ACM, APA).",
    zh: "Check your academic paper for formatting compliance before submission. Detects heading numbering, figure/table caption formats, citation styles, and other formatting issues according to journal requirements (IEEE, ACM, APA).",
    fr: "Check your academic paper for formatting compliance before submission. Detects heading numbering, figure/table caption formats, citation styles, and other formatting issues according to journal requirements (IEEE, ACM, APA).",
    es: "Check your academic paper for formatting compliance before submission. Detects heading numbering, figure/table caption formats, citation styles, and other formatting issues according to journal requirements (IEEE, ACM, APA).",
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
    keywords: ['academic formatting', 'submission readiness', 'paper formatting', 'IEEE format', 'ACM format', 'APA format'],
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
