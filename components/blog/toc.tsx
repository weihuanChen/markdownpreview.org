'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

interface TocItem {
  id: string
  text: string
  level: number
}

interface TocProps {
  content: string
}

export function Toc({ content }: TocProps) {
  const t = useTranslations()
  const [tocItems, setTocItems] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    // 从 Markdown 内容中提取标题
    const headingRegex = /^(#{1,6})\s+(.+)$/gm
    const items: TocItem[] = []
    let match
    const idCounts = new Map<string, number>()

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length
      const text = match[2].trim()
      // 生成 ID（简化版，实际应该与渲染器的 ID 生成保持一致）
      let id = text
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
        .replace(/\s+/g, '-')

      // 处理重复的 ID
      const count = idCounts.get(id) || 0
      if (count > 0) {
        id = `${id}-${count}`
      }
      idCounts.set(id.replace(/-\d+$/, ''), count + 1)

      items.push({ id, text, level })
    }

    setTocItems(items)
  }, [content])

  useEffect(() => {
    // 监听滚动事件，高亮当前章节
    const handleScroll = () => {
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
      let currentId = ''

      for (const heading of Array.from(headings)) {
        const rect = heading.getBoundingClientRect()
        if (rect.top <= 100) {
          currentId = heading.id
        }
      }

      setActiveId(currentId)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // 初始化

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleClick = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const top = element.getBoundingClientRect().top + window.pageYOffset - 80
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  if (tocItems.length === 0) {
    return null
  }

  return (
    <nav className="sticky top-4 border border-border rounded-lg p-4 bg-card">
      <h3 className="text-lg font-semibold text-foreground mb-3">
        {t('blog_toc')}
      </h3>
      <ul className="space-y-2 text-sm">
        {tocItems.map((item, index) => (
          <li
            key={`${item.id}-${index}`}
            style={{ paddingLeft: `${(item.level - 1) * 0.75}rem` }}
          >
            <button
              onClick={() => handleClick(item.id)}
              className={`text-left hover:text-[#0075de] transition-colors ${
                activeId === item.id
                  ? 'text-[#0075de] font-medium'
                  : 'text-muted-foreground'
              }`}
            >
              {item.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
