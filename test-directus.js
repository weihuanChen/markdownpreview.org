// 测试 Directus API 连接
require('dotenv').config({ path: '.env.local' })
const { createDirectus, rest, staticToken, readItems, aggregate } = require('@directus/sdk')

const directusUrl = process.env.DIRECTUS_URL
const directusToken = process.env.DIRECTUS_TOKEN
const siteId = parseInt(process.env.NEXT_PUBLIC_SITE_ID || '3', 10)

console.log('===== Directus 配置信息 =====')
console.log('URL:', directusUrl)
console.log('Token:', directusToken ? `${directusToken.substring(0, 10)}...` : 'NOT SET')
console.log('Site ID:', siteId)
console.log('')

async function testConnection() {
  try {
    const client = createDirectus(directusUrl)
      .with(staticToken(directusToken))
      .with(rest())

    console.log('===== 测试 1: 获取所有文章（无过滤）=====')
    try {
      const allPosts = await client.request(
        readItems('posts', {
          fields: ['id', 'slug', 'title', 'status', 'site_id'],
          limit: 5,
        })
      )
      console.log(`找到 ${allPosts.length} 篇文章:`)
      allPosts.forEach(post => {
        console.log(`  - [${post.status}] ${post.title} (site_id: ${post.site_id}, slug: ${post.slug})`)
      })
    } catch (err) {
      console.error('错误:', err.message)
      if (err.errors) console.error('详细错误:', err.errors)
    }
    console.log('')

    console.log(`===== 测试 2: 获取已发布文章（site_id=${siteId}）=====`)
    try {
      const publishedPosts = await client.request(
        readItems('posts', {
          filter: {
            status: { _eq: 'published' },
            site_id: { _eq: siteId },
          },
          fields: ['id', 'slug', 'title', 'status', 'site_id', 'published_at'],
          limit: 10,
        })
      )
      console.log(`找到 ${publishedPosts.length} 篇已发布的文章:`)
      publishedPosts.forEach(post => {
        console.log(`  - ${post.title} (slug: ${post.slug}, published: ${post.published_at})`)
      })
    } catch (err) {
      console.error('错误:', err.message)
      if (err.errors) console.error('详细错误:', err.errors)
    }
    console.log('')

    console.log(`===== 测试 3: 统计已发布文章数量（site_id=${siteId}）=====`)
    try {
      const totalResult = await client.request(
        aggregate('posts', {
          aggregate: {
            count: '*',
          },
          query: {
            filter: {
              status: { _eq: 'published' },
              site_id: { _eq: siteId },
            },
          },
        })
      )
      console.log('总数:', totalResult[0]?.count || 0)
    } catch (err) {
      console.error('错误:', err.message)
      if (err.errors) console.error('详细错误:', err.errors)
    }
    console.log('')

    console.log('===== 测试 4: 检查不同 site_id 的文章分布 =====')
    try {
      const sites = await client.request(
        readItems('sites', {
          fields: ['id', 'site_name', 'domain'],
        })
      )
      console.log('所有站点:')
      for (const site of sites) {
        const posts = await client.request(
          aggregate('posts', {
            aggregate: {
              count: '*',
            },
            query: {
              filter: {
                status: { _eq: 'published' },
                site_id: { _eq: site.id },
              },
            },
          })
        )
        const count = posts[0]?.count || 0
        console.log(`  - Site ${site.id} (${site.site_name}): ${count} 篇已发布文章`)
      }
    } catch (err) {
      console.error('错误:', err.message)
      if (err.errors) console.error('详细错误:', err.errors)
    }

  } catch (error) {
    console.error('连接失败:', error.message)
    if (error.errors) {
      console.error('详细错误:', JSON.stringify(error.errors, null, 2))
    }
  }
}

testConnection()
