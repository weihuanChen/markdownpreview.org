import { MarkdownFormatter } from '@/components/markdown-formatter'
import { RelatedTools } from '@/components/related-tools'
export { generateMetadata } from './metadata'

export default function FormatterPage() {
  return (
    <main className="min-h-screen bg-background">
      <MarkdownFormatter />
      <RelatedTools />
    </main>
  )
}

