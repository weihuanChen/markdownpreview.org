'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

interface PaginationProps {
  currentPage: number
  totalPages: number
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (page === 1) {
      params.delete('page')
    } else {
      params.set('page', page.toString())
    }
    const queryString = params.toString()
    const url = queryString ? `${pathname}?${queryString}` : pathname
    router.push(url)
  }

  // 生成页码数组
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      // 如果总页数小于等于最大可见页数，显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // 否则显示部分页码
      if (currentPage <= 3) {
        // 当前页在前三页
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        // 当前页在后三页
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // 当前页在中间
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  if (totalPages <= 1) {
    return null
  }

  const pageNumbers = getPageNumbers()

  return (
    <nav className="flex items-center justify-center gap-2 mt-8 mb-8" aria-label="Pagination">
      {/* 上一页按钮 */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label={t('blog_previous')}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* 页码按钮 */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${index}`} className="px-3 py-2 text-muted-foreground">
                ...
              </span>
            )
          }

          const pageNum = page as number
          const isCurrentPage = pageNum === currentPage

          return (
            <Button
              key={pageNum}
              variant={isCurrentPage ? 'default' : 'outline'}
              size="icon"
              onClick={() => handlePageChange(pageNum)}
              aria-label={`${t('blog_page')} ${pageNum}`}
              aria-current={isCurrentPage ? 'page' : undefined}
              className={isCurrentPage ? 'bg-[#0075de] hover:bg-[#0075de]/90' : ''}
            >
              {pageNum}
            </Button>
          )
        })}
      </div>

      {/* 下一页按钮 */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label={t('blog_next')}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  )
}
