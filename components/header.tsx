"use client"

import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { Moon, Sun, BookOpen, GitCompare, Wand2, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from '@/navigation'
import { useTheme } from "@/components/theme-provider"

// 动态导入 LanguageSwitcher 以避免 Radix UI 的水合错误
const LanguageSwitcher = dynamic(
  () => import('@/components/language-switcher').then(mod => mod.LanguageSwitcher),
  { ssr: false }
)

export function Header() {
  const t = useTranslations()
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="border-b border-border/70 bg-card/80 px-4 py-3 flex items-center justify-between backdrop-blur shadow-[0_8px_30px_-28px_rgba(15,23,42,0.65)]">
      <Link href="/" className="hover:opacity-80 transition-opacity">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold text-foreground">{t("app_title")}</h1>
          <p className="text-xs text-muted-foreground">{t("app_subtitle")}</p>
        </div>
      </Link>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          asChild
          aria-label={t("markdown_diff_label")}
        >
          <Link href="/diff">
            <GitCompare className="h-5 w-5 text-[var(--brand-blue)]" />
          </Link>
        </Button>

        {/* Formatter Navigation */}
        <Button
          variant="ghost"
          size="icon"
          asChild
          aria-label="Markdown Formatter"
        >
          <Link href="/formatter">
            <Wand2 className="h-5 w-5 text-[var(--brand-blue)]" />
          </Link>
        </Button>

        {/* Academic Check Navigation */}
        <Button
          variant="ghost"
          size="icon"
          asChild
          aria-label={t("academic_check_nav")}
        >
          <Link href="/academic-check/submission">
            <GraduationCap className="h-5 w-5 text-[var(--brand-blue)]" />
          </Link>
        </Button>

        {/* Blog Navigation */}
        <Button
          variant="ghost"
          size="icon"
          asChild
          aria-label={t("blog_nav")}
        >
          <Link href="/blog">
            <BookOpen className="h-5 w-5 text-[var(--brand-blue)]" />
          </Link>
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={theme === "light" ? t("theme_dark") : t("theme_light")}
        >
          {theme === "light" ? (
            <Moon className="h-5 w-5 text-[var(--brand-blue)]" />
          ) : (
            <Sun className="h-5 w-5 text-[var(--brand-blue)]" />
          )}
        </Button>

        {/* Language Switcher */}
        <LanguageSwitcher />
      </div>
    </header>
  )
}
