import { readItems, aggregate } from '@directus/sdk'
import { directus, SITE_ID, type DirectusPost, type PostTranslation, type Tag } from './directus'
import { defaultLocale } from '@/i18n'
import type { BlogPost, PaginatedPosts, Locale } from './types'
import { unstable_cache } from 'next/cache'

// 固定作者名称
const SITE_AUTHOR = 'markdownpreview.org'

// 默认分页大小
const PAGE_SIZE = 10

const DIRECTUS_ASSET_BASE =
  (process.env.DIRECTUS_URL || 'https://directus.lzyinglian.com/').replace(/\/+$/, '')

/**
 * 计算文章阅读时间（分钟）
 */
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200
  const wordCount = content.split(/\s+/).length
  return Math.ceil(wordCount / wordsPerMinute)
}

/**
 * 批量获取翻译后的标签名称（优化：避免 N+1 查询）
 */
async function getTranslatedTagsBatch(
  allTagIds: number[],
  locale: Locale
): Promise<Map<number, string>> {
  if (!allTagIds || allTagIds.length === 0) return new Map()

  // 去重
  const uniqueTagIds = Array.from(new Set(allTagIds))

  try {
    const tags = await directus.request<Tag[]>(
      readItems('tags', {
        filter: {
          id: { _in: uniqueTagIds },
        },
        fields: ['id', 'name', 'slug', 'translations.*'],
      })
    )

    const tagMap = new Map<number, string>()
    tags.forEach((tag) => {
      // 如果有翻译，使用翻译后的名称
      const translation = tag.translations?.find(
        (t) => t.language_code === locale
      )
      tagMap.set(tag.id, translation?.translated_name || tag.name)
    })

    return tagMap
  } catch (error) {
    console.error('Error fetching tags:', error)
    return new Map()
  }
}

/**
 * 将 Directus 文章转换为 BlogPost（使用预加载的标签映射）
 */
function transformDirectusPost(
  post: DirectusPost,
  translation: PostTranslation | undefined,
  locale: Locale,
  tagMap: Map<number, string>
): BlogPost {
  // 获取标签 IDs
  const tagIds = post.post_tags?.map((pt) => pt.tags_id) || []

  // 从预加载的标签映射中获取标签名称
  const tags = tagIds.map((id) => tagMap.get(id)).filter((tag): tag is string => Boolean(tag))

  // 使用翻译内容或原始内容
  const title = translation?.title || post.title
  const description = translation?.description || post.description
  const content = translation?.content || post.content
  const publishedAt =
    post.published_at || post.date_created || new Date().toISOString()
  const image = post.image ? `${DIRECTUS_ASSET_BASE}/assets/${post.image}` : undefined
  const updatedAt = post.date_updated || post.published_at || post.date_created

  return {
    slug: post.slug,
    title,
    description,
    date: publishedAt,
    updatedAt,
    author: SITE_AUTHOR,
    tags,
    content,
    readingTime: calculateReadingTime(content),
    locale,
    image,
    viewCount: post.view_count,
    uniqueViewCount: post.unique_view_count,
  }
}

/**
 * 获取分页的博客文章列表（内部实现，无缓存）
 */
async function getPaginatedPostsInternal(
  locale: Locale,
  page: number = 1
): Promise<PaginatedPosts> {
  try {
    // 计算偏移量
    const offset = (page - 1) * PAGE_SIZE

    // 并行获取文章总数和文章列表
    const [totalResult, posts] = await Promise.all([
      directus.request(
        aggregate('posts', {
          aggregate: {
            count: '*',
          },
          query: {
            filter: {
              status: { _eq: 'published' },
              site_id: { _eq: SITE_ID },
            },
          },
        })
      ),
      directus.request<DirectusPost[]>(
        readItems('posts', {
          filter: {
            status: { _eq: 'published' },
            site_id: { _eq: SITE_ID },
          },
          fields: [
            'id',
            'slug',
            'title',
            'description',
            'content',
            'published_at',
            'date_created',
            'date_updated',
            'image',
            'post_tags.tags_id',
            'view_count',
            'unique_view_count',
          ],
          sort: ['-published_at'],
          limit: PAGE_SIZE,
          offset,
        })
      ),
    ])

    const total = totalResult[0]?.count || 0

    if (posts.length === 0) {
      return {
        posts: [],
        total: 0,
        page,
        pageSize: PAGE_SIZE,
        totalPages: 0,
      }
    }

    // 获取翻译和标签（并行执行）
    const postIds = posts.map((p) => p.id)
    const allTagIds = posts.flatMap((p) => p.post_tags?.map((pt) => pt.tags_id) || [])

    const [translations, tagMap] = await Promise.all([
      directus.request<PostTranslation[]>(
        readItems('post_translation', {
          filter: {
            post_id: { _in: postIds },
            language_code: { _eq: locale },
          },
          fields: ['post_id', 'title', 'description', 'content'],
        })
      ),
      getTranslatedTagsBatch(allTagIds, locale),
    ])

    const translationsMap = new Map(
      translations.map((translation) => [translation.post_id, translation])
    )

    // 对非默认语言，只展示已翻译的文章
    const filteredPosts =
      locale === defaultLocale
        ? posts
        : posts.filter((post) => translationsMap.has(post.id))

    // 转换文章（同步操作，无需 Promise.all）
    const blogPosts = filteredPosts.map((post) => {
      const translation = translationsMap.get(post.id)
      return transformDirectusPost(post, translation, locale, tagMap)
    })

    const totalForLocale = locale === defaultLocale ? total : filteredPosts.length
    const totalPages = Math.ceil(totalForLocale / PAGE_SIZE)

    return {
      posts: blogPosts,
      total: totalForLocale,
      page,
      pageSize: PAGE_SIZE,
      totalPages,
    }
  } catch (error) {
    console.error('Error fetching paginated posts:', error)
    return {
      posts: [],
      total: 0,
      page: 1,
      pageSize: PAGE_SIZE,
      totalPages: 0,
    }
  }
}

/**
 * 获取分页的博客文章列表（带缓存）
 */
export async function getPaginatedPosts(
  locale: Locale,
  page: number = 1
): Promise<PaginatedPosts> {
  // 如果禁用缓存，直接调用内部函数
  if (process.env.DISABLE_BLOG_CACHE === 'true') {
    return getPaginatedPostsInternal(locale, page)
  }

  const cached = unstable_cache(
    (loc: Locale, pg: number) => getPaginatedPostsInternal(loc, pg),
    ['blog-paginated-posts', locale, String(page), String(SITE_ID)],
    {
      revalidate: 43200, // 12 小时
      tags: ['blog-posts', `blog-posts:${locale}`, `blog-posts:${locale}:${page}`],
    }
  )

  return cached(locale, page)
}

/**
 * 获取所有博客文章（内部实现，无缓存）
 */
async function getAllPostsInternal(locale: Locale): Promise<BlogPost[]> {
  try {
    const posts = await directus.request<DirectusPost[]>(
      readItems('posts', {
        filter: {
          status: { _eq: 'published' },
          site_id: { _eq: SITE_ID },
        },
        fields: [
          'id',
          'slug',
          'title',
          'description',
          'content',
          'published_at',
          'date_created',
          'date_updated',
          'image',
          'post_tags.tags_id',
          'view_count',
          'unique_view_count',
        ],
        sort: ['-published_at'],
      })
    )

    if (posts.length === 0) {
      return []
    }

    // 获取翻译和标签（并行执行）
    const postIds = posts.map((p) => p.id)
    const allTagIds = posts.flatMap((p) => p.post_tags?.map((pt) => pt.tags_id) || [])

    const [translations, tagMap] = await Promise.all([
      directus.request<PostTranslation[]>(
        readItems('post_translation', {
          filter: {
            post_id: { _in: postIds },
            language_code: { _eq: locale },
          },
          fields: ['post_id', 'title', 'description', 'content'],
        })
      ),
      getTranslatedTagsBatch(allTagIds, locale),
    ])

    const translationsMap = new Map(
      translations.map((translation) => [translation.post_id, translation])
    )

    // 对非默认语言，只展示已翻译的文章
    const filteredPosts =
      locale === defaultLocale
        ? posts
        : posts.filter((post) => translationsMap.has(post.id))

    // 转换文章
    const blogPosts = filteredPosts.map((post) => {
      const translation = translationsMap.get(post.id)
      return transformDirectusPost(post, translation, locale, tagMap)
    })

    return blogPosts
  } catch (error) {
    console.error('Error fetching all posts:', error)
    return []
  }
}

/**
 * 获取所有博客文章（带缓存）
 */
export async function getAllPosts(locale: Locale): Promise<BlogPost[]> {
  // 如果禁用缓存，直接调用内部函数
  if (process.env.DISABLE_BLOG_CACHE === 'true') {
    return getAllPostsInternal(locale)
  }

  const cached = unstable_cache(
    (loc: Locale) => getAllPostsInternal(loc),
    ['blog-all-posts', locale, String(SITE_ID)],
    {
      revalidate: 43200, // 12 小时
      tags: ['blog-posts', `blog-posts:${locale}`],
    }
  )

  return cached(locale)
}

/**
 * 根据 slug 获取单篇文章（内部实现，无缓存）
 */
async function getPostBySlugInternal(
  slug: string,
  locale: Locale
): Promise<BlogPost | null> {
  try {
    const posts = await directus.request<DirectusPost[]>(
      readItems('posts', {
        filter: {
          slug: { _eq: slug },
          status: { _eq: 'published' },
          site_id: { _eq: SITE_ID },
        },
        fields: [
          'id',
          'slug',
          'title',
          'description',
          'content',
          'published_at',
          'date_created',
          'date_updated',
          'image',
          'post_tags.tags_id',
          'view_count',
          'unique_view_count',
        ],
        limit: 1,
      })
    )

    if (!posts || posts.length === 0) {
      return null
    }

    const post = posts[0]

    // 并行获取翻译和标签
    const tagIds = post.post_tags?.map((pt) => pt.tags_id) || []
    const [translations, tagMap] = await Promise.all([
      directus.request<PostTranslation[]>(
        readItems('post_translation', {
          filter: {
            post_id: { _eq: post.id },
            language_code: { _eq: locale },
          },
          fields: ['post_id', 'title', 'description', 'content'],
          limit: 1,
        })
      ),
      getTranslatedTagsBatch(tagIds, locale),
    ])

    const translation = translations[0]

    if (locale !== defaultLocale && !translation) {
      return null
    }

    return transformDirectusPost(post, translation, locale, tagMap)
  } catch (error) {
    console.error('Error fetching post by slug:', error)
    return null
  }
}

/**
 * 根据 slug 获取单篇文章（带缓存）
 */
export async function getPostBySlug(
  slug: string,
  locale: Locale
): Promise<BlogPost | null> {
  // 如果禁用缓存，直接调用内部函数
  if (process.env.DISABLE_BLOG_CACHE === 'true') {
    return getPostBySlugInternal(slug, locale)
  }

  const cached = unstable_cache(
    (sg: string, loc: Locale) => getPostBySlugInternal(sg, loc),
    ['blog-post-by-slug', slug, locale, String(SITE_ID)],
    {
      revalidate: 43200, // 12 小时
      tags: ['blog-posts', `blog-post:${slug}`, `blog-post:${slug}:${locale}`],
    }
  )

  return cached(slug, locale)
}

/**
 * 获取所有文章的 slugs（用于 generateStaticParams，带缓存和错误处理）
 */
export async function getAllPostSlugs(): Promise<string[]> {
  async function getAllPostSlugsInternal(): Promise<string[]> {
    try {
      const posts = await directus.request<DirectusPost[]>(
        readItems('posts', {
          filter: {
            status: { _eq: 'published' },
            site_id: { _eq: SITE_ID },
          },
          fields: ['slug'],
        })
      )

      return posts.map((post) => post.slug)
    } catch (error) {
      console.error('Error fetching post slugs:', error)
      // 返回空数组而不是抛出异常，避免构建失败
      return []
    }
  }

  // 如果禁用缓存，直接调用内部函数
  if (process.env.DISABLE_BLOG_CACHE === 'true') {
    return getAllPostSlugsInternal()
  }

  const cached = unstable_cache(
    () => getAllPostSlugsInternal(),
    ['blog-all-slugs', String(SITE_ID)],
    {
      revalidate: 86400, // 24 小时 - 静态生成用，长期缓存
      tags: ['blog-slugs', `blog-slugs:${SITE_ID}`],
    }
  )

  return cached()
}
