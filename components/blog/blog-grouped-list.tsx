'use client'

import type { BlogPost } from '@/lib/types'
import { BlogCard } from './blog-card'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/navigation'
import { Button } from '@/components/ui/button'

interface BlogGroupedListProps {
  posts: BlogPost[]
  totalPages: number
}

interface GroupedPosts {
  gettingStarted: BlogPost[]
  practicalGuides: BlogPost[]
  advancedReference: BlogPost[]
}

/**
 * 按时间顺序将文章分组
 * - Getting Started: 最新的3篇文章
 * - Advanced/Reference: 最旧的少量文章（至少2篇，最多3篇）
 * - Practical Guides: 中间的所有文章
 * 
 * 确保每篇文章只出现在一个分组中，避免重复
 */
function groupPostsByTime(posts: BlogPost[]): GroupedPosts {
  // 去重：基于 slug 去重，确保没有重复的文章
  const uniquePostsMap = new Map<string, BlogPost>()
  for (const post of posts) {
    if (!uniquePostsMap.has(post.slug)) {
      uniquePostsMap.set(post.slug, post)
    }
  }
  
  // 文章已经按时间倒序排列（最新的在前）
  const sortedPosts = Array.from(uniquePostsMap.values()).sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return dateB - dateA // 最新的在前
  })

  const total = sortedPosts.length

  // Getting Started: 最新的3篇
  const gettingStarted = sortedPosts.slice(0, 3)

  // Advanced/Reference: 最旧的文章（少量，至少2篇，最多3篇）
  // 如果总数 <= 5，不显示 Advanced/Reference
  // 如果总数 > 5，显示最旧的3篇
  let advancedReference: BlogPost[] = []
  let practicalGuides: BlogPost[] = []

  if (total <= 5) {
    // 文章太少，只显示 Getting Started 和 Practical Guides
    practicalGuides = sortedPosts.slice(3)
  } else {
    // 文章足够多，显示所有三个分组
    advancedReference = sortedPosts.slice(-3) // 最旧的3篇
    practicalGuides = sortedPosts.slice(3, -3) // 中间的所有文章
  }

  return {
    gettingStarted,
    practicalGuides,
    advancedReference,
  }
}

export function BlogGroupedList({ posts, totalPages }: BlogGroupedListProps) {
  const t = useTranslations()
  const router = useRouter()
  const grouped = groupPostsByTime(posts)

  const handleAllPostsClick = () => {
    router.push('/blog/page/2')
  }

  return (
    <div className="space-y-12">
      {/* Getting Started */}
      {grouped.gettingStarted.length > 0 && (
        <section>
          <h2 className="text-3xl font-bold text-foreground mb-6">
            {t('blog_group_getting_started')}
          </h2>
          <div className="grid gap-6">
            {grouped.gettingStarted.map((post) => (
              <BlogCard key={`getting-started-${post.slug}`} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* Practical Guides */}
      {grouped.practicalGuides.length > 0 && (
        <section>
          <h2 className="text-3xl font-bold text-foreground mb-6">
            {t('blog_group_practical_guides')}
          </h2>
          <div className="grid gap-6">
            {grouped.practicalGuides.map((post) => (
              <BlogCard key={`practical-${post.slug}`} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* Advanced / Reference */}
      {grouped.advancedReference.length > 0 && (
        <section>
          <h2 className="text-3xl font-bold text-foreground mb-6">
            {t('blog_group_advanced_reference')}
          </h2>
          <div className="grid gap-6">
            {grouped.advancedReference.map((post) => (
              <BlogCard key={`advanced-${post.slug}`} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* All posts 按钮 - 显示在最后一个分组下方 */}
      {totalPages > 1 && (
        <div className="mt-8 text-center">
          <Button
            onClick={handleAllPostsClick}
            variant="outline"
            size="lg"
            className="text-lg px-8 py-6"
          >
            {t('blog_all_posts')}
          </Button>
        </div>
      )}
    </div>
  )
}
