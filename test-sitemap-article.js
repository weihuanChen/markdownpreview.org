// 测试特定文章是否会被包含在 sitemap 中
require('dotenv').config({ path: '.env.local' })
const { createDirectus, rest, staticToken, readItems } = require('@directus/sdk')

const directusUrl = process.env.DIRECTUS_URL
const directusToken = process.env.DIRECTUS_TOKEN
const siteId = parseInt(process.env.NEXT_PUBLIC_SITE_ID || '3', 10)
const targetSlug = 'markdown-vs-html-differences'

console.log('===== 检查文章在 sitemap 中的收录情况 =====')
console.log('目标文章 slug:', targetSlug)
console.log('Site ID:', siteId)
console.log('')

async function checkArticle() {
  try {
    const client = createDirectus(directusUrl)
      .with(staticToken(directusToken))
      .with(rest())

    // 1. 检查文章是否存在（无过滤）
    console.log('===== 步骤 1: 检查文章是否存在 =====')
    try {
      const posts = await client.request(
        readItems('posts', {
          filter: {
            slug: { _eq: targetSlug },
          },
          fields: ['id', 'slug', 'title', 'status', 'site_id', 'published_at'],
        })
      )
      
      if (posts.length === 0) {
        console.log('❌ 文章不存在！')
        return
      }
      
      const post = posts[0]
      console.log('✅ 文章存在:')
      console.log(`  - ID: ${post.id}`)
      console.log(`  - 标题: ${post.title}`)
      console.log(`  - Slug: ${post.slug}`)
      console.log(`  - 状态: ${post.status}`)
      console.log(`  - Site ID: ${post.site_id}`)
      console.log(`  - 发布时间: ${post.published_at || 'N/A'}`)
      console.log('')
      
      // 2. 检查是否符合 sitemap 查询条件
      console.log('===== 步骤 2: 检查是否符合 sitemap 查询条件 =====')
      const statusMatch = post.status === 'published'
      const siteIdMatch = post.site_id === siteId
      
      console.log(`  - 状态检查: ${post.status} === 'published' ? ${statusMatch ? '✅' : '❌'}`)
      console.log(`  - Site ID 检查: ${post.site_id} === ${siteId} ? ${siteIdMatch ? '✅' : '❌'}`)
      
      if (!statusMatch) {
        console.log('❌ 文章状态不是 "published"，不会被包含在 sitemap 中')
      }
      if (!siteIdMatch) {
        console.log(`❌ 文章 site_id (${post.site_id}) 不匹配配置的 SITE_ID (${siteId})，不会被包含在 sitemap 中`)
      }
      console.log('')
      
      // 3. 使用 sitemap 的查询条件检查
      console.log('===== 步骤 3: 使用 sitemap 查询条件检查 =====')
      try {
        const sitemapPosts = await client.request(
          readItems('posts', {
            limit: -1,
            filter: {
              status: { _eq: 'published' },
              site_id: { _eq: siteId },
            },
            fields: ['slug', 'post_translation.language_code'],
          })
        )
        
        const foundInSitemap = sitemapPosts.some(p => p.slug === targetSlug)
        console.log(`sitemap 查询找到 ${sitemapPosts.length} 篇文章`)
        console.log(`目标文章是否在结果中: ${foundInSitemap ? '✅ 是' : '❌ 否'}`)
        
        if (foundInSitemap) {
          const foundPost = sitemapPosts.find(p => p.slug === targetSlug)
          console.log('文章信息:')
          console.log(`  - Slug: ${foundPost.slug}`)
          console.log(`  - 翻译语言: ${foundPost.post_translation?.map(t => t.language_code).join(', ') || '无'}`)
        }
        console.log('')
        
        // 4. 检查翻译记录
        console.log('===== 步骤 4: 检查翻译记录 =====')
        try {
          const translations = await client.request(
            readItems('post_translation', {
              filter: {
                post_id: { _eq: post.id },
              },
              fields: ['id', 'post_id', 'language_code', 'title'],
            })
          )
          
          console.log(`找到 ${translations.length} 条翻译记录:`)
          translations.forEach(t => {
            console.log(`  - ${t.language_code}: ${t.title}`)
          })
          
          if (translations.length === 0) {
            console.log('⚠️  没有翻译记录，但默认语言 (ja) 仍应包含在 sitemap 中')
          }
        } catch (err) {
          console.error('查询翻译记录失败:', err.message)
        }
        
      } catch (err) {
        console.error('sitemap 查询失败:', err.message)
        if (err.errors) console.error('详细错误:', err.errors)
      }
      
    } catch (err) {
      console.error('查询失败:', err.message)
      if (err.errors) console.error('详细错误:', err.errors)
    }

  } catch (error) {
    console.error('连接失败:', error.message)
    if (error.errors) {
      console.error('详细错误:', JSON.stringify(error.errors, null, 2))
    }
  }
}

checkArticle()

