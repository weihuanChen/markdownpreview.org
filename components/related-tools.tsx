"use client"

import { Link } from '@/navigation'
import { usePathname } from "next/navigation"
import { FileText, BookOpen, ArrowRight, GitCompare, Wand2 } from "lucide-react"
import { useTranslations } from "next-intl"

interface ToolItem {
  href: string
  icon: React.ComponentType<{ className?: string }>
  titleKey: string
  descriptionKey: string
  linkKey: string
}

const TOOLS: ToolItem[] = [
  {
    href: "/",
    icon: FileText,
    titleKey: "related_tools_preview_title",
    descriptionKey: "related_tools_preview_description",
    linkKey: "related_tools_preview_link",
  },
  {
    href: "/diff",
    icon: GitCompare,
    titleKey: "related_tools_diff_title",
    descriptionKey: "related_tools_diff_description",
    linkKey: "related_tools_diff_link",
  },
  {
    href: "/formatter",
    icon: Wand2,
    titleKey: "related_tools_formatter_title",
    descriptionKey: "related_tools_formatter_description",
    linkKey: "related_tools_formatter_link",
  },
]

const BLOG: ToolItem = {
  href: "/blog",
  icon: BookOpen,
  titleKey: "related_tools_guides_title",
  descriptionKey: "related_tools_guides_description",
  linkKey: "related_tools_guides_link",
}

interface RelatedToolsProps {
  excludePath?: string
}

export function RelatedTools({ excludePath }: RelatedToolsProps = {}) {
  const t = useTranslations()
  const pathname = usePathname()

  // Get the current path without locale prefix (e.g., /formatter from /en/formatter)
  const currentPath = excludePath || (pathname ? pathname.replace(/^\/[^/]+/, "") || "/" : "/")

  // Filter out the current page
  const availableTools = TOOLS.filter((tool) => {
    // Normalize both paths for comparison (ensure leading slash)
    const toolPath = tool.href.startsWith("/") ? tool.href : `/${tool.href}`
    const normalizedCurrentPath = currentPath.startsWith("/") ? currentPath : `/${currentPath}`
    return toolPath !== normalizedCurrentPath
  })

  // Show 2 tools + 1 blog = 3 cards total
  const toolsToShow = availableTools.slice(0, 2)
  const cards = [...toolsToShow, BLOG]

  return (
    <section className="relative py-16 px-4">
      <div className="absolute inset-0 bg-gradient-to-b from-card/70 via-transparent to-secondary/50" />
      <div className="relative max-w-6xl mx-auto space-y-8">
        <h2 className="text-2xl md:text-3xl font-semibold text-center text-foreground">
          {t("related_tools_title")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {cards.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative flex flex-col h-full rounded-2xl border border-border/70 bg-card/80 p-6 shadow-[0_18px_60px_-42px_rgba(15,23,42,0.55)] backdrop-blur transition-all hover:-translate-y-1 hover:border-[var(--brand-blue)]/60"
              >
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-br from-[var(--brand-blue)]/8 via-transparent to-[#ff7a53]/10" />
                <div className="relative flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[var(--brand-blue)]/12 flex items-center justify-center group-hover:bg-[var(--brand-blue)]/18 transition-colors">
                    <Icon className="h-6 w-6 text-[var(--brand-blue)]" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-[var(--brand-blue)] transition-colors">
                      {t(item.titleKey)}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t(item.descriptionKey)}
                    </p>
                    <div className="flex items-center text-sm font-medium text-[var(--brand-blue)] group-hover:gap-2 transition-all">
                      <span>{t(item.linkKey)}</span>
                      <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
