import { getPaginatedPosts, getAllPosts } from '@/lib/cms-blog'
import type { Locale, BlogPost } from '@/lib/types'
import { BlogCard } from '@/components/blog/blog-card'
import { BlogGroupedList } from '@/components/blog/blog-grouped-list'
import { Pagination } from '@/components/blog/pagination'
import { getTranslations } from 'next-intl/server'
import { defaultLocale } from '@/i18n'

export const revalidate = 43200 // 12 小时

interface BlogPageProps {
  params: { locale: Locale; page?: string[] }
  searchParams?: { missing?: string }
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

export async function generateMetadata({ params }: BlogPageProps) {
  const resolvedParams = await params
  const t = await getTranslations()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://markdownpreview.org'

  // 构建路径：默认语言不加前缀
  const buildPath = (locale: string, path: string = '') =>
    locale === defaultLocale ? path : `/${locale}${path}`

  // canonical 始终指向主列表页（无分页），避免重复内容
  const canonicalUrl = `${baseUrl}${buildPath(resolvedParams.locale, '/blog')}`

  return {
    title: t('blog_meta_title'),
    description: t('blog_list_title'),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'ja': `${baseUrl}/blog`,
        'en': `${baseUrl}/en/blog`,
        'zh': `${baseUrl}/zh/blog`,
        'fr': `${baseUrl}/fr/blog`,
        'x-default': `${baseUrl}/blog`,
      },
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
    const page = resolvePage(resolvedParams.page)
    const t = await getTranslations()
    const isDefaultLocale = resolvedParams.locale === defaultLocale
    const emptyMessageKey = isDefaultLocale ? 'blog_no_posts' : 'blog_locale_in_progress'
    const showMissingNotice = searchParams?.missing === '1'

    // 第一页使用分组显示，其他页面使用分页显示
    const useGroupedView = page === 1

    let posts: BlogPost[] = []
    let totalPages = 0

    if (useGroupedView) {
      // 获取所有文章用于分组显示
      const allPosts = await getAllPosts(resolvedParams.locale)
      posts = allPosts
      // 计算总页数（用于显示 All posts 按钮）
      const paginatedResult = await getPaginatedPosts(resolvedParams.locale, 1)
      totalPages = paginatedResult.totalPages
    } else {
      // 使用分页获取文章
      const paginatedResult = await getPaginatedPosts(resolvedParams.locale, page)
      posts = paginatedResult.posts
      totalPages = paginatedResult.totalPages
    }

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

          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">{t(emptyMessageKey)}</p>
            </div>
          ) : useGroupedView ? (
            // 分组显示（第一页）
            <BlogGroupedList posts={posts} totalPages={totalPages} />
          ) : (
            // 分页显示（其他页面）
            <>
              <div className="grid gap-6 mb-8">
                {posts.map((post) => (
                  <BlogCard key={post.slug} post={post} />
                ))}
              </div>
              <Pagination currentPage={page} totalPages={totalPages} />
            </>
          )}
        </main>
      </div>
    )
  } catch (error) {
    console.error('Error in BlogPage:', error)
    // 返回空列表而不是抛出异常
    const t = await getTranslations()
    const resolvedParams = await params
    const showMissingNotice = searchParams?.missing === '1'
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
