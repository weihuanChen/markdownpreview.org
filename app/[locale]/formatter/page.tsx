import { MarkdownFormatter } from '@/components/markdown-formatter'
export { generateMetadata } from './metadata'

export default function FormatterPage() {
  return (
    <main className="min-h-screen bg-background">
      <MarkdownFormatter />
    </main>
  )
}

