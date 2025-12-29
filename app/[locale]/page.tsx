import path from "path"
import { promises as fs } from "fs"
import { Metadata } from "next"

import { Hero } from "@/components/hero"
import { MarkdownEditorClient } from "@/components/markdown-editor-client"
import { WhatIsMarkdown } from "@/components/what-is-markdown"
import { WhyUseMarkdownEditor } from "@/components/why-use-markdown-editor"
import { KeyFeatures } from "@/components/key-features"
import { CommonUseCases } from "@/components/common-use-cases"
import { MarkdownDiffSection } from "@/components/markdown-diff-section"
import { MarkdownQuickStart } from "@/components/markdown-quickstart"
import { Faq } from "@/components/faq"
import { RelatedTools } from "@/components/related-tools"
import { locales } from "@/i18n"

// 强制静态生成，避免运行时在 Cloudflare Worker 中读取本地文件导致 404
export const dynamic = "force-static"

const TEMPLATE_FILES: Record<string, string> = {
  ja: "public/templates/default-ja.md",
  en: "public/templates/default-en.md",
  zh: "public/templates/default-zh.md",
}

async function loadTemplate(locale: string) {
  const fileName = TEMPLATE_FILES[locale] || TEMPLATE_FILES.en
  try {
    return await fs.readFile(path.join(process.cwd(), fileName), "utf-8")
  } catch (error) {
    console.error("Failed to load template for locale", locale, error)
    return ""
  }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://markdownpreview.org'
  const currentUrl = `${baseUrl}/${locale}`

  const titles: Record<string, string> = {
    en: "Markdown Preview Online – Free Markdown Editor with Live Preview & Examples",
    ja: "Markdown Preview Online – ライブプレビュー付き無料Markdownエディターとサンプル",
    zh: "Markdown Preview Online – 免费 Markdown 编辑器，支持实时预览和示例",
  }

  const descriptions: Record<string, string> = {
    en: "Free online Markdown editor with live preview and interactive examples. Write Markdown, try quick-start snippets, and see formatted output instantly. No sign-up required.",
    ja: "ライブプレビューとインタラクティブなサンプル付きの無料オンラインMarkdownエディター。Markdownを記述し、クイックスタートスニペットを試して、フォーマットされた出力を即座に確認できます。登録不要。",
    zh: "免费的在线 Markdown 编辑器，支持实时预览和交互式示例。编写 Markdown，尝试快速入门片段，即时查看格式化输出。无需注册。",
  }

  const title = titles[locale] || titles.en
  const description = descriptions[locale] || descriptions.en

  const localeMap: Record<string, string> = {
    en: 'en_US',
    ja: 'ja_JP',
    zh: 'zh_CN',
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
      siteName: 'MarkdownPreview.org',
      locale: localeMap[locale] || 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function MarkdownEditorPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params
  const locale = locales.includes(rawLocale as any) ? rawLocale : "en"
  const initialMarkdown = await loadTemplate(locale)

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://markdownpreview.org'
  const currentUrl = `${baseUrl}/${locale}`

  // JSON-LD 结构化数据
  const names: Record<string, string> = {
    en: "Markdown Preview Dojo",
    ja: "Markdown Preview 道場",
    zh: "Markdown Preview 演练场",
  }

  const descriptions: Record<string, string> = {
    en: "Free online Markdown editor with live preview and interactive examples. Write Markdown, try quick-start snippets, and see formatted output instantly. No sign-up required.",
    ja: "ライブプレビューとインタラクティブなサンプル付きの無料オンラインMarkdownエディター。Markdownを記述し、クイックスタートスニペットを試して、フォーマットされた出力を即座に確認できます。登録不要。",
    zh: "免费的在线 Markdown 编辑器，支持实时预览和交互式示例。编写 Markdown，尝试快速入门片段，即时查看格式化输出。无需注册。",
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': `${currentUrl}#webapp`,
        name: names[locale] || names.en,
        description: descriptions[locale] || descriptions.en,
        url: currentUrl,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        browserRequirements: 'Requires JavaScript. Requires HTML5.',
        softwareVersion: '1.0',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        featureList: [
          'Live Markdown Preview',
          'Syntax Highlighting',
          'Markdown Diff Tool',
          'Markdown Formatter',
          'Interactive Examples',
          'No Registration Required',
        ],
        inLanguage: locale,
      },
      {
        '@type': 'WebSite',
        '@id': `${baseUrl}#website`,
        url: baseUrl,
        name: 'MarkdownPreview.org',
        description: descriptions[locale] || descriptions.en,
        inLanguage: locale,
        publisher: {
          '@type': 'Organization',
          name: 'MarkdownPreview.org',
          logo: {
            '@type': 'ImageObject',
            url: `${baseUrl}/android-chrome-512x512.png`,
            width: 512,
            height: 512,
          },
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${baseUrl}/${locale}/blog?search={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
        alternateName: [
          'Markdown Preview Dojo',
          'Markdown Preview 道場',
          'Markdown Preview 演练场',
        ],
      },
    ],
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <MarkdownEditorClient initialValue={initialMarkdown} />
      <MarkdownQuickStart />
      <WhatIsMarkdown />
      <WhyUseMarkdownEditor />
      <KeyFeatures />
      <CommonUseCases />
      <MarkdownDiffSection />
      <Faq />
      <RelatedTools />
    </div>
  )
}
