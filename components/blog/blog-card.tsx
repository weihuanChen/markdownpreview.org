import { Calendar, Clock, User, Tag } from 'lucide-react'
import { Link } from '@/navigation'
import type { BlogPost } from '@/lib/types'
import { useTranslations } from 'next-intl'

interface BlogCardProps {
  post: BlogPost
}

export function BlogCard({ post }: BlogCardProps) {
  const t = useTranslations()

  // 格式化日期
  const formattedDate = new Date(post.date).toLocaleDateString(post.locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <article className="group border border-border rounded-lg overflow-hidden bg-card hover:shadow-lg transition-all duration-300">
      <Link href={`/blog/${post.slug}`} className="block">
        <div className="p-6">
          {/* 标题 */}
          <h2 className="text-2xl font-semibold text-foreground mb-3 group-hover:text-[#0075de] transition-colors">
            {post.title}
          </h2>

          {/* 元信息 */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
            {/* 作者 */}
            <div className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              <span>{post.author}</span>
            </div>

            {/* 发布日期 */}
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <time dateTime={post.date}>{formattedDate}</time>
            </div>

            {/* 阅读时间 */}
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{post.readingTime} {t('blog_minutes')}</span>
            </div>
          </div>

          {/* 摘要 */}
          <p className="text-muted-foreground mb-4 line-clamp-3">
            {post.description}
          </p>

          {/* 标签 */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="h-4 w-4 text-muted-foreground" />
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </article>
  )
}
