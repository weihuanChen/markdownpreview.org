"use client"

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/navigation';
import { Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { locales, type Locale } from '@/i18n';

export function LanguageSwitcher() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Change language" className="hover:bg-[var(--brand-blue)]/12">
          <Globe className="h-5 w-5 text-[var(--brand-blue)]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border border-border/70 bg-card/90 shadow-[0_14px_48px_-32px_rgba(15,23,42,0.65)]">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleLanguageChange(loc)}
            className={locale === loc ? 'bg-[var(--brand-blue)]/12 text-foreground' : ''}
          >
            {t(`lang_${loc}`)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
