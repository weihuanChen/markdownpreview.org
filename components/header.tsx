"use client"

import { useTranslations } from 'next-intl'
import { Moon, Sun, BookOpen, GitCompare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Link } from '@/navigation'
import { useTheme } from "@/components/theme-provider"

export function Header() {
  const t = useTranslations()
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between">
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
            <GitCompare className="h-5 w-5 text-[#0075de]" />
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
            <BookOpen className="h-5 w-5 text-[#0075de]" />
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
            <Moon className="h-5 w-5 text-[#0075de]" />
          ) : (
            <Sun className="h-5 w-5 text-[#0075de]" />
          )}
        </Button>

        {/* Language Switcher */}
        <LanguageSwitcher />
      </div>
    </header>
  )
}
