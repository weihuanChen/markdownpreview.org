import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://markdownpreview.org'

  // 编译产物与静态资源不需要被搜索引擎抓取
  const disallowPaths = [
    '/api/',
    '/_next/',
    '/_next/static/',
    '/_next/image/',
    '/_next/data/',
  ]

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: disallowPaths,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    // 指定首选语言版本的主机
    host: baseUrl,
  }
}
