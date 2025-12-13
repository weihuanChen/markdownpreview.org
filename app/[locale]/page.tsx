"use server"

import path from "path"
import { promises as fs } from "fs"

import { MarkdownEditorClient } from "@/components/markdown-editor-client"
import { MarkdownQuickStart } from "@/components/markdown-quickstart"
import { Faq } from "@/components/faq"
import { locales } from "@/i18n"

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

export default async function MarkdownEditorPage({ params }: { params: { locale: string } }) {
  const locale = locales.includes(params.locale as any) ? params.locale : "en"
  const initialMarkdown = await loadTemplate(locale)

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MarkdownEditorClient initialValue={initialMarkdown} />
      <MarkdownQuickStart />
      <Faq />
    </div>
  )
}
