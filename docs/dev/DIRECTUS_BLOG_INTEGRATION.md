# Directus Blog 标准化接入指南

**文档版本**: 1.0  
**最后更新**: 2025-01-XX  
**用途**: 新网站接入 Directus Blog 系统的完整指南

---

## 📋 概述

本文档提供新网站接入 Directus Blog 系统的完整步骤，包括环境配置、代码集成、最佳实践等。遵循此指南可确保新网站使用与现有系统相同的标准化实现。

---

## 🎯 接入前提

### 必需条件

1. ✅ Directus 实例已配置好 Blog 相关表结构
2. ✅ 已获得 Directus API Token（有读取权限）
3. ✅ 已确定 Site ID（多站点支持）
4. ✅ Next.js 项目已初始化

### 参考文档

在开始之前，请先阅读以下文档：

- [Directus Blog 表结构文档](./DIRECTUS_BLOG_SCHEMA.md)
- [Directus Blog 查询逻辑文档](./DIRECTUS_BLOG_QUERY.md)
- [Tags 系统完整文档](./DIRECTUS_BLOG_TAGS.md)
- [优化方案文档](./DIRECTUS_BLOG_OPTIMIZATION.md)

---

## 📦 第一步：安装依赖

### 1.1 安装 Directus SDK

```bash
npm install @directus/sdk
# 或
pnpm add @directus/sdk
# 或
yarn add @directus/sdk
```

### 1.2 安装其他依赖（如需要）

```bash
# 如果使用 markdown 处理
npm install remark remark-html remark-gfm
```

---

## 🔧 第二步：环境变量配置

### 2.1 创建 `.env.local` 文件

```bash
# Directus 配置
DIRECTUS_URL=https://directus.lzyinglian.com/
DIRECTUS_TOKEN=your-directus-token-here

# 站点配置
NEXT_PUBLIC_SITE_ID=5

# 可选：缓存调试
# DISABLE_BLOG_CACHE=true
```

### 2.2 环境变量说明

| 变量名 | 必填 | 说明 | 示例 |
|--------|------|------|------|
| `DIRECTUS_URL` | ✅ | Directus 实例 URL | `https://directus.lzyinglian.com/` |
| `DIRECTUS_TOKEN` | ✅ | Directus API Token | `your-token-here` |
| `NEXT_PUBLIC_SITE_ID` | ✅ | 站点 ID（多站点支持） | `5` |
| `DISABLE_BLOG_CACHE` | ❌ | 禁用缓存（仅调试用） | `true` |

---

## 📁 第三步：创建核心文件

### 3.1 创建 Directus 客户端

**文件**: `lib/directus.ts`

```typescript
import { createDirectus, rest, staticToken } from '@directus/sdk'

// Directus Collections Schema
export interface Tag {
  id: number
  name: string
  slug: string
  translations?: TagTranslation[]
}

export interface TagTranslation {
  id: number
  tag_id: number
  language_code: 'en' | 'ja' | 'zh' | 'es'
  translated_name: string
}

export interface DirectusPost {
  id: string
  slug: string
  title: string
  description: string
  content: string
  published_at: string
  site_id: number
  status: 'draft' | 'published' | 'archived'
  post_tags?: Array<{ tags_id: number }>
  post_recommend?: string[]
  image?: string
  date_created?: string
  date_updated?: string
  view_count?: number
  unique_view_count?: number
  last_viewed_at?: string
}

export interface PostTranslation {
  id: number
  post_id: string
  language_code: 'en' | 'zh' | 'es'
  title: string
  description: string
  content: string
  tags?: string[]
  date_created?: string
  date_updated?: string
}

export interface Site {
  id: number
  site_name: string
  domain: string
  date_created?: string
  date_updated?: string
}

// Combined schema type
export interface DirectusSchema {
  posts: DirectusPost[]
  post_translation: PostTranslation[]
  sites: Site[]
  tags: Tag[]
  tags_translation: TagTranslation[]
}

// Create Directus client
const directusUrl = process.env.DIRECTUS_URL || 'https://directus.lzyinglian.com/'
const directusToken = process.env.DIRECTUS_TOKEN || ''

export const directus = createDirectus<DirectusSchema>(directusUrl)
  .with(staticToken(directusToken))
  .with(rest())

// Export site ID from environment
export const SITE_ID = parseInt(process.env.NEXT_PUBLIC_SITE_ID || '3', 10)
```

### 3.2 创建类型定义

**文件**: `lib/types.ts`

```typescript
export type Locale = 'ja' | 'en' | 'zh'

export interface FAQItem {
  question: string
  answer: string
}

export interface TagInfo {
  name: string
  slug: string
}

export interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  author: string
  tags: string[]
  tagDetails?: TagInfo[]
  content: string
  readingTime: number
  locale: Locale
  faq?: FAQItem[]
  viewCount?: number
  uniqueViewCount?: number
}
```

### 3.3 复制 Blog 查询函数

**文件**: `lib/cms-blog.ts`

> **注意**: 请从现有项目复制完整的 `lib/cms-blog.ts` 文件，包含所有查询函数和优化逻辑。

关键函数包括：
- `getAllPostsFromCMS`
- `getPostBySlugFromCMS`
- `getPostDetailDataFromCMS` (优化版)
- `getRelatedPostsFromCMS`
- `getAllTagsFromCMS`
- `getPostsByTagFromCMS`
- `getTagPageDataFromCMS` (优化版)
- `getRelatedTagsFromCMS`
- `getAllPostSlugsFromCMS`
- `getAllTagSlugsFromCMS`

---

## 🎨 第四步：创建页面组件

### 4.1 博客列表页

**文件**: `app/[locale]/blog/page.tsx`

```typescript
import { getAllPostsFromCMS } from '@/lib/cms-blog'
import { type Locale } from '@/lib/i18n'

export const revalidate = 43200 // 12 小时

export default async function BlogPage({
  params,
}: {
  params: { locale: Locale }
}) {
  const posts = await getAllPostsFromCMS(params.locale)

  return (
    <div>
      <h1>Blog</h1>
      <ul>
        {posts.map((post) => (
          <li key={post.slug}>
            <a href={`/${params.locale}/blog/${post.slug}`}>
              {post.title}
            </a>
            <p>{post.description}</p>
            <div>
              {post.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### 4.2 文章详情页

**文件**: `app/[locale]/blog/[slug]/page.tsx`

```typescript
import { getPostDetailDataFromCMS } from '@/lib/cms-blog'
import { type Locale } from '@/lib/i18n'
import { notFound } from 'next/navigation'

export const revalidate = 43200 // 12 小时

export async function generateStaticParams() {
  const slugs = await getAllPostSlugsFromCMS()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string; locale: Locale }
}) {
  const { post } = await getPostDetailDataFromCMS(params.slug, params.locale)
  
  if (!post) {
    return {}
  }

  return {
    title: post.title,
    description: post.description,
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string; locale: Locale }
}) {
  const { post, relatedPosts } = await getPostDetailDataFromCMS(
    params.slug,
    params.locale
  )

  if (!post) {
    notFound()
  }

  return (
    <div>
      <h1>{post.title}</h1>
      <p>{post.description}</p>
      <div>
        {post.tagDetails?.map((tag) => (
          <a key={tag.slug} href={`/${params.locale}/blog/tag/${tag.slug}`}>
            {tag.name}
          </a>
        ))}
      </div>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
      
      <h2>相关文章</h2>
      <ul>
        {relatedPosts.map((related) => (
          <li key={related.slug}>
            <a href={`/${params.locale}/blog/${related.slug}`}>
              {related.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### 4.3 标签页

**文件**: `app/[locale]/blog/tag/[slug]/page.tsx`

```typescript
import { getTagPageDataFromCMS } from '@/lib/cms-blog'
import { type Locale } from '@/lib/i18n'
import { notFound } from 'next/navigation'

export const revalidate = 43200 // 12 小时

export async function generateStaticParams() {
  const tagSlugs = await getAllTagSlugsFromCMS()
  return tagSlugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string; locale: Locale }
}) {
  const { currentTag } = await getTagPageDataFromCMS(
    params.slug,
    params.locale
  )

  if (!currentTag) {
    return {}
  }

  return {
    title: `${currentTag.name} - Blog`,
    description: `所有关于 ${currentTag.name} 的文章`,
  }
}

export default async function TagPage({
  params,
}: {
  params: { slug: string; locale: Locale }
}) {
  const { posts, allTags, currentTag, relatedTags } = await getTagPageDataFromCMS(
    params.slug,
    params.locale
  )

  if (!currentTag) {
    notFound()
  }

  return (
    <div>
      <h1>{currentTag.name}</h1>
      <p>共 {posts.length} 篇文章</p>
      
      <h2>文章列表</h2>
      <ul>
        {posts.map((post) => (
          <li key={post.slug}>
            <a href={`/${params.locale}/blog/${post.slug}`}>
              {post.title}
            </a>
          </li>
        ))}
      </ul>

      <h2>所有标签</h2>
      <ul>
        {allTags.map((tag) => (
          <li key={tag.slug}>
            <a href={`/${params.locale}/blog/tag/${tag.slug}`}>
              {tag.name} ({tag.postCount})
            </a>
          </li>
        ))}
      </ul>

      <h2>相关标签</h2>
      <ul>
        {relatedTags.map((tag) => (
          <li key={tag.slug}>
            <a href={`/${params.locale}/blog/tag/${tag.slug}`}>
              {tag.name} ({tag.postCount})
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

---

## 🔄 第五步：配置缓存清除 API

### 5.1 创建 Revalidate API 路由

**文件**: `app/api/revalidate/route.ts`

```typescript
import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { slug, tag } = await request.json()

    if (slug) {
      // 清除文章相关缓存
      revalidateTag(`post:${slug}`)
      revalidateTag(`post-detail:${slug}`)
      revalidateTag(`related:${slug}`)
    }

    if (tag) {
      // 清除标签相关缓存
      revalidateTag(`tag:${tag}`)
      revalidateTag(`tag-page:${tag}`)
    }

    // 清除所有缓存
    revalidateTag('posts')
    revalidateTag('tags')

    return NextResponse.json({ revalidated: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error revalidating' },
      { status: 500 }
    )
  }
}
```

### 5.2 配置 Webhook（可选）

在 Directus 中配置 Webhook，当文章发布/更新时自动调用此 API：

```
POST https://your-domain.com/api/revalidate
Content-Type: application/json

{
  "slug": "article-slug"
}
```

---

## ✅ 第六步：验证接入

### 6.1 检查清单

- [ ] 环境变量已配置
- [ ] Directus 客户端已创建
- [ ] 所有查询函数已复制
- [ ] 页面组件已创建
- [ ] ISR 配置已设置
- [ ] 缓存清除 API 已配置

### 6.2 测试步骤

1. **测试博客列表页**:
   ```bash
   curl http://localhost:3000/ja/blog
   ```
   应该返回文章列表

2. **测试文章详情页**:
   ```bash
   curl http://localhost:3000/ja/blog/your-article-slug
   ```
   应该返回文章详情

3. **测试标签页**:
   ```bash
   curl http://localhost:3000/ja/blog/tag/your-tag-slug
   ```
   应该返回标签页内容

4. **检查缓存**:
   - 第一次访问应该较慢（缓存未命中）
   - 第二次访问应该很快（缓存命中）

---

## 🎯 最佳实践

### 1. 使用合并查询函数

**✅ 推荐**:
```typescript
// 文章详情页
const { post, relatedPosts } = await getPostDetailDataFromCMS(slug, locale)

// 标签页
const { posts, allTags, currentTag, relatedTags } = await getTagPageDataFromCMS(tagSlug, locale)
```

**❌ 不推荐**:
```typescript
// 多个独立查询
const post = await getPostBySlugFromCMS(slug, locale)
const relatedPosts = await getRelatedPostsFromCMS(slug, locale)
```

### 2. 正确设置 ISR 时间

```typescript
// 与数据缓存时间保持一致
export const revalidate = 43200 // 12 小时
```

### 3. 使用缓存标签

确保所有查询函数都设置了正确的缓存标签，以便按需清除。

### 4. 站点隔离

所有查询必须包含 `site_id` 过滤：

```typescript
filter: {
  status: { _eq: 'published' },
  ...(siteId ? { site_id: { _eq: siteId } } : {}),
}
```

### 5. 错误处理

所有查询函数都应包含错误处理：

```typescript
try {
  // 查询逻辑
} catch (error) {
  console.error('Error:', error)
  return [] // 或 null
}
```

---

## 🐛 常见问题

### Q1: 查询返回空数组

**可能原因**:
- `site_id` 不匹配
- `status` 不是 `'published'`
- Directus 权限配置问题

**解决方案**:
1. 检查 `NEXT_PUBLIC_SITE_ID` 是否正确
2. 确认文章状态为 `published`
3. 检查 Directus Public Role 权限

### Q2: Tags 不显示

**可能原因**:
- M2M 关系未正确配置
- `post_tags` 字段为空

**解决方案**:
1. 检查 Directus 中 `post_tags` M2M 关系配置
2. 确认文章已关联标签
3. 检查 `getTranslatedTags` 函数是否正确处理 M2M 结构

### Q3: 翻译内容不显示

**可能原因**:
- `post_translation` 表中没有对应语言的翻译
- 语言代码不匹配

**解决方案**:
1. 检查 `post_translation` 表中是否有对应语言的翻译
2. 确认 `locale` 参数正确（`en`, `zh`, `es`）

### Q4: 缓存不生效

**可能原因**:
- `DISABLE_BLOG_CACHE=true` 已设置
- 缓存标签配置错误

**解决方案**:
1. 检查 `.env.local` 中是否有 `DISABLE_BLOG_CACHE=true`
2. 确认缓存标签配置正确

---

## 📚 相关文档

- [Directus Blog 表结构文档](./DIRECTUS_BLOG_SCHEMA.md)
- [Directus Blog 查询逻辑文档](./DIRECTUS_BLOG_QUERY.md)
- [Tags 系统完整文档](./DIRECTUS_BLOG_TAGS.md)
- [优化方案文档](./DIRECTUS_BLOG_OPTIMIZATION.md)

---

## 🔄 更新维护

### 定期检查

- [ ] 缓存命中率是否正常（> 80%）
- [ ] API 调用数是否异常
- [ ] 响应时间是否稳定
- [ ] 错误日志是否有异常

### 版本更新

当 Directus SDK 或查询逻辑有更新时：
1. 更新依赖版本
2. 检查是否有 breaking changes
3. 更新相关代码
4. 测试所有功能

---

**文档维护**: 本文档应与代码实现保持同步。如有变更，请及时更新。

