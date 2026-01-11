export interface EditorHistoryItem {
  id: string // 唯一标识（时间戳 + 随机数）
  timestamp: number // 创建时间
  content: string // Markdown 内容
  preview?: string // 内容预览（前50个字符）
}

const STORAGE_KEY = "markdown-editor-history"
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
 * 获取所有历史记录
 */
export function getEditorHistory(): EditorHistoryItem[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    const history = JSON.parse(stored) as EditorHistoryItem[]
    // 验证数据格式
    if (!Array.isArray(history)) return []

    // 按时间戳倒序排列（最新的在前）
    return history.sort((a, b) => b.timestamp - a.timestamp)
  } catch (err) {
    console.error("Failed to load editor history:", err)
    return []
  }
}

/**
 * 保存历史记录
 * 自动限制为最近 MAX_HISTORY_COUNT 条
 * 如果内容与最新记录相同，则更新最新记录的时间戳，不创建新记录
 */
export function saveEditorHistory(content: string): boolean {
  if (typeof window === "undefined") return false

  try {
    // 检查单条记录大小
    const itemSize = JSON.stringify({ content }).length
    if (itemSize > MAX_ITEM_SIZE) {
      console.warn("History item too large, skipping save")
      return false
    }

    const history = getEditorHistory()

    // 如果最新记录的内容与当前内容相同，只更新时间戳
    if (history.length > 0 && history[0].content === content) {
      const updatedItem: EditorHistoryItem = {
        ...history[0],
        timestamp: Date.now(),
      }
      const updatedHistory = [updatedItem, ...history.slice(1)]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory))
      return true
    }

    // 创建新记录
    const newItem: EditorHistoryItem = {
      id: generateId(),
      timestamp: Date.now(),
      content,
      preview: getTextPreview(content),
    }

    // 添加到列表开头
    const updatedHistory = [newItem, ...history]

    // 限制为最近 MAX_HISTORY_COUNT 条
    const limitedHistory = updatedHistory.slice(0, MAX_HISTORY_COUNT)

    // 保存到 localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedHistory))
    return true
  } catch (err) {
    console.error("Failed to save editor history:", err)
    // 如果存储失败（可能是空间不足），尝试清理旧记录
    try {
      const history = getEditorHistory()
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
 * 获取最新的历史记录（用于恢复）
 */
export function getLatestHistory(): EditorHistoryItem | null {
  const history = getEditorHistory()
  return history.length > 0 ? history[0] : null
}

/**
 * 删除单条历史记录
 */
export function deleteEditorHistoryItem(id: string): boolean {
  if (typeof window === "undefined") return false

  try {
    const history = getEditorHistory()
    const filtered = history.filter((item) => item.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
  } catch (err) {
    console.error("Failed to delete editor history item:", err)
    return false
  }
}

/**
 * 清空所有历史记录
 */
export function clearEditorHistory(): boolean {
  if (typeof window === "undefined") return false

  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch (err) {
    console.error("Failed to clear editor history:", err)
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
