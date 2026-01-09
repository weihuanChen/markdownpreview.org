import { getAllPosts, getPostsByCategory } from '@/lib/cms-blog'
import type { Locale } from '@/lib/types'
import { BlogGroupedList } from '@/components/blog/blog-grouped-list'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { defaultLocale, locales } from '@/i18n'

export const revalidate = 43200 // 12 小时
const FEATURED_COUNT = 6
const PRACTICAL_PAGE_SIZE = 9

interface BlogPageProps {
  params: Promise<{ locale: Locale; page?: string[] }>
  searchParams?: Promise<{ missing?: string }>
}

const resolvePage = (segments?: string[]) => {
  if (!segments?.length) {
    return 1
  }

  const [segment, pageParam] = segments
  if (segment !== 'page') {
    return 1
  }

  const parsed = parseInt(pageParam || '1', 10)
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed
}

export function generateStaticParams() {
  // 为每个 locale 生成博客首页
  return locales.map((locale) => ({ locale, page: [] }))
}

export async function generateMetadata({ params }: Omit<BlogPageProps, 'searchParams'>) {
  const resolvedParams = await params
  setRequestLocale(resolvedParams.locale)
  const t = await getTranslations()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://markdownpreview.org'
  const currentPage = resolvePage(resolvedParams.page)

  // 构建路径：默认语言不加前缀
  const buildPath = (locale: string, path: string = '') =>
    locale === defaultLocale ? path : `/${locale}${path}`

  const canonicalPath =
    currentPage > 1 ? `/blog/page/${currentPage}` : '/blog'
  const canonicalUrl = `${baseUrl}${buildPath(resolvedParams.locale, canonicalPath)}`
  const languageAlternates = locales.reduce<Record<string, string>>(
    (acc, locale) => {
      acc[locale] = `${baseUrl}${buildPath(locale, canonicalPath)}`
      return acc
    },
    { 'x-default': `${baseUrl}${canonicalPath}` }
  )

  return {
    title: t('blog_meta_title'),
    description: t('blog_list_title'),
    alternates: {
      canonical: canonicalUrl,
      languages: languageAlternates,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
  }
}

export default async function BlogPage({ params, searchParams }: BlogPageProps) {
  try {
    const resolvedParams = await params
    const resolvedSearchParams = await searchParams
    // 启用静态渲染 - 必须在使用其他 next-intl API 之前调用
    setRequestLocale(resolvedParams.locale)

    const page = resolvePage(resolvedParams.page)
    const t = await getTranslations()
    const isDefaultLocale = resolvedParams.locale === defaultLocale
    const emptyMessageKey = isDefaultLocale ? 'blog_no_posts' : 'blog_locale_in_progress'
    const showMissingNotice = resolvedSearchParams?.missing === '1'

    const [featuredPostsRaw, advancedPostsRaw, allPosts] = await Promise.all([
      getPostsByCategory('featured', resolvedParams.locale, FEATURED_COUNT),
      getPostsByCategory('advanced', resolvedParams.locale, FEATURED_COUNT),
      getAllPosts(resolvedParams.locale),
    ])

    // 如果分类接口权限受限，使用已拉取的全部文章做兜底过滤
    const featuredPosts = featuredPostsRaw.length > 0
      ? featuredPostsRaw
      : allPosts.filter(p => p.categoryId === 3).slice(0, FEATURED_COUNT)
    const advancedPosts = advancedPostsRaw.length > 0
      ? advancedPostsRaw
      : allPosts.filter(p => p.categoryId === 4).slice(0, FEATURED_COUNT)
    const hasPosts = allPosts.length > 0

    const practicalPool = allPosts.slice(FEATURED_COUNT)
    const practicalTotalPages = practicalPool.length > 0
      ? Math.ceil(practicalPool.length / PRACTICAL_PAGE_SIZE)
      : 1
    const currentPage = Math.min(page, practicalTotalPages)
    const practicalStart = (currentPage - 1) * PRACTICAL_PAGE_SIZE
    const practicalPosts = practicalPool.slice(practicalStart, practicalStart + PRACTICAL_PAGE_SIZE)

    return (
      <div className="min-h-screen bg-background">
        {/* Content */}
        <main className="container mx-auto px-4 py-12">
          {/* 引导文案 */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-3">
              {t('blog_hero_title')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('blog_hero_description')}
            </p>
          </div>

          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              {t('blog_title')}
            </h1>
            <p className="text-muted-foreground">
              {t('blog_list_title')}
            </p>
          </div>

          {showMissingNotice && (
            <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
              {t('blog_missing_translation_notice')}
            </div>
          )}

          {!hasPosts ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">{t(emptyMessageKey)}</p>
            </div>
          ) : (
            <BlogGroupedList
              featuredPosts={featuredPosts}
              advancedPosts={advancedPosts}
              practicalPosts={practicalPosts}
              currentPage={currentPage}
              totalPages={practicalTotalPages}
            />
          )}
        </main>
      </div>
    )
  } catch (error) {
    console.error('Error in BlogPage:', error)
    // 返回空列表而不是抛出异常
    const resolvedParams = await params
    const resolvedSearchParams = await searchParams
    setRequestLocale(resolvedParams.locale)
    const t = await getTranslations()
    const showMissingNotice = resolvedSearchParams?.missing === '1'
    const isDefaultLocale = resolvedParams.locale === defaultLocale
    const emptyMessageKey = isDefaultLocale ? 'blog_no_posts' : 'blog_locale_in_progress'

    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-12">
          {/* 引导文案 */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-3">
              {t('blog_hero_title')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('blog_hero_description')}
            </p>
          </div>

          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              {t('blog_title')}
            </h1>
            <p className="text-muted-foreground">
              {t('blog_list_title')}
            </p>
          </div>
          {showMissingNotice && (
            <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
              {t('blog_missing_translation_notice')}
            </div>
          )}
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">{t(emptyMessageKey)}</p>
          </div>
        </main>
      </div>
    )
  }
}
