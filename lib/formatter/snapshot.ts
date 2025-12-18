/**
 * 快照管理器
 * 
 * 用于实现 Undo/Redo 功能
 */

import type { FormatRuleId } from './engine'

// ============================================================================
// 类型定义
// ============================================================================

export interface Snapshot {
  /** 内容 */
  content: string
  /** 时间戳 */
  timestamp: number
  /** 应用的规则（可选） */
  appliedRules?: FormatRuleId[]
  /** 快照类型 */
  type: 'original' | 'formatted'
}

export interface SnapshotManagerOptions {
  /** 最大历史记录数，默认 10 */
  maxHistory?: number
}

// ============================================================================
// 快照管理器
// ============================================================================

class SnapshotManager {
  private history: Snapshot[] = []
  private maxHistory: number

  constructor(options?: SnapshotManagerOptions) {
    this.maxHistory = options?.maxHistory ?? 10
  }

  /**
   * 保存快照
   */
  save(content: string, type: Snapshot['type'] = 'formatted', appliedRules?: FormatRuleId[]): void {
    const snapshot: Snapshot = {
      content,
      timestamp: Date.now(),
      type,
      appliedRules,
    }

    this.history.push(snapshot)

    // 限制历史记录数量
    if (this.history.length > this.maxHistory) {
      this.history.shift()
    }
  }

  /**
   * 撤销：返回上一个快照
   */
  undo(): Snapshot | null {
    if (this.history.length <= 1) {
      return null
    }

    // 移除当前状态
    this.history.pop()

    // 返回上一个状态
    return this.history[this.history.length - 1] || null
  }

  /**
   * 是否可以撤销
   */
  canUndo(): boolean {
    return this.history.length > 1
  }

  /**
   * 获取当前快照
   */
  getCurrent(): Snapshot | null {
    return this.history[this.history.length - 1] || null
  }

  /**
   * 获取所有历史记录
   */
  getHistory(): Snapshot[] {
    return [...this.history]
  }

  /**
   * 获取历史记录数量
   */
  getHistoryCount(): number {
    return this.history.length
  }

  /**
   * 清空历史记录
   */
  clear(): void {
    this.history = []
  }

  /**
   * 重置：清空历史并设置初始内容
   */
  reset(initialContent: string): void {
    this.clear()
    this.save(initialContent, 'original')
  }
}

// ============================================================================
// 工厂函数
// ============================================================================

/**
 * 创建快照管理器实例
 */
export function createSnapshotManager(options?: SnapshotManagerOptions): SnapshotManager {
  return new SnapshotManager(options)
}

// ============================================================================
// React Hook 友好的 API
// ============================================================================

export type SnapshotState = {
  current: Snapshot | null
  canUndo: boolean
  historyCount: number
}

/**
 * 获取快照状态（用于 React 状态同步）
 */
export function getSnapshotState(manager: SnapshotManager): SnapshotState {
  return {
    current: manager.getCurrent(),
    canUndo: manager.canUndo(),
    historyCount: manager.getHistoryCount(),
  }
}

export { SnapshotManager }

