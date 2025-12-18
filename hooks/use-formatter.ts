'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  format,
  initializeRules,
  createSnapshotManager,
  type FormatResult,
  type FormatEngineOptions,
  type SnapshotManager,
  type Snapshot,
} from '@/lib/formatter'

// ============================================================================
// 类型定义
// ============================================================================

export interface UseFormatterOptions extends FormatEngineOptions {
  /** 初始内容 */
  initialContent?: string
  /** 最大历史记录数 */
  maxHistory?: number
}

export interface UseFormatterReturn {
  /** 当前内容 */
  content: string
  /** 设置内容 */
  setContent: (content: string) => void
  /** 格式化结果（执行 format 后可用） */
  result: FormatResult | null
  /** 执行格式化 */
  runFormat: () => FormatResult
  /** 应用格式化结果到内容 */
  applyFormat: () => void
  /** 撤销上一次操作 */
  undo: () => boolean
  /** 是否可以撤销 */
  canUndo: boolean
  /** 是否正在格式化 */
  isFormatting: boolean
  /** 是否有未保存的内容变更 */
  hasUnsavedChanges: boolean
  /** 历史快照数量 */
  historyCount: number
  /** 重置为初始状态 */
  reset: () => void
}

// ============================================================================
// 初始化标记
// ============================================================================

let rulesInitialized = false

function ensureRulesInitialized() {
  if (!rulesInitialized) {
    initializeRules()
    rulesInitialized = true
  }
}

// ============================================================================
// Hook 实现
// ============================================================================

export function useFormatter(options?: UseFormatterOptions): UseFormatterReturn {
  const { initialContent = '', maxHistory = 10, ...formatOptions } = options ?? {}

  // 确保规则已初始化
  useEffect(() => {
    ensureRulesInitialized()
  }, [])

  // 状态
  const [content, setContentState] = useState(initialContent)
  const [result, setResult] = useState<FormatResult | null>(null)
  const [isFormatting, setIsFormatting] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [historyCount, setHistoryCount] = useState(0)

  // 快照管理器
  const snapshotManagerRef = useRef<SnapshotManager | null>(null)
  const lastSavedContentRef = useRef(initialContent)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 初始化快照管理器
  useEffect(() => {
    snapshotManagerRef.current = createSnapshotManager({ maxHistory })
    snapshotManagerRef.current.reset(initialContent)
    setHistoryCount(1)
    lastSavedContentRef.current = initialContent
    setHasUnsavedChanges(false)
  }, [initialContent, maxHistory])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [])

  // 更新快照状态
  const updateSnapshotState = useCallback(() => {
    const manager = snapshotManagerRef.current
    if (manager) {
      setCanUndo(manager.canUndo())
      setHistoryCount(manager.getHistoryCount())
    }
  }, [])

  // 设置内容
  const setContent = useCallback((newContent: string) => {
    setContentState(newContent)
    // 内容变化时清除之前的格式化结果
    setResult(null)

    const manager = snapshotManagerRef.current
    if (!manager) return

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    setHasUnsavedChanges(newContent !== lastSavedContentRef.current)

    // Debounce saves to avoid capturing every keystroke.
    saveTimerRef.current = setTimeout(() => {
      if (newContent !== lastSavedContentRef.current) {
        manager.save(newContent, 'original')
        lastSavedContentRef.current = newContent
        setHasUnsavedChanges(false)
        updateSnapshotState()
      }
    }, 500)
  }, [updateSnapshotState])

  // 执行格式化
  const runFormat = useCallback((): FormatResult => {
    ensureRulesInitialized()
    setIsFormatting(true)

    try {
      const formatResult = format(content, formatOptions)
      setResult(formatResult)
      return formatResult
    } finally {
      setIsFormatting(false)
    }
  }, [content, formatOptions])

  // 应用格式化结果
  const applyFormat = useCallback(() => {
    if (!result || !result.hasChanges) return

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }

    const manager = snapshotManagerRef.current
    if (manager) {
      // 保存当前状态到历史
      manager.save(result.formatted, 'formatted', result.appliedRules)
      updateSnapshotState()
    }

    // 更新内容
    setContentState(result.formatted)
    lastSavedContentRef.current = result.formatted
    setHasUnsavedChanges(false)
    setResult(null)
  }, [result, updateSnapshotState])

  // 撤销
  const undo = useCallback((): boolean => {
    const manager = snapshotManagerRef.current
    if (!manager || !manager.canUndo()) return false

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }

    const previousSnapshot = manager.undo()
    if (previousSnapshot) {
      setContentState(previousSnapshot.content)
      lastSavedContentRef.current = previousSnapshot.content
      setHasUnsavedChanges(false)
      setResult(null)
      updateSnapshotState()
      return true
    }

    return false
  }, [updateSnapshotState])

  // 重置
  const reset = useCallback(() => {
    const manager = snapshotManagerRef.current
    if (manager) {
      manager.reset(initialContent)
      updateSnapshotState()
    }
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    setContentState(initialContent)
    lastSavedContentRef.current = initialContent
    setHasUnsavedChanges(false)
    setResult(null)
  }, [initialContent, updateSnapshotState])

  return {
    content,
    setContent,
    result,
    runFormat,
    applyFormat,
    undo,
    canUndo,
    isFormatting,
    hasUnsavedChanges,
    historyCount,
    reset,
  }
}

// ============================================================================
// 便捷函数（非 Hook，用于一次性格式化）
// ============================================================================

/**
 * 快速格式化（不使用 Hook）
 */
export function quickFormat(content: string, options?: FormatEngineOptions): FormatResult {
  ensureRulesInitialized()
  return format(content, options)
}
