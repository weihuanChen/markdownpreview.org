import { AcademicCheckClient } from '../academic-check-client'
export { generateMetadata } from './metadata'

export default async function ClarityReadabilityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://markdownpreview.org'
  const currentUrl = `${baseUrl}/${locale}/academic-check/clarity`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': `${currentUrl}#webapp`,
        name: 'Clarity & Readability Check',
        description: 'Improve the clarity and readability of your academic documents. Checks sentence length, heading misuse, table readability, paragraph flow, and provides suggestions for better document quality.',
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
          'Sentence Length Check',
          'Heading Misuse Detection',
          'Table Readability Check',
          'Paragraph Flow Analysis',
          'Quality Suggestions',
          'No Registration Required',
        ],
        inLanguage: locale,
      },
    ],
  }

  return (
    <main className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AcademicCheckClient activeTab="clarity" />
    </main>
  )
}
