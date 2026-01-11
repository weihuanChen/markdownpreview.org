import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://markdownpreview.org"
  const currentUrl = `${baseUrl}/${locale}/formatter`

  const titles: Record<string, string> = {
    en: "Markdown Formatter with Safe Auto-Fix & Diff Preview",
    ja: "Markdownフォーマッター – オンラインでMarkdownを整形・美化",
    zh: "Markdown 格式化工具 – 在线格式化和美化 Markdown",
    fr: "Formateur Markdown – Formatez et embellissez votre Markdown en ligne",
    es: "Formateador Markdown – Formatea y embellece tu Markdown en línea",
  }

  const descriptions: Record<string, string> = {
    en: "Automatically format your Markdown using safe, deterministic rules. Review every change with word-level diff before applying. Auto-saves your content, formatting rules, and preferences locally in browser - your work persists across sessions.",
    ja: "差分プレビュー付きの無料オンラインMarkdownフォーマッター。フォーマットの問題を自動修正し、空白を正規化し、Markdownファイルを美化します。コンテンツ、フォーマットルール、設定をブラウザに自動保存し、セッション間で保持されます。登録不要。",
    zh: "免费的在线 Markdown 格式化工具，带差异预览。自动修复格式问题、规范化空白并美化您的 Markdown 文件。自动在浏览器本地保存您的内容、格式化规则和偏好设置，刷新页面后自动恢复。无需注册。",
    fr: "Formateur Markdown en ligne gratuit avec aperçu des différences. Corrigez automatiquement les problèmes de formatage, normalisez les espaces et embellissez vos fichiers Markdown. Sauvegarde automatique locale de votre contenu, règles de formatage et préférences dans le navigateur - votre travail persiste entre les sessions. Aucune inscription requise.",
    es: "Formateador Markdown en línea gratuito con vista previa de diferencias. Corrige automáticamente problemas de formato, normaliza espacios en blanco y embellece tus archivos Markdown. Guarda automáticamente tu contenido, reglas de formato y preferencias localmente en el navegador - tu trabajo persiste entre sesiones. No se requiere registro.",
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

