"use client"

import { useTranslations } from 'next-intl'

export function Footer() {
  const t = useTranslations()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-card py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand Section */}
          <div>
            <h3 className="font-semibold text-lg mb-3 text-foreground">{t("app_title")}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{t("footer_description")}</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-medium text-sm mb-3 text-foreground">{t("footer_quicklinks")}</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t("footer_about")}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t("footer_guide")}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t("footer_contact")}
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-medium text-sm mb-3 text-foreground">{t("footer_resources")}</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://www.markdownguide.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Markdown {t("footer_guide")}
                </a>
              </li>
              <li>
                <a
                  href="https://streamdown.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Streamdown
                </a>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-6 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            © {currentYear} {t("app_title")}. {t("footer_rights")}
          </p>
        </div>
      </div>
    </footer>
  )
}
