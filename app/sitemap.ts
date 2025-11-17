import { MetadataRoute } from 'next'
import { locales, defaultLocale } from '@/i18n'
import { getAllPostSlugs } from '@/lib/cms-blog'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://markdownpreview.org'

  // 为每种语言生成首页 URL
  const localeUrls = locales.map((locale) => ({
    url: `${baseUrl}/${locale}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: locale === defaultLocale ? 1.0 : 0.8, // 日语优先级最高
    alternates: {
      languages: Object.fromEntries(
        locales.map((l) => [l, `${baseUrl}/${l}`])
      ),
    },
  }))

  // 为每种语言生成博客列表页 URL
  const blogListUrls = locales.map((locale) => ({
    url: `${baseUrl}/${locale}/blog`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
    alternates: {
      languages: Object.fromEntries(
        locales.map((l) => [l, `${baseUrl}/${l}/blog`])
      ),
    },
  }))

  // 获取所有博客文章的 slugs
  const postSlugs = await getAllPostSlugs()

  // 为每篇文章的每种语言生成 URL
  const blogPostUrls = postSlugs.flatMap((slug) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}/blog/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${baseUrl}/${l}/blog/${slug}`])
        ),
      },
    }))
  )

  return [
    // 根路径重定向到默认语言
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1.0,
    },
    ...localeUrls,
    ...blogListUrls,
    ...blogPostUrls,
  ]
}
