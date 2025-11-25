import { getPostBySlug, getAllPostSlugs } from '@/lib/cms-blog'
import type { Locale } from '@/lib/types'
import { MarkdownPreview } from '@/components/markdown-preview'
import { Toc } from '@/components/blog/toc'
import { BlogCTA } from '@/components/blog/blog-cta'
import { Calendar, Clock, User, Tag, ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/navigation'
import { Button } from '@/components/ui/button'
import { defaultLocale } from '@/i18n'

export const revalidate = 43200 // 12 小时

interface BlogPostPageProps {
  params: { slug: string; locale: Locale }
}

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const resolvedParams = await params
  const post = await getPostBySlug(resolvedParams.slug, resolvedParams.locale)

  if (!post) {
    return {}
  }

  return {
    title: post.title,
    description: post.description,
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const resolvedParams = await params
  const post = await getPostBySlug(resolvedParams.slug, resolvedParams.locale)

  if (!post) {
    notFound()
  }

  const t = await getTranslations()

  // 格式化日期
  const formattedDate = new Date(post.date).toLocaleDateString(resolvedParams.locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://markdownpreview.org'
  const isDefaultLocale = resolvedParams.locale === defaultLocale
  const articleUrl = `${siteUrl}${isDefaultLocale ? '' : `/${resolvedParams.locale}`}/blog/${post.slug}`
  const imageUrl = post.image || `${siteUrl}/android-chrome-512x512.png`
  const datePublished = new Date(post.date).toISOString()
  const dateModified = new Date(post.updatedAt || post.date).toISOString()

  const jsonLdGraph: Record<string, unknown>[] = [
    {
      '@type': 'Article',
      '@id': `${articleUrl}#article`,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': articleUrl,
      },
      headline: post.title,
      image: imageUrl,
      datePublished,
      dateModified,
      author: {
        '@type': 'Person',
        name: post.author,
      },
      publisher: {
        '@type': 'Organization',
        name: 'markdownpreview.org',
        logo: {
          '@type': 'ImageObject',
          url: `${siteUrl}/android-chrome-512x512.png`,
          width: 512,
          height: 512,
        },
      },
      description: post.description,
      keywords: post.tags && post.tags.length > 0 ? post.tags.join(', ') : undefined,
      inLanguage: resolvedParams.locale,
      url: articleUrl,
    },
  ]

  if (post.faq && post.faq.length > 0) {
    jsonLdGraph.push({
      '@type': 'FAQPage',
      mainEntity: post.faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    })
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': jsonLdGraph,
  }

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/blog" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t('blog_title')}
            </Link>
          </Button>

          <h1 className="text-4xl font-bold text-foreground mb-4">
            {post.title}
          </h1>

          {/* 元信息 */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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

          {/* 标签 */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mt-4">
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
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-8">
          {/* 主内容区 */}
          <article className="min-w-0">
            {/* 摘要（Blockquote 样式） */}
            <blockquote className="border-l-4 border-[#0075de] bg-muted/50 p-6 mb-8 rounded-r-lg">
              <p className="text-lg text-foreground italic">
                <strong className="text-[#0075de] not-italic">{t('blog_summary')}: </strong>
                {post.description}
              </p>
            </blockquote>

            {/* 正文内容 */}
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <MarkdownPreview content={post.content} />
            </div>

            {/* CTA - 引导用户试用编辑器 */}
            <BlogCTA />
          </article>

          {/* 侧边栏 - 目录 */}
          <aside className="hidden lg:block">
            <Toc content={post.content} />
          </aside>
        </div>
      </main>
    </div>
  )
}
