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
    <section className="py-16 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="pt-8 pb-6">
          <div className="h-px w-full bg-border" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-foreground">
          {t("related_tools_title")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {cards.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex flex-col h-full rounded-xl border border-border bg-card/70 p-6 hover:border-[var(--brand-blue)]/50 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[rgba(0,117,222,0.1)] flex items-center justify-center group-hover:bg-[rgba(0,117,222,0.15)] transition-colors">
                    <Icon className="h-6 w-6 text-[var(--brand-blue)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-[var(--brand-blue)] transition-colors">
                      {t(item.titleKey)}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
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

