import { Link } from '@/navigation'

interface BlogInlineCTAProps {
  title: string
  professionalMessage: string
  professionalLinkLabel: string
  previewLabel: string
  diffLabel: string
  formatterLabel: string
}

export function BlogInlineCTA({
  title,
  professionalMessage,
  professionalLinkLabel,
  previewLabel,
  diffLabel,
  formatterLabel,
}: BlogInlineCTAProps) {
  return (
    <section
      aria-label={title}
      className="mb-6 rounded-lg border border-dashed border-[var(--brand-blue)]/35 bg-muted/60 px-4 py-4"
    >
      <div className="flex flex-col gap-3 text-sm">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-[var(--brand-blue)]">
            {title}
          </span>
          <span className="text-xs text-muted-foreground">{professionalMessage}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* 专业写作增强：Formatter 作为主按钮 */}
          <Link
            href="/formatter"
            className="inline-flex items-center rounded-full bg-[var(--brand-blue)] px-3 py-1 text-xs font-medium text-background shadow-sm transition-colors hover:bg-[var(--brand-blue)]/90"
          >
            {formatterLabel}
            <span className="ml-1 opacity-80">{professionalLinkLabel}</span>
          </Link>

          {/* 辅助入口：在线编辑器首页 */}
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-[var(--brand-blue)]/40 bg-background px-3 py-1 text-xs font-medium text-[var(--brand-blue)] shadow-sm transition-colors hover:bg-[var(--brand-blue)] hover:text-background"
          >
            {previewLabel}
          </Link>

          {/* 辅助入口：Diff 工具 */}
          <Link
            href="/diff"
            className="inline-flex items-center rounded-full border border-[var(--brand-blue)]/30 bg-background px-3 py-1 text-xs font-medium text-[var(--brand-blue)]/90 shadow-sm transition-colors hover:bg-[var(--brand-blue)] hover:text-background"
          >
            {diffLabel}
          </Link>
        </div>
      </div>
    </section>
  )
}



