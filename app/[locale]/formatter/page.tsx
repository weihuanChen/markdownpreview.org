import { MarkdownFormatter } from '@/components/markdown-formatter'
import { RelatedTools } from '@/components/related-tools'
export { generateMetadata } from './metadata'

export default async function FormatterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://markdownpreview.org'
  const currentUrl = `${baseUrl}/${locale}/formatter`

  const names: Record<string, string> = {
    en: "Markdown Formatter",
    ja: "Markdownフォーマッター",
    zh: "Markdown 格式化工具",
    fr: "Formateur Markdown",
    es: "Formateador Markdown",
  }

  const descriptions: Record<string, string> = {
    en: "Automatically format your Markdown using safe, deterministic rules. Review every change with word-level diff before applying. Auto-saves your content, formatting rules, and preferences locally in browser - your work persists across sessions.",
    ja: "差分プレビュー付きの無料オンラインMarkdownフォーマッター。フォーマットの問題を自動修正し、空白を正規化し、Markdownファイルを美化します。コンテンツ、フォーマットルール、設定をブラウザに自動保存し、セッション間で保持されます。登録不要。",
    zh: "免费的在线 Markdown 格式化工具，带差异预览。自动修复格式问题、规范化空白并美化您的 Markdown 文件。自动在浏览器本地保存您的内容、格式化规则和偏好设置，刷新页面后自动恢复。无需注册。",
    fr: "Formateur Markdown en ligne gratuit avec aperçu des différences. Corrigez automatiquement les problèmes de formatage, normalisez les espaces et embellissez vos fichiers Markdown. Sauvegarde automatique locale de votre contenu, règles de formatage et préférences dans le navigateur - votre travail persiste entre les sessions. Aucune inscription requise.",
    es: "Formateador Markdown en línea gratuito con vista previa de diferencias. Corrige automáticamente problemas de formato, normaliza espacios en blanco y embellece tus archivos Markdown. Guarda automáticamente tu contenido, reglas de formato y preferencias localmente en el navegador - tu trabajo persiste entre sesiones. No se requiere registro.",
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
          'Markdown Formatting',
          'Auto-fix Format Issues',
          'Whitespace Normalization',
          'Word-level Diff Preview',
          'Safe Deterministic Rules',
          'Local Auto-save',
          'Session Persistence',
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
      <MarkdownFormatter />
      <RelatedTools />
    </main>
  )
}

