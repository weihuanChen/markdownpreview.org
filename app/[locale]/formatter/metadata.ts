import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://markdownpreview.org"
  const currentUrl = `${baseUrl}/${locale}/formatter`

  const titles: Record<string, string> = {
    en: "Markdown Formatter – Format & Beautify Your Markdown Online",
    ja: "Markdownフォーマッター – オンラインでMarkdownを整形・美化",
    zh: "Markdown 格式化工具 – 在线格式化和美化 Markdown",
    fr: "Formateur Markdown – Formatez et embellissez votre Markdown en ligne",
    es: "Formateador Markdown – Formatea y embellece tu Markdown en línea",
  }

  const descriptions: Record<string, string> = {
    en: "Free online Markdown formatter with diff preview. Automatically fix formatting issues, normalize whitespace, and beautify your Markdown files. No sign-up required.",
    ja: "差分プレビュー付きの無料オンラインMarkdownフォーマッター。フォーマットの問題を自動修正し、空白を正規化し、Markdownファイルを美化します。登録不要。",
    zh: "免费的在线 Markdown 格式化工具，带差异预览。自动修复格式问题、规范化空白并美化您的 Markdown 文件。无需注册。",
    fr: "Formateur Markdown en ligne gratuit avec aperçu des différences. Corrigez automatiquement les problèmes de formatage, normalisez les espaces et embellissez vos fichiers Markdown. Aucune inscription requise.",
    es: "Formateador Markdown en línea gratuito con vista previa de diferencias. Corrige automáticamente problemas de formato, normaliza espacios en blanco y embellece tus archivos Markdown. No se requiere registro.",
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
    keywords: ['markdown formatter', 'markdown beautifier', 'markdown linter', 'format markdown', 'markdown fixer'],
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

