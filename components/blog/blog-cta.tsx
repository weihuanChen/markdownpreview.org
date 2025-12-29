'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from '@/navigation'
import { Button } from '@/components/ui/button'
import { ArrowRight, Edit3 } from 'lucide-react'

export function BlogCTA() {
  const t = useTranslations()
  const router = useRouter()

  const handleClick = () => {
    // 导航到首页
    router.push('/')
    // 确保滚动到顶部
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)
  }

  return (
    <div className="my-12 rounded-2xl border-2 border-[var(--brand-blue)]/30 bg-gradient-to-br from-[var(--brand-blue)]/8 via-background to-background p-8 shadow-lg">
      <div className="flex flex-col items-center text-center">
        {/* Icon */}
        <div className="mb-4 rounded-full bg-[var(--brand-blue)]/14 p-4">
          <Edit3 className="h-8 w-8 text-[var(--brand-blue)]" />
        </div>

        {/* Heading */}
        <h3 className="mb-2 text-2xl font-bold text-foreground">
          {t('blog_cta_title')}
        </h3>

        {/* Description */}
        <p className="mb-6 max-w-2xl text-muted-foreground">
          {t('blog_cta_description')}
        </p>

        {/* CTA Button */}
        <Button
          size="lg"
          className="group bg-[var(--brand-blue)] text-[#052220] hover:bg-[var(--brand-blue)]/90"
          onClick={handleClick}
        >
          <span className="flex items-center gap-2">
            {t('blog_cta_button')}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Button>

        {/* Additional info */}
        <p className="mt-4 text-sm text-muted-foreground">
          {t('blog_cta_hint')}
        </p>
      </div>
    </div>
  )
}
