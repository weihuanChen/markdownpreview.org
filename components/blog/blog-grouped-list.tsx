'use client'

import type { BlogPost } from '@/lib/types'
import { BlogCard } from './blog-card'
import { Pagination } from './pagination'
import { useTranslations } from 'next-intl'

interface BlogGroupedListProps {
  featuredPosts: BlogPost[]
  advancedPosts: BlogPost[]
  practicalPosts: BlogPost[]
  currentPage: number
  totalPages: number
}

export function BlogGroupedList({
  featuredPosts,
  advancedPosts,
  practicalPosts,
  currentPage,
  totalPages,
}: BlogGroupedListProps) {
  const t = useTranslations()
  return (
    <div className="space-y-12">
      {/* Getting Started */}
      {featuredPosts.length > 0 && (
        <section>
          <h2 className="text-3xl font-bold text-foreground mb-6">
            {t('blog_group_getting_started')}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {featuredPosts.map((post) => (
              <BlogCard key={`getting-started-${post.slug}`} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* Advanced / Reference */}
      {advancedPosts.length > 0 && (
        <section>
          <h2 className="text-3xl font-bold text-foreground mb-6">
            {t('blog_group_advanced_reference')}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {advancedPosts.map((post) => (
              <BlogCard key={`advanced-${post.slug}`} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* Practical Guides */}
      {practicalPosts.length > 0 && (
        <section>
          <h2 className="text-3xl font-bold text-foreground mb-6">
            {t('blog_group_practical_guides')}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {practicalPosts.map((post) => (
              <BlogCard key={`practical-${post.slug}`} post={post} />
            ))}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} />
        </section>
      )}
    </div>
  )
}
