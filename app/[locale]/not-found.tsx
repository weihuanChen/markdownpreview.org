import { getTranslations, getLocale } from 'next-intl/server'
import { Link } from '@/navigation'
import { Button } from '@/components/ui/button'
import { Home, BookOpen, AlertCircle } from 'lucide-react'

export default async function NotFound() {
  // 获取当前 locale
  const locale = await getLocale()
  const t = await getTranslations()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* 404 图标和标题 */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-muted p-6">
              <AlertCircle className="h-16 w-16 text-muted-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground">404</h1>
          <h2 className="text-2xl font-semibold text-foreground">
            {t('not_found_title')}
          </h2>
          <p className="text-muted-foreground">
            {t('not_found_description')}
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              {t('not_found_go_home')}
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/blog" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {t('not_found_go_blog')}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

