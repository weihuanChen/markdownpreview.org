/**
 * Markdown Formatter 统一入口
 * 
 * @example
 * ```ts
 * import { format, initializeRules } from '@/lib/formatter'
 * 
 * // 初始化规则（应用启动时调用一次）
 * initializeRules()
 * 
 * // 执行格式化
 * const result = format(markdownContent)
 * 
 * if (result.hasChanges) {
 *   console.log('Applied rules:', result.appliedRules)
 *   console.log('Formatted:', result.formatted)
 * }
 * ```
 */

// 导出引擎核心
export {
  format,
  formatEngine,
  registerRule,
  registerRules,
  type FormatRule,
  type FormatRuleId,
  type FormatResult,
  type FormatEngineOptions,
  type RuleCategory,
  type RuleOptions,
  type LintResult,
  type LintSeverity,
} from './engine'

// 导出规则相关
export {
  initializeRules,
  allRules,
  getRuleStats,
  presets,
  presetMeta,
  type PresetName,
  // 分类规则
  whitespaceRules,
  headingRules,
  listRules,
  blockquoteRules,
  codeBlockRules,
} from './rules'

// 导出快照管理
export {
  createSnapshotManager,
  getSnapshotState,
  SnapshotManager,
  type Snapshot,
  type SnapshotManagerOptions,
  type SnapshotState,
} from './snapshot'

// 导出报告导出工具
export {
  exportToJSON,
  exportToMarkdown,
  exportToSARIF,
  type ExportData,
  type SARIFLog,
  type SARIFRun,
  type SARIFRule,
  type SARIFResult,
  type SARIFLocation,
} from './export'
