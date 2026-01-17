import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getLocale } from 'next-intl/server'

export async function generateMetadata() {
  // 不作为 SEO 页面，返回空的 metadata，禁止索引
  return {
    robots: {
      index: false,
      follow: false,
    },
  }
}

export default async function AcademicCheckPage() {
  const locale = await getLocale()
  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:3000'
  const protocol = headersList.get('x-forwarded-proto') || 'http'
  
  // 301 永久重定向到 submission tab
  // 构建完整的 URL 用于 301 重定向
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`
  const destination = `${baseUrl}/${locale}/academic-check/submission`
  
  return NextResponse.redirect(destination, {
    status: 301,
  })
}
