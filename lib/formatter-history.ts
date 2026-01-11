import type { FormatRuleId, PresetName } from "@/lib/formatter"
import type { FormatterMode, RuleState } from "@/hooks/use-formatter"

export interface FormatterHistoryItem {
  id: string // 唯一标识（时间戳 + 随机数）
  timestamp: number // 创建时间
  content: string // Markdown 内容
  mode: FormatterMode // 模式：simple 或 advanced
  ruleStates: RuleState[] // 规则状态列表
  currentPreset: PresetName | null // 当前预设
  preview?: string // 内容预览（前50个字符）
}

const STORAGE_KEY = "markdown-formatter-history"
const MAX_HISTORY_COUNT = 10 // 保存最近10条记录
const MAX_ITEM_SIZE = 500 * 1024 // 500KB per item
const PREVIEW_LENGTH = 50 // 预览文本长度

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * 获取文本预览（前 N 个字符）
 */
function getTextPreview(text: string, maxLength = PREVIEW_LENGTH): string {
  if (!text) return ""
  // 移除首尾空白和换行，然后取前N个字符
  const trimmed = text.trim().replace(/\n+/g, " ")
  if (trimmed.length <= maxLength) return trimmed
  return trimmed.substring(0, maxLength).trim() + "..."
}

/**
 * 比较两个规则状态数组是否相同
 */
function areRuleStatesEqual(a: RuleState[], b: RuleState[]): boolean {
  if (a.length !== b.length) return false
  const aMap = new Map(a.map((r) => [r.id, r.enabled]))
  const bMap = new Map(b.map((r) => [r.id, r.enabled]))
  if (aMap.size !== bMap.size) return false
  for (const [id, enabled] of aMap) {
    if (bMap.get(id) !== enabled) return false
  }
  return true
}

/**
 * 比较两个历史记录项是否相同（用于去重）
 */
function isHistoryItemEqual(
  item: Omit<FormatterHistoryItem, "id" | "timestamp" | "preview">,
  other: FormatterHistoryItem,
): boolean {
  return (
    item.content === other.content &&
    item.mode === other.mode &&
    item.currentPreset === other.currentPreset &&
    areRuleStatesEqual(item.ruleStates, other.ruleStates)
  )
}

/**
 * 获取所有历史记录
 */
export function getFormatterHistory(): FormatterHistoryItem[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    const history = JSON.parse(stored) as FormatterHistoryItem[]
    // 验证数据格式
    if (!Array.isArray(history)) return []

    // 按时间戳倒序排列（最新的在前）
    return history.sort((a, b) => b.timestamp - a.timestamp)
  } catch (err) {
    console.error("Failed to load formatter history:", err)
    return []
  }
}

/**
 * 保存历史记录
 * 自动限制为最近 MAX_HISTORY_COUNT 条
 * 如果内容与最新记录相同，则更新最新记录的时间戳，不创建新记录
 */
export function saveFormatterHistory(
  item: Omit<FormatterHistoryItem, "id" | "timestamp" | "preview">,
): boolean {
  if (typeof window === "undefined") return false

  try {
    // 检查单条记录大小
    const itemSize = JSON.stringify(item).length
    if (itemSize > MAX_ITEM_SIZE) {
      console.warn("Formatter history item too large, skipping save")
      return false
    }

    const history = getFormatterHistory()

    // 如果最新记录的内容与当前内容相同，只更新时间戳
    if (history.length > 0 && isHistoryItemEqual(item, history[0])) {
      const updatedItem: FormatterHistoryItem = {
        ...history[0],
        ...item,
        timestamp: Date.now(),
        preview: getTextPreview(item.content),
      }
      const updatedHistory = [updatedItem, ...history.slice(1)]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory))
      return true
    }

    // 创建新记录
    const newItem: FormatterHistoryItem = {
      id: generateId(),
      timestamp: Date.now(),
      content: item.content,
      mode: item.mode,
      ruleStates: item.ruleStates,
      currentPreset: item.currentPreset,
      preview: getTextPreview(item.content),
    }

    // 添加到列表开头
    const updatedHistory = [newItem, ...history]

    // 限制为最近 MAX_HISTORY_COUNT 条
    const limitedHistory = updatedHistory.slice(0, MAX_HISTORY_COUNT)

    // 保存到 localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedHistory))
    return true
  } catch (err) {
    console.error("Failed to save formatter history:", err)
    // 如果存储失败（可能是空间不足），尝试清理旧记录
    try {
      const history = getFormatterHistory()
      if (history.length > 0) {
        // 只保留最新的 2 条
        const minimalHistory = history.slice(0, 2)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(minimalHistory))
      }
    } catch (cleanupErr) {
      console.error("Failed to cleanup formatter history:", cleanupErr)
    }
    return false
  }
}

/**
 * 获取最新的历史记录（用于恢复）
 */
export function getLatestFormatterHistory(): FormatterHistoryItem | null {
  const history = getFormatterHistory()
  return history.length > 0 ? history[0] : null
}

/**
 * 删除单条历史记录
 */
export function deleteFormatterHistoryItem(id: string): boolean {
  if (typeof window === "undefined") return false

  try {
    const history = getFormatterHistory()
    const filtered = history.filter((item) => item.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
  } catch (err) {
    console.error("Failed to delete formatter history item:", err)
    return false
  }
}

/**
 * 清空所有历史记录
 */
export function clearFormatterHistory(): boolean {
  if (typeof window === "undefined") return false

  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch (err) {
    console.error("Failed to clear formatter history:", err)
    return false
  }
}

/**
 * 格式化时间显示（相对时间）
 * @param timestamp 时间戳
 * @param locale 语言代码，支持 "zh", "en", "ja"，默认为 "zh"
 */
export function formatFormatterHistoryTime(timestamp: number, locale = "zh"): string {
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
