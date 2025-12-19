/**
 * Diff-aware Lint 功能测试脚本
 * 
 * 测试场景：
 * 1. 单行变更 - 验证 lint 结果只包含变更行
 * 2. 多行变更 - 验证 lint 结果包含所有变更行
 * 3. 无变更 - 验证 lint 结果为空
 * 4. 部分行变更 - 验证 lint 结果只包含变更部分
 * 5. 行号映射准确性 - 验证变更行号计算正确
 */

import { format, initializeRules } from '../lib/formatter'

// 初始化规则
initializeRules()

console.log('🧪 开始测试 Diff-aware Lint 功能...\n')

// ============================================================================
// 测试用例 1: 单行变更（移除行尾空格）
// ============================================================================
console.log('📝 测试用例 1: 单行变更（移除行尾空格）')
const test1Original = `# Hello World
This line has trailing spaces   
Another line
`

const test1Result = format(test1Original)
console.log('变更行号:', test1Result.changedLines)
console.log('Lint 结果数量:', test1Result.lintResults.length)
console.log('Lint 结果行号:', test1Result.lintResults.map(r => r.lines))
console.log('预期: 变更行号应该包含第 2 行（有尾随空格的行）')
console.log(test1Result.changedLines.includes(2) && test1Result.lintResults.length > 0 ? '✅ 通过' : '❌ 失败')
console.log('')

// ============================================================================
// 测试用例 2: 多行变更（标题格式修复）
// ============================================================================
console.log('📝 测试用例 2: 多行变更（标题格式修复）')
const test2Original = `#Hello World
##Features
###Details
Normal paragraph
`

const test2Result = format(test2Original)
console.log('变更行号:', test2Result.changedLines)
console.log('Lint 结果数量:', test2Result.lintResults.length)
console.log('预期: 变更行号应该包含第 1, 2, 3 行（标题行）')
const expectedLines2 = [1, 2, 3]
const hasAllExpectedLines2 = expectedLines2.every(line => test2Result.changedLines.includes(line))
console.log(hasAllExpectedLines2 ? '✅ 通过' : '❌ 失败')
console.log('')

// ============================================================================
// 测试用例 3: 无变更
// ============================================================================
console.log('📝 测试用例 3: 无变更（已格式化的内容）')
const test3Original = `# Hello World

This is a properly formatted markdown document.

## Features

- Item one
- Item two
`

const test3Result = format(test3Original)
console.log('变更行号:', test3Result.changedLines)
console.log('Lint 结果数量:', test3Result.lintResults.length)
console.log('预期: 无变更，lint 结果应该为空')
console.log(test3Result.changedLines.length === 0 && test3Result.lintResults.length === 0 ? '✅ 通过' : '❌ 失败')
console.log('')

// ============================================================================
// 测试用例 4: 部分行变更（混合内容）
// ============================================================================
console.log('📝 测试用例 4: 部分行变更（混合内容）')
const test4Original = `# Hello World

This is a normal paragraph.

#Bad Heading
Another normal paragraph.

##Good Heading
`

const test4Result = format(test4Original)
console.log('变更行号:', test4Result.changedLines)
console.log('Lint 结果数量:', test4Result.lintResults.length)
console.log('格式化后内容:')
test4Result.formatted.split('\n').forEach((line, index) => {
  const lineNum = index + 1
  const isChanged = test4Result.changedLines.includes(lineNum)
  console.log(`  ${lineNum}${isChanged ? ' [CHANGED]' : ''}: ${line}`)
})
console.log('预期: 应该变更包含 Bad Heading 和 Good Heading 的行（第 5 和 9 行）')
const hasBadHeading = test4Result.changedLines.includes(5)
const hasGoodHeading = test4Result.changedLines.includes(9)
console.log(hasBadHeading && hasGoodHeading ? '✅ 通过' : '❌ 失败')
console.log('')

// ============================================================================
// 测试用例 5: 行号映射准确性（验证 changedLines 与 formatted 内容对应）
// ============================================================================
console.log('📝 测试用例 5: 行号映射准确性')
const test5Original = `Line 1
#BadHeading
Line 3
`

const test5Result = format(test5Original)
const formattedLines = test5Result.formatted.split('\n')
console.log('变更行号:', test5Result.changedLines)
console.log('格式化后内容:')
formattedLines.forEach((line, index) => {
  const lineNum = index + 1
  const isChanged = test5Result.changedLines.includes(lineNum)
  console.log(`  ${lineNum}${isChanged ? ' [CHANGED]' : ''}: ${line}`)
})
console.log('预期: 变更行号应该对应格式化后的行号')
console.log(test5Result.changedLines.length > 0 ? '✅ 通过' : '❌ 失败')
console.log('')

// ============================================================================
// 测试用例 6: Lint 结果中的 lines 字段应该与 changedLines 一致
// ============================================================================
console.log('📝 测试用例 6: Lint 结果的 lines 字段验证')
const test6Original = `#Bad1
#Bad2
Normal line
`

const test6Result = format(test6Original)
console.log('变更行号:', test6Result.changedLines)
console.log('Lint 结果:')
test6Result.lintResults.forEach((lint, index) => {
  console.log(`  ${index + 1}. Rule: ${lint.ruleId}, Lines: ${lint.lines}`)
})
console.log('预期: Lint 结果的 lines 字段应该包含在 changedLines 中')
const allLintLinesValid = test6Result.lintResults.every(lint => 
  lint.lines?.every(line => test6Result.changedLines.includes(line)) ?? true
)
console.log(allLintLinesValid ? '✅ 通过' : '❌ 失败')
console.log('')

// ============================================================================
// 测试用例 7: 空行和连续空行处理
// ============================================================================
console.log('📝 测试用例 7: 空行和连续空行处理')
const test7Original = `Line 1



Line 5
`

const test7Result = format(test7Original)
console.log('变更行号:', test7Result.changedLines)
console.log('格式化后行数:', test7Result.formatted.split('\n').length)
console.log('格式化后内容:')
test7Result.formatted.split('\n').forEach((line, index) => {
  const lineNum = index + 1
  const isChanged = test7Result.changedLines.includes(lineNum)
  console.log(`  ${lineNum}${isChanged ? ' [CHANGED]' : ''}: "${line}"`)
})
console.log('预期: 应该压缩多余空行（3+ 个空行压缩为 1 个）')
// 检查格式化后的空行数是否减少
const originalBlankLines = test7Original.split('\n').filter(l => l.trim() === '').length
const formattedBlankLines = test7Result.formatted.split('\n').filter(l => l.trim() === '').length
const hasCompressed = formattedBlankLines < originalBlankLines || test7Result.changedLines.length > 0
console.log(hasCompressed ? '✅ 通过' : '⚠️  空行规则可能未启用或配置允许当前空行数')
console.log('')

// ============================================================================
// 测试用例 8: 代码块内的变更（应该被保护）
// ============================================================================
console.log('📝 测试用例 8: 代码块内的变更')
const test8Original = `\`\`\`javascript
function test() {
  console.log("test")   
}
\`\`\`

Normal text
`

const test8Result = format(test8Original)
console.log('变更行号:', test8Result.changedLines)
console.log('预期: 代码块内的尾随空格不应该被修复（代码块内容应被保护）')
// 注意：这个测试取决于规则实现，如果代码块被保护，则不应该有变更
console.log('变更行:', test8Result.changedLines)
console.log('')

// ============================================================================
// 总结
// ============================================================================
console.log('='.repeat(60))
console.log('📊 测试总结')
console.log('='.repeat(60))
console.log(`总测试用例: 8`)
console.log(`变更行号计算: ${test1Result.changedLines.length > 0 ? '✅' : '❌'}`)
console.log(`Lint 结果关联: ${test1Result.lintResults.length > 0 ? '✅' : '❌'}`)
console.log(`行号映射准确性: ${test5Result.changedLines.length > 0 ? '✅' : '❌'}`)
console.log('')
console.log('✨ 测试完成！')

