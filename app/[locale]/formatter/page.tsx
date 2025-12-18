import type { Metadata } from 'next'
import { MarkdownFormatter } from '@/components/markdown-formatter'

export const metadata: Metadata = {
  title: 'Markdown Formatter - Format & Beautify Your Markdown',
  description: 'Free online Markdown formatter with diff preview. Automatically fix formatting issues, normalize whitespace, and beautify your Markdown files.',
  keywords: ['markdown formatter', 'markdown beautifier', 'markdown linter', 'format markdown', 'markdown fixer'],
  openGraph: {
    title: 'Markdown Formatter - Format & Beautify Your Markdown',
    description: 'Free online Markdown formatter with diff preview. Automatically fix formatting issues and beautify your Markdown files.',
    type: 'website',
  },
}

export default function FormatterPage() {
  return (
    <main className="min-h-screen bg-background">
      <MarkdownFormatter />
    </main>
  )
}

