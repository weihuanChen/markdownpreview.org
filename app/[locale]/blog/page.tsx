import { getPaginatedPosts } from '@/lib/cms-blog'
import type { Locale } from '@/lib/types'
import { BlogCard } from '@/components/blog/blog-card'
import { Pagination } from '@/components/blog/pagination'
import { getTranslations } from 'next-intl/server'

export const revalidate = 43200 // 12 小时

interface BlogPageProps {
  params: { locale: Locale }
  searchParams: { page?: string }
}

export async function generateMetadata({ params }: BlogPageProps) {
  // 这里可以根据需要动态生成元数据
  return {
    title: 'Blog',
    description: 'Latest articles and tutorials',
  }
}

export default async function BlogPage({ params, searchParams }: BlogPageProps) {
  const resolvedSearchParams = await searchParams
  const page = parseInt(resolvedSearchParams.page || '1', 10)
  const resolvedParams = await params
  const { posts, total, totalPages } = await getPaginatedPosts(resolvedParams.locale, page)

  const t = await getTranslations()

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
            <p className="text-muted-foreground text-lg">{t('blog_no_posts')}</p>
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
