import type { DiffWorkerOptions } from "@/lib/workers/line-diff-worker"

export interface DiffHistoryItem {
  id: string // 唯一标识（时间戳 + 随机数）
  timestamp: number // 创建时间
  source: string
  target: string
  options: DiffWorkerOptions
  viewMode: "split" | "inline" | "unified"
  collapseUnchanged: boolean
  contextLines: number
  diffType: "word" | "block"
  summary?: { added: number; removed: number; modified: number } // 可选的统计信息
}

const STORAGE_KEY = "markdown-diff-history"
const MAX_HISTORY_COUNT = 5
const MAX_ITEM_SIZE = 500 * 1024 // 500KB per item

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * 获取所有历史记录
 */
export function getDiffHistory(): DiffHistoryItem[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    const history = JSON.parse(stored) as DiffHistoryItem[]
    // 验证数据格式
    if (!Array.isArray(history)) return []

    // 按时间戳倒序排列（最新的在前）
    return history.sort((a, b) => b.timestamp - a.timestamp)
  } catch (err) {
    console.error("Failed to load diff history:", err)
    return []
  }
}

/**
 * 保存历史记录
 * 自动限制为最近 MAX_HISTORY_COUNT 条
 */
export function saveDiffHistory(
  item: Omit<DiffHistoryItem, "id" | "timestamp">,
): boolean {
  if (typeof window === "undefined") return false

  try {
    // 检查单条记录大小
    const itemSize = JSON.stringify(item).length
    if (itemSize > MAX_ITEM_SIZE) {
      console.warn("History item too large, skipping save")
      return false
    }

    const history = getDiffHistory()

    // 创建新记录
    const newItem: DiffHistoryItem = {
      ...item,
      id: generateId(),
      timestamp: Date.now(),
    }

    // 添加到列表开头
    const updatedHistory = [newItem, ...history]

    // 限制为最近 MAX_HISTORY_COUNT 条
    const limitedHistory = updatedHistory.slice(0, MAX_HISTORY_COUNT)

    // 保存到 localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedHistory))
    return true
  } catch (err) {
    console.error("Failed to save diff history:", err)
    // 如果存储失败（可能是空间不足），尝试清理旧记录
    try {
      const history = getDiffHistory()
      if (history.length > 0) {
        // 只保留最新的 2 条
        const minimalHistory = history.slice(0, 2)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(minimalHistory))
      }
    } catch (cleanupErr) {
      console.error("Failed to cleanup history:", cleanupErr)
    }
    return false
  }
}

/**
 * 删除单条历史记录
 */
export function deleteDiffHistoryItem(id: string): boolean {
  if (typeof window === "undefined") return false

  try {
    const history = getDiffHistory()
    const filtered = history.filter((item) => item.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
  } catch (err) {
    console.error("Failed to delete diff history item:", err)
    return false
  }
}

/**
 * 清空所有历史记录
 */
export function clearDiffHistory(): boolean {
  if (typeof window === "undefined") return false

  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch (err) {
    console.error("Failed to clear diff history:", err)
    return false
  }
}

/**
 * 格式化时间显示（相对时间）
 * @param timestamp 时间戳
 * @param locale 语言代码，支持 "zh", "en", "ja"，默认为 "zh"
 */
export function formatHistoryTime(timestamp: number, locale = "zh"): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  // 根据语言返回不同的文本
  const translations: Record<string, Record<string, string>> = {
    zh: {
      justNow: "刚刚",
      minutesAgo: "分钟前",
      hoursAgo: "小时前",
      daysAgo: "天前",
    },
    en: {
      justNow: "Just now",
      minutesAgo: "minutes ago",
      hoursAgo: "hours ago",
      daysAgo: "days ago",
    },
    ja: {
      justNow: "たった今",
      minutesAgo: "分前",
      hoursAgo: "時間前",
      daysAgo: "日前",
    },
  }

  const t = translations[locale] || translations.zh

  if (seconds < 60) return t.justNow
  if (minutes < 60) return `${minutes} ${t.minutesAgo}`
  if (hours < 24) return `${hours} ${t.hoursAgo}`
  if (days < 7) return `${days} ${t.daysAgo}`

  // 超过 7 天显示具体日期
  // 映射 locale 到完整的 locale 代码用于日期格式化
  const dateLocaleMap: Record<string, string> = {
    zh: "zh-CN",
    en: "en-US",
    ja: "ja-JP",
  }
  const dateLocale = dateLocaleMap[locale] || "zh-CN"

  const date = new Date(timestamp)
  return date.toLocaleDateString(dateLocale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * 获取文本预览（前 N 个字符）
 */
export function getTextPreview(text: string, maxLength = 50): string {
  if (!text) return ""
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + "..."
}

