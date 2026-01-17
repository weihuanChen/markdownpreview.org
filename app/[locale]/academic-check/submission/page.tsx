import { AcademicCheckClient } from '../academic-check-client'
export { generateMetadata } from './metadata'

export default async function SubmissionReadinessPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://markdownpreview.org'
  const currentUrl = `${baseUrl}/${locale}/academic-check/submission`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': `${currentUrl}#webapp`,
        name: 'Submission Readiness Check',
        description: 'Check your academic paper for formatting compliance before submission. Detects heading numbering, figure/table caption formats, citation styles, and other formatting issues according to journal requirements (IEEE, ACM, APA).',
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
          'Heading Numbering Check',
          'Figure Caption Format Check',
          'Table Caption Format Check',
          'Citation Format Check',
          'Journal Preset Support (IEEE, ACM, APA)',
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
      <AcademicCheckClient activeTab="submission" />
    </main>
  )
}
