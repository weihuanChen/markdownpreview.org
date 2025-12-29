import { MarkdownDiffPageClient } from './diff-client'
export { generateMetadata } from './metadata'

export default async function MarkdownDiffPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://markdownpreview.org'
  const currentUrl = `${baseUrl}/${locale}/diff`

  const names: Record<string, string> = {
    en: "Markdown Diff Tool",
    ja: "Markdown Diff ツール",
    zh: "Markdown 差异对比工具",
  }

  const descriptions: Record<string, string> = {
    en: "Free online Markdown diff tool to compare Markdown files and versions. Supports ignore rules, block-aware diff, word-level highlighting, multiple views, file upload, and export. No sign-up required.",
    ja: "Markdown ファイルとバージョンを比較する無料のオンライン Markdown 差分ツール。無視ルール、ブロック対応差分、単語レベルのハイライト、複数のビュー、ファイルアップロード、エクスポートをサポート。登録不要。",
    zh: "免费的在线 Markdown 差异对比工具，用于比较 Markdown 文件和版本。支持忽略规则、块感知差异、词级别高亮、多种视图、文件上传和导出。无需注册。",
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
          'Markdown File Comparison',
          'Semantic Block Diff',
          'Word-level Highlighting',
          'Ignore Rules Support',
          'Multiple View Modes',
          'File Upload & Export',
          'No Registration Required',
        ],
        inLanguage: locale,
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${currentUrl}#software`,
        name: names[locale] || names.en,
        description: descriptions[locale] || descriptions.en,
        url: currentUrl,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
    ],
  }

  return (
    <main className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MarkdownDiffPageClient />
    </main>
  )
}
