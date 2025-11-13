# SEO 配置文档

## 概述

本文档说明项目的 SEO (搜索引擎优化) 配置，确保搜索引擎正确索引多语言内容，并优先收录日语版本。

## 配置目标

- ✅ **默认语言**: 日语（ja）作为主要语言
- ✅ **多语言支持**: 日语、英语、中文三种语言
- ✅ **Hreflang 标签**: 正确的语言替代标签
- ✅ **Canonical URL**: 规范化 URL 避免重复内容
- ✅ **Sitemap**: 动态生成所有语言版本的 sitemap
- ✅ **Open Graph**: 社交媒体分享优化
- ✅ **Twitter Card**: Twitter 分享卡片

## 配置文件

### 1. robots.txt (app/robots.ts)

动态生成 robots.txt 文件，指导搜索引擎爬虫。

```typescript
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://markdownpreview.org'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
```

**生成的 robots.txt**:
```
User-Agent: *
Allow: /
Disallow: /api/
Disallow: /_next/

Sitemap: https://markdownpreview.org/sitemap.xml
Host: https://markdownpreview.org
```

### 2. Sitemap (app/sitemap.ts)

动态生成 sitemap.xml，包含所有语言版本，日语页面优先级最高。

```typescript
import { MetadataRoute } from 'next'
import { locales, defaultLocale } from '@/i18n'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://markdownpreview.org'

  const localeUrls = locales.map((locale) => ({
    url: `${baseUrl}/${locale}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: locale === defaultLocale ? 1.0 : 0.8, // 日语优先级 1.0
    alternates: {
      languages: Object.fromEntries(
        locales.map((l) => [l, `${baseUrl}/${l}`])
      ),
    },
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1.0,
    },
    ...localeUrls,
  ]
}
```

**访问**: `https://markdownpreview.org/sitemap.xml`

### 3. Metadata 配置 (app/[locale]/layout.tsx)

在 `generateMetadata` 函数中配置完整的 SEO metadata。

#### 3.1 Canonical URL 和 Alternates

```typescript
alternates: {
  canonical: currentUrl, // 当前语言的规范 URL
  languages: {
    'ja': `${baseUrl}/ja`,
    'en': `${baseUrl}/en`,
    'zh': `${baseUrl}/zh`,
    'x-default': `${baseUrl}/ja`, // 默认使用日语
  },
}
```

**生成的 HTML 标签**:
```html
<link rel="canonical" href="https://markdownpreview.org/ja" />
<link rel="alternate" hreflang="ja" href="https://markdownpreview.org/ja" />
<link rel="alternate" hreflang="en" href="https://markdownpreview.org/en" />
<link rel="alternate" hreflang="zh" href="https://markdownpreview.org/zh" />
<link rel="alternate" hreflang="x-default" href="https://markdownpreview.org/ja" />
```

**说明**:
- `x-default` 指向日语版本，告诉搜索引擎当用户语言不匹配时显示日语版本
- 每个页面都有 canonical URL，避免重复内容惩罚

#### 3.2 Open Graph

用于社交媒体（Facebook、LinkedIn 等）分享时的展示。

```typescript
openGraph: {
  title,
  description,
  url: currentUrl,
  siteName: 'Markdown Preview 道場',
  locale: locale === 'zh' ? 'zh_CN' : locale === 'en' ? 'en_US' : 'ja_JP',
  type: 'website',
  images: [
    {
      url: `${baseUrl}/og-image.png`,
      width: 1200,
      height: 630,
      alt: title,
    },
  ],
}
```

**生成的 HTML 标签**:
```html
<meta property="og:title" content="Markdown Preview 道場 - Markdown を学ぶ" />
<meta property="og:description" content="高性能でリアルタイム..." />
<meta property="og:url" content="https://markdownpreview.org/ja" />
<meta property="og:site_name" content="Markdown Preview 道場" />
<meta property="og:locale" content="ja_JP" />
<meta property="og:type" content="website" />
<meta property="og:image" content="https://markdownpreview.org/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

**OG 图片要求**:
- 尺寸: 1200x630 像素
- 格式: PNG 或 JPG
- 位置: `public/og-image.png`

#### 3.3 Twitter Card

专门用于 Twitter 分享。

```typescript
twitter: {
  card: 'summary_large_image',
  title,
  description,
  images: [`${baseUrl}/og-image.png`],
  creator: '@markdowndojo',
  site: '@markdowndojo',
}
```

**生成的 HTML 标签**:
```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Markdown Preview 道場..." />
<meta name="twitter:description" content="高性能でリアルタイム..." />
<meta name="twitter:image" content="https://markdownpreview.org/og-image.png" />
<meta name="twitter:creator" content="@markdowndojo" />
<meta name="twitter:site" content="@markdowndojo" />
```

#### 3.4 Robots Meta 标签

控制搜索引擎如何索引页面。

```typescript
robots: {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    'max-video-preview': -1,
    'max-image-preview': 'large',
    'max-snippet': -1,
  },
}
```

**生成的 HTML 标签**:
```html
<meta name="robots" content="index, follow" />
<meta name="googlebot" content="index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1" />
```

## URL 结构

### 路由配置

```
/          → 重定向到 /ja (307)
/ja        → 日语首页 (优先级 1.0)
/en        → 英语首页 (优先级 0.8)
/zh        → 中文首页 (优先级 0.8)
```

### 重定向策略

- 用户访问根路径 `/` 时，自动重定向到 `/ja`
- 重定向类型：307 Temporary Redirect
- Cookie 存储：`NEXT_LOCALE=ja`

## 环境变量

### NEXT_PUBLIC_SITE_URL

设置网站的基础 URL，用于生成绝对路径。

**.env.local** (本地开发):
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**.env.production** (生产环境):
```env
NEXT_PUBLIC_SITE_URL=https://markdownpreview.org
```

**重要**: 没有设置时默认为 `https://markdownpreview.org`

## SEO 最佳实践

### 1. 语言优先级

- 日语（ja）: priority 1.0
- 英语（en）: priority 0.8
- 中文（zh）: priority 0.8

### 2. Hreflang 实施

每个页面都包含所有语言版本的 hreflang 标签：
- 帮助搜索引擎理解内容的语言关系
- `x-default` 指向日语版本（默认语言）
- 避免重复内容问题

### 3. 结构化数据（待实现）

可以考虑添加 JSON-LD 结构化数据：
```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Markdown Preview 道場",
  "description": "...",
  "url": "https://markdownpreview.org",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Any"
}
```

## 验证和测试

### 1. Robots.txt

访问: `http://localhost:3000/robots.txt`

验证内容是否正确生成。

### 2. Sitemap.xml

访问: `http://localhost:3000/sitemap.xml`

检查所有 URL 是否包含，优先级是否正确。

### 3. Meta 标签

使用浏览器开发者工具检查 `<head>` 中的标签：
```bash
curl -s http://localhost:3000/ja | grep -E "(canonical|alternate|og:|twitter:)"
```

### 4. 在线工具

- **Google Rich Results Test**: https://search.google.com/test/rich-results
- **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
- **Twitter Card Validator**: https://cards-dev.twitter.com/validator
- **Hreflang Tags Testing Tool**: https://www.aleydasolis.com/english/international-seo-tools/hreflang-tags-generator/

## Google Search Console 配置

### 1. 国际定位

- 在 Google Search Console 中添加所有语言版本作为属性
- 设置地理位置定位（如果适用）

### 2. Sitemap 提交

提交 sitemap.xml 到 Google Search Console:
```
https://markdownpreview.org/sitemap.xml
```

### 3. URL 检查

定期检查每个语言版本的索引状态。

## 常见问题

### Q: 为什么根路径重定向到 /ja 而不是根据用户语言？

A: 为了 SEO 明确性。重定向到固定的默认语言（日语）可以确保搜索引擎明确知道默认内容，避免混淆。用户可以通过语言切换器选择其他语言。

### Q: x-default 应该指向哪里？

A: 指向默认语言（日语 /ja）。这告诉搜索引擎当用户的语言偏好不匹配任何现有语言时，应该显示哪个版本。

### Q: 是否需要为每个页面创建 sitemap？

A: 目前只有首页，一个 sitemap.xml 就足够了。如果将来添加更多页面（如 /about, /guide），需要在 sitemap.ts 中添加这些路由。

### Q: OG 图片需要为每种语言创建不同版本吗？

A: 理想情况下是的。但如果资源有限，可以使用一个通用图片。建议至少为日语版本创建专门的图片。

## 相关文档

- [i18n 技术实施文档](./i18n-implementation.md)
- [多语言文案管理](../product/i18n-content.md)
- [项目文档索引](../index.md)

---

**最后更新**: 2025-11-13
**维护者**: 开发团队
