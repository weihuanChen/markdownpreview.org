import { getPaginatedPosts } from '@/lib/cms-blog'
import type { Locale } from '@/lib/types'
import { BlogCard } from '@/components/blog/blog-card'
import { Pagination } from '@/components/blog/pagination'
import { getTranslations } from 'next-intl/server'
import { defaultLocale } from '@/i18n'

export const revalidate = 43200 // 12 小时

interface BlogPageProps {
  params: { locale: Locale; page?: string[] }
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
  await params

  return {
    title: 'Blog',
    description: 'Latest articles and tutorials',
  }
}

export default async function BlogPage({ params }: BlogPageProps) {
  const resolvedParams = await params
  const page = resolvePage(resolvedParams.page)
  const { posts, totalPages } = await getPaginatedPosts(resolvedParams.locale, page)

  const t = await getTranslations()
  const isDefaultLocale = resolvedParams.locale === defaultLocale
  const emptyMessageKey = isDefaultLocale ? 'blog_no_posts' : 'blog_locale_in_progress'

  return (
    <div className="min-h-screen bg-background">
      {/* Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {t('blog_title')}
          </h1>
          <p className="text-muted-foreground">
            {t('blog_list_title')}
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">{t(emptyMessageKey)}</p>
          </div>
        ) : (
          <>
            {/* 文章列表 */}
            <div className="grid gap-6 mb-8">
              {posts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>

            {/* 分页 */}
            <Pagination currentPage={page} totalPages={totalPages} />
          </>
        )}
      </main>
    </div>
  )
}
