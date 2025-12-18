export type Locale = 'ja' | 'en' | 'zh' | 'fr' | 'es'

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
  updatedAt?: string
  author: string
  tags: string[]
  tagDetails?: TagInfo[]
  content: string
  readingTime: number
  locale: Locale
  image?: string
  faq?: FAQItem[]
  viewCount?: number
  uniqueViewCount?: number
}

export interface PaginatedPosts {
  posts: BlogPost[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
