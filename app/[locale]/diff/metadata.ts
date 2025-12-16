import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://markdownpreview.org"
  const currentUrl = `${baseUrl}/${locale}/diff`

  const titles: Record<string, string> = {
    en: "Markdown Diff Online – Compare Markdown Files with Semantic Block Diff",
    ja: "Markdown Diff オンライン – セマンティックブロック差分で Markdown ファイルを比較",
    zh: "Markdown 差异对比在线工具 – 使用语义块差异对比 Markdown 文件",
  }

  const descriptions: Record<string, string> = {
    en: "Free online Markdown diff tool to compare Markdown files and versions. Supports ignore rules, block-aware diff, word-level highlighting, multiple views, file upload, and export. No sign-up required.",
    ja: "Markdown ファイルとバージョンを比較する無料のオンライン Markdown 差分ツール。無視ルール、ブロック対応差分、単語レベルのハイライト、複数のビュー、ファイルアップロード、エクスポートをサポート。登録不要。",
    zh: "免费的在线 Markdown 差异对比工具，用于比较 Markdown 文件和版本。支持忽略规则、块感知差异、词级别高亮、多种视图、文件上传和导出。无需注册。",
  }

  const title = titles[locale] || titles.en
  const description = descriptions[locale] || descriptions.en

  const localeMap: Record<string, string> = {
    en: "en_US",
    ja: "ja_JP",
    zh: "zh_CN",
  }

  return {
    title,
    description,
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

