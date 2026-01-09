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
    <article className="group relative h-full overflow-hidden rounded-xl border border-border/70 bg-card shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_-28px_rgba(15,23,42,0.45)]">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--brand-blue)]/6 via-transparent to-accent/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <Link href={`/blog/${post.slug}`} className="flex h-full flex-col">
        <div className="flex h-full flex-col p-6">
          <div className="mb-3 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.08em] text-muted-foreground/80">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 font-semibold text-foreground/80 shadow-sm">
              <Clock className="h-3.5 w-3.5" />
              {post.readingTime} {t('blog_minutes')}
            </span>
            <span className="inline-flex items-center gap-1 text-foreground/70">
              <Calendar className="h-3.5 w-3.5" />
              <time dateTime={post.date}>{formattedDate}</time>
            </span>
            <span className="inline-flex items-center gap-1 text-foreground/70">
              <User className="h-3.5 w-3.5" />
              {post.author}
            </span>
          </div>

          {/* 标题 */}
          <h2 className="mb-3 text-2xl font-semibold leading-tight text-foreground line-clamp-2 transition-colors duration-300 group-hover:text-[var(--brand-blue)]">
            {post.title}
          </h2>

          {/* 摘要 */}
          <p className="mb-4 text-base text-muted-foreground line-clamp-3">
            {post.description}
          </p>

          {/* 标签 */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-auto flex flex-wrap items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="rounded-full border border-border/70 bg-muted px-2.5 py-1 text-xs font-medium text-foreground line-clamp-1"
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
