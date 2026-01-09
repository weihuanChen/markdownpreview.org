import { MetadataRoute } from 'next'
import { readItems } from '@directus/sdk'
import { locales, defaultLocale, type Locale } from '@/i18n'
import { directus, SITE_ID } from '@/lib/directus'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://markdownpreview.org'
  const now = new Date()

  // 获取所有文章的 slug 以及已有翻译语言（仅保留在 locales 中的语言）
  // 使用分页方式获取所有文章，避免 limit: -1 可能不被支持的问题
  let rawPosts: Array<{ slug: string; post_translation?: Array<{ language_code: Locale }> }> = []
  let page = 1
  const pageSize = 100

  while (true) {
    const posts = await directus.request<
      Array<{ slug: string; post_translation?: Array<{ language_code: Locale }> }>
    >(
      readItems('posts', {
        limit: pageSize,
        page,
        filter: {
          status: { _eq: 'published' },
          site_id: { _eq: SITE_ID },
        },
        fields: ['slug', 'post_translation.language_code'],
      })
    )

    if (posts.length === 0) {
      break
    }

    rawPosts = [...rawPosts, ...posts]

    // 如果返回的文章数量少于 pageSize，说明已经是最后一页
    if (posts.length < pageSize) {
      break
    }

    page++
  }

  const postsWithLocales = rawPosts.map((post) => {
    const translations = (post.post_translation || [])
      .map((t) => t.language_code)
      .filter((lang): lang is Locale => locales.includes(lang))
    const availableLocales = Array.from(new Set<Locale>([defaultLocale, ...translations]))
    return { slug: post.slug, locales: availableLocales }
  })

  // 首页：始终包含所有支持语言
  const homeLocales = locales

  // 博客：仅包含已有内容的语言（默认语言始终保留）
  const blogLocales = locales.filter(
    (locale) =>
      locale === defaultLocale ||
      postsWithLocales.some((post) => post.locales.includes(locale))
  )

  // 工具页：所有支持的语言都提供入口
  const toolLocales = locales

  const buildPath = (locale: string, path: string = '') =>
    locale === defaultLocale ? path : `/${locale}${path}`

  const buildAlternates = (langs: readonly Locale[], path: string = '') => ({
    languages: Object.fromEntries(
      langs.map((locale) => [locale, `${baseUrl}${buildPath(locale, path)}`])
    ),
  })

  // 为每种语言生成首页 URL
  const localeUrls = homeLocales.map((locale) => ({
    url: `${baseUrl}${buildPath(locale)}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: locale === defaultLocale ? 1.0 : 0.8, // 日语优先级最高
    alternates: buildAlternates(homeLocales, ''),
  }))

  // 为每种语言生成博客列表页 URL
  const blogListUrls = blogLocales.map((locale) => ({
    url: `${baseUrl}${buildPath(locale, '/blog')}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
    alternates: buildAlternates(blogLocales, '/blog'),
  }))

  // 为每篇文章的每种语言生成 URL
  const blogPostUrls = postsWithLocales.flatMap(({ slug, locales: availableLocales }) =>
    availableLocales.map((locale) => ({
      url: `${baseUrl}${buildPath(locale, `/blog/${slug}`)}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      alternates: buildAlternates(availableLocales, `/blog/${slug}`),
    }))
  )

  // 工具页：formatter
  const formatterUrls = toolLocales.map((locale) => ({
    url: `${baseUrl}${buildPath(locale, '/formatter')}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.85,
    alternates: buildAlternates(toolLocales, '/formatter'),
  }))

  // 工具页：diff
  const diffUrls = toolLocales.map((locale) => ({
    url: `${baseUrl}${buildPath(locale, '/diff')}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.85,
    alternates: buildAlternates(toolLocales, '/diff'),
  }))

  return [
    ...localeUrls,
    ...blogListUrls,
    ...blogPostUrls,
    ...formatterUrls,
    ...diffUrls,
  ]
}
