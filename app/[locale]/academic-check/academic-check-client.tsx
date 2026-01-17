"use client"

import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/navigation'
import { Button } from '@/components/ui/button'
import { FileCheck, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AcademicSubmissionCheck } from '@/components/academic-submission-check'

type TabType = 'submission' | 'clarity'

interface AcademicCheckClientProps {
  activeTab: TabType
}

export function AcademicCheckClient({ activeTab }: AcademicCheckClientProps) {
  const t = useTranslations()
  const pathname = usePathname()
  const [currentTab, setCurrentTab] = useState<TabType>(activeTab)

  // 同步 activeTab prop 变化和 pathname 变化
  useEffect(() => {
    setCurrentTab(activeTab)
  }, [activeTab])

  // 根据 pathname 更新当前 tab
  useEffect(() => {
    if (pathname?.includes('/academic-check/submission')) {
      setCurrentTab('submission')
    } else if (pathname?.includes('/academic-check/clarity')) {
      setCurrentTab('clarity')
    }
  }, [pathname])

  const tabs = [
    {
      id: 'submission' as TabType,
      label: t('academic_check_tab_submission'),
      icon: FileCheck,
      href: '/academic-check/submission',
    },
    {
      id: 'clarity' as TabType,
      label: t('academic_check_tab_clarity'),
      icon: Sparkles,
      href: '/academic-check/clarity',
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          {t('academic_check_title')}
        </h1>
        <p className="text-muted-foreground text-lg">
          {t('academic_check_description')}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border mb-8">
        <nav className="flex gap-2" role="tablist">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = currentTab === tab.id || pathname?.endsWith(tab.href) || pathname?.includes(tab.href)
            
            return (
              <Link key={tab.id} href={tab.href} className="no-underline">
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`
                    rounded-b-none border-b-2 transition-all
                    ${isActive 
                      ? 'border-[var(--brand-blue)] bg-[var(--brand-blue)] text-white hover:bg-[#0064c2]' 
                      : 'border-transparent hover:border-muted-foreground/50'
                    }
                  `}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`tabpanel-${tab.id}`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </Button>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {currentTab === 'submission' && (
          <div id="tabpanel-submission" role="tabpanel" aria-labelledby="tab-submission">
            <div className="bg-card border border-border rounded-lg p-8">
              <h2 className="text-2xl font-semibold mb-4">{t('academic_check_submission_title')}</h2>
              <p className="text-muted-foreground mb-6">{t('academic_check_submission_description')}</p>
              
              {/* Academic Submission Check Component */}
              <AcademicSubmissionCheck />
            </div>
          </div>
        )}

        {currentTab === 'clarity' && (
          <div id="tabpanel-clarity" role="tabpanel" aria-labelledby="tab-clarity">
            <div className="bg-card border border-border rounded-lg p-8">
              <h2 className="text-2xl font-semibold mb-4">{t('academic_check_clarity_title')}</h2>
              <p className="text-muted-foreground mb-6">{t('academic_check_clarity_description')}</p>
              
              {/* Placeholder for future implementation */}
              <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-12 text-center">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">{t('academic_check_coming_soon')}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
