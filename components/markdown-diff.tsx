"use client"

import type { CSSProperties } from "react"
import { useMemo, useRef, useState } from "react"
import { Decoration, Diff, Hunk, markEdits, tokenize } from "react-diff-view"
import "react-diff-view/style/index.css"
import { GitCompare, Loader2, ArrowDown, ArrowUp } from "lucide-react"
import { useTranslations } from "next-intl"

import CodeEditor from "@/components/code-editor"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { useDiffWorker } from "@/hooks/use-diff-worker"
import type { DiffWorkerResponse, LineChangeRange } from "@/lib/workers/line-diff-worker"

const getRangeSize = (start: number | null, end: number | null) => {
  if (!start || !end) return 0
  return end - start + 1
}

const countLines = (value: string) => {
  if (!value) return 0
  return value.split(/\r\n|\r|\n/).length
}

const summarizeRanges = (ranges: LineChangeRange[]) =>
  ranges.reduce(
    (acc, range) => {
      const oldCount = getRangeSize(range.oldStart, range.oldEnd)
      const newCount = getRangeSize(range.newStart, range.newEnd)

      if (range.type === "added") acc.added += newCount
      if (range.type === "removed") acc.removed += oldCount
      if (range.type === "modified") acc.modified += Math.max(oldCount, newCount)

      return acc
    },
    { added: 0, removed: 0, modified: 0 },
  )

export function MarkdownDiff() {
  const t = useTranslations()
  const { theme } = useTheme()
  const { runDiff } = useDiffWorker()

  const [source, setSource] = useState("")
  const [target, setTarget] = useState("")
  const [result, setResult] = useState<DiffWorkerResponse | null>(null)
  const [isComparing, setIsComparing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const summary = useMemo(() => (result ? summarizeRanges(result.ranges) : null), [result])
  const hasDiff = Boolean(result && result.ranges.length > 0)
  const activeFile = result?.files?.[0]
  const hunks = activeFile?.hunks ?? []
  const tokens = useMemo(
    () =>
      hunks.length
        ? tokenize(hunks, {
            enhancers: [markEdits(hunks, { type: "block" })],
          })
        : null,
    [hunks],
  )
  const [currentHunk, setCurrentHunk] = useState(0)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const diffThemeStyles = useMemo<CSSProperties>(() => {
    const lightInsert = "#e6f7ea" // additions (green, right)
    const lightDelete = "#fdecef" // deletions (red, left)
    const darkInsert = "rgba(34,197,94,0.16)"
    const darkDelete = "rgba(239,68,68,0.16)"

    return {
      "--diff-background-color": "transparent",
      "--diff-text-color": "var(--foreground)",
      "--diff-gutter-insert-background-color": theme === "dark" ? darkInsert : lightInsert,
      "--diff-gutter-delete-background-color": theme === "dark" ? darkDelete : lightDelete,
      "--diff-code-insert-background-color": theme === "dark" ? "rgba(34,197,94,0.14)" : "#e6f7ea",
      "--diff-code-delete-background-color": theme === "dark" ? "rgba(239,68,68,0.14)" : "#fdecef",
      "--diff-code-insert-edit-background-color": theme === "dark" ? "rgba(34,197,94,0.4)" : "#97f295",
      "--diff-code-delete-edit-background-color": theme === "dark" ? "rgba(239,68,68,0.4)" : "#ffb6ba",
      "--diff-selection-background-color": theme === "dark" ? "rgba(59,130,246,0.18)" : "#b3d7ff",
    }
  }, [theme])

  const handleCompare = async () => {
    setIsComparing(true)
    setError(null)

    try {
      const diffResult = await runDiff({ oldText: source, newText: target })
      setResult(diffResult)
      setCurrentHunk(0)
    } catch (err) {
      console.error(err)
      setError(t("markdown_diff_error"))
    } finally {
      setIsComparing(false)
    }
  }

  const scrollToHunk = (index: number) => {
    const targetId = `hunk-${index}`
    const el = document.getElementById(targetId)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" })
      setCurrentHunk(index)
    }
  }

  const handlePrev = () => {
    if (!hunks.length) return
    const nextIndex = (currentHunk - 1 + hunks.length) % hunks.length
    scrollToHunk(nextIndex)
  }

  const handleNext = () => {
    if (!hunks.length) return
    const nextIndex = (currentHunk + 1) % hunks.length
    scrollToHunk(nextIndex)
  }

  return (
    <section
      className="w-screen py-14 px-4 bg-gradient-to-b from-background via-background to-muted/30 border-b border-border"
      style={{ marginInline: 'calc(50% - 50vw)' }}
    >
      <div className="w-full space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-primary/80 uppercase tracking-wide">
              {t("markdown_diff_label")}
            </p>
            <h2 className="text-3xl font-bold text-foreground">{t("markdown_diff_title")}</h2>
            <p className="text-muted-foreground max-w-3xl text-sm md:text-base leading-relaxed">
              {t("markdown_diff_description")}
            </p>
          </div>
          <Button
            onClick={handleCompare}
            disabled={isComparing || (!source && !target)}
            className="self-start md:self-center shadow-sm"
          >
            {isComparing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("markdown_diff_running")}
              </>
            ) : (
              <>
                <GitCompare className="h-4 w-4" />
                {t("markdown_diff_action")}
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-card/70 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/40">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  {t("markdown_diff_source")}
                </p>
                <p className="text-[11px] text-muted-foreground">{t("markdown_diff_source_hint")}</p>
              </div>
              <span className="text-[11px] text-muted-foreground">
                {t("markdown_diff_line_count", { count: countLines(source) })}
              </span>
            </div>
            <div className="h-[280px]">
              <CodeEditor value={source} onChange={setSource} theme={theme} />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card/70 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/40">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  {t("markdown_diff_target")}
                </p>
                <p className="text-[11px] text-muted-foreground">{t("markdown_diff_target_hint")}</p>
              </div>
              <span className="text-[11px] text-muted-foreground">
                {t("markdown_diff_line_count", { count: countLines(target) })}
              </span>
            </div>
            <div className="h-[280px]">
              <CodeEditor value={target} onChange={setTarget} theme={theme} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card/80 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border">
            <div>
              <p className="text-sm font-semibold text-foreground">{t("markdown_diff_result")}</p>
              <p className="text-xs text-muted-foreground">{t("markdown_diff_result_hint")}</p>
            </div>
            {summary && hasDiff && (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-700 dark:text-green-200 text-xs font-semibold border border-green-500/30">
                    {t("markdown_diff_added", { count: summary.added })}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-700 dark:text-red-200 text-xs font-semibold border border-red-500/30">
                    {t("markdown_diff_removed", { count: summary.removed })}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-200 text-xs font-semibold border border-amber-500/30">
                    {t("markdown_diff_modified", { count: summary.modified })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handlePrev} disabled={!hunks.length}>
                    <ArrowUp className="h-4 w-4 mr-1" />
                    {t("markdown_diff_prev")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleNext} disabled={!hunks.length}>
                    <ArrowDown className="h-4 w-4 mr-1" />
                    {t("markdown_diff_next")}
                  </Button>
                  {hunks.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {currentHunk + 1} / {hunks.length}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {error ? (
            <div className="px-4 py-6 text-sm text-destructive">{error}</div>
          ) : !result ? (
            <div className="px-4 py-10 text-center text-muted-foreground text-sm">
              {t("markdown_diff_idle")}
            </div>
          ) : hasDiff ? (
            <div className="overflow-auto" style={diffThemeStyles} ref={containerRef}>
              <Diff
                viewType="split"
                diffType={activeFile?.type ?? "modify"}
                hunks={hunks}
                className="text-sm"
                tokens={tokens ?? undefined}
              >
                {(hunks) =>
                  hunks.flatMap((hunk, index) => [
                    <Decoration key={`decoration-${index}`}>
                      <div id={`hunk-${index}`} className="diff-hunk-anchor" />
                    </Decoration>,
                    <Hunk
                      key={`${hunk.content}-${hunk.oldStart}-${hunk.newStart}-${index}`}
                      hunk={hunk}
                    />,
                  ])
                }
              </Diff>
            </div>
          ) : (
            <div className="px-4 py-10 text-center text-muted-foreground text-sm">
              {t("markdown_diff_no_changes")}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
