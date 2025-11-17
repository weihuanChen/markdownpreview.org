import { readItems, aggregate } from '@directus/sdk'
import { directus, SITE_ID, type DirectusPost, type PostTranslation, type Tag } from './directus'
import type { BlogPost, PaginatedPosts, Locale } from './types'

// 固定作者名称
const SITE_AUTHOR = 'markdownpreview.org'

// 默认分页大小
const PAGE_SIZE = 10

/**
 * 计算文章阅读时间（分钟）
 */
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200
  const wordCount = content.split(/\s+/).length
  return Math.ceil(wordCount / wordsPerMinute)
}

/**
 * 获取翻译后的标签名称
 */
async function getTranslatedTags(
  tagIds: number[],
  locale: Locale
): Promise<string[]> {
  if (!tagIds || tagIds.length === 0) return []

  try {
    const tags = await directus.request<Tag[]>(
      readItems('tags', {
        filter: {
          id: { _in: tagIds },
        },
        fields: ['id', 'name', 'slug', 'translations.*'],
      })
    )

    return tags.map((tag) => {
      // 如果有翻译，使用翻译后的名称
      const translation = tag.translations?.find(
        (t) => t.language_code === locale
      )
      return translation?.translated_name || tag.name
    })
  } catch (error) {
    console.error('Error fetching tags:', error)
    return []
  }
}

/**
 * 将 Directus 文章转换为 BlogPost
 */
async function transformDirectusPost(
  post: DirectusPost,
  translation: PostTranslation | undefined,
  locale: Locale
): Promise<BlogPost> {
  // 获取标签 IDs
  const tagIds = post.post_tags?.map((pt) => pt.tags_id) || []

  // 获取翻译后的标签
  const tags = await getTranslatedTags(tagIds, locale)

  // 使用翻译内容或原始内容
  const title = translation?.title || post.title
  const description = translation?.description || post.description
  const content = translation?.content || post.content

  return {
    slug: post.slug,
    title,
    description,
    date: post.published_at || post.date_created || new Date().toISOString(),
    author: SITE_AUTHOR,
    tags,
    content,
    readingTime: calculateReadingTime(content),
    locale,
    viewCount: post.view_count,
    uniqueViewCount: post.unique_view_count,
  }
}

/**
 * 获取分页的博客文章列表
 */
export async function getPaginatedPosts(
  locale: Locale,
  page: number = 1
): Promise<PaginatedPosts> {
  try {
    // 计算偏移量
    const offset = (page - 1) * PAGE_SIZE

    // 获取文章总数
    const totalResult = await directus.request(
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
    )

    const total = totalResult[0]?.count || 0
    const totalPages = Math.ceil(total / PAGE_SIZE)

    // 获取文章列表
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
          'post_tags.tags_id',
          'view_count',
          'unique_view_count',
        ],
        sort: ['-published_at'],
        limit: PAGE_SIZE,
        offset,
      })
    )

    // 获取翻译
    const postIds = posts.map((p) => p.id)
    const translations =
      postIds.length > 0
        ? await directus.request<PostTranslation[]>(
            readItems('post_translation', {
              filter: {
                post_id: { _in: postIds },
                language_code: { _eq: locale },
              },
              fields: ['post_id', 'title', 'description', 'content'],
            })
          )
        : []

    // 转换文章
    const blogPosts = await Promise.all(
      posts.map((post) => {
        const translation = translations.find((t) => t.post_id === post.id)
        return transformDirectusPost(post, translation, locale)
      })
    )

    return {
      posts: blogPosts,
      total,
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
 * 根据 slug 获取单篇文章
 */
export async function getPostBySlug(
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

    // 获取翻译
    const translations = await directus.request<PostTranslation[]>(
      readItems('post_translation', {
        filter: {
          post_id: { _eq: post.id },
          language_code: { _eq: locale },
        },
        fields: ['post_id', 'title', 'description', 'content'],
        limit: 1,
      })
    )

    const translation = translations[0]

    return transformDirectusPost(post, translation, locale)
  } catch (error) {
    console.error('Error fetching post by slug:', error)
    return null
  }
}

/**
 * 获取所有文章的 slugs（用于 generateStaticParams）
 */
export async function getAllPostSlugs(): Promise<string[]> {
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
    return []
  }
}
