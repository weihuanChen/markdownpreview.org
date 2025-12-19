/**
 * 写作质量规则测试脚本
 * 
 * 测试规则：
 * 1. heading-depth: 标题层级过深检测
 * 2. long-paragraph: 段落过长检测
 * 3. Diff-aware 过滤：只检查变更行
 * 4. 代码块保护：代码块内的内容不应被检测
 */

import { format, initializeRules } from '../lib/formatter'

// 初始化规则
initializeRules()

console.log('🧪 开始测试写作质量规则...\n')

// ============================================================================
// 测试用例 1: heading-depth - 标题层级过深
// ============================================================================
console.log('📝 测试用例 1: heading-depth - 标题层级过深检测')
const test1Content = `# Level 1 Heading

## Level 2 Heading

### Level 3 Heading

#### Level 4 Heading

##### Level 5 Heading (超过默认限制 4)

###### Level 6 Heading (超过默认限制 4)

Normal paragraph
`

const test1Result = format(test1Content, {
  enabledRules: ['heading-depth'],
  maxHeadingDepth: 4,
})

console.log('Lint 结果数量:', test1Result.lintResults.length)
console.log('Lint 结果:')
test1Result.lintResults.forEach((lint, index) => {
  console.log(`  ${index + 1}. Rule: ${lint.ruleId}, Line: ${lint.line}, Message: ${lint.message}`)
})
console.log('预期: 应该检测到第 5 行（#####）和第 6 行（######）')
const hasLevel5 = test1Result.lintResults.some(l => l.line === 9) // Level 5 在第 9 行
const hasLevel6 = test1Result.lintResults.some(l => l.line === 11) // Level 6 在第 11 行
console.log(hasLevel5 && hasLevel6 ? '✅ 通过' : '❌ 失败')
console.log('')

// ============================================================================
// 测试用例 2: heading-depth - 代码块内的标题不应被检测
// ============================================================================
console.log('📝 测试用例 2: heading-depth - 代码块保护')
const test2Content = `# Normal Heading

\`\`\`markdown
##### This is in a code block, should not be detected
###### This too
\`\`\`

##### Real heading outside code block
`

const test2Result = format(test2Content, {
  enabledRules: ['heading-depth'],
  maxHeadingDepth: 4,
})

console.log('Lint 结果数量:', test2Result.lintResults.length)
console.log('Lint 结果:')
test2Result.lintResults.forEach((lint, index) => {
  console.log(`  ${index + 1}. Rule: ${lint.ruleId}, Line: ${lint.line}`)
})
console.log('预期: 只检测代码块外的标题，不检测代码块内的')
// 代码块在第 3-6 行，代码块外的标题在第 7 行
const codeBlockLines = [3, 4, 5, 6]
const outsideCodeBlockLine = 7
const onlyOutsideCodeBlock = test2Result.lintResults.length === 1 && 
  test2Result.lintResults[0]?.line === outsideCodeBlockLine &&
  !codeBlockLines.includes(test2Result.lintResults[0]?.line || 0)
console.log(onlyOutsideCodeBlock ? '✅ 通过' : `⚠️  检测到 ${test2Result.lintResults.length} 个结果，行号: ${test2Result.lintResults.map(l => l.line).join(', ')}`)
console.log('')

// ============================================================================
// 测试用例 3: long-paragraph - 段落过长检测
// ============================================================================
console.log('📝 测试用例 3: long-paragraph - 段落过长检测')
// 创建一个超过 800 字符的段落
const longText = 'This is a very long paragraph. '.repeat(30) // 约 900 字符
const test3Content = `# Title

${longText}

Another short paragraph.
`

const test3Result = format(test3Content, {
  enabledRules: ['long-paragraph'],
  maxParagraphChars: 800,
})

console.log('段落长度:', longText.length, '字符')
console.log('Lint 结果数量:', test3Result.lintResults.length)
console.log('Lint 结果:')
test3Result.lintResults.forEach((lint, index) => {
  console.log(`  ${index + 1}. Rule: ${lint.ruleId}, Line: ${lint.line}, Lines: ${lint.lines}`)
})
console.log('预期: 应该检测到长段落（第 3 行）')
const hasLongParagraph = test3Result.lintResults.some(l => l.ruleId === 'long-paragraph' && l.line === 3)
console.log(hasLongParagraph ? '✅ 通过' : '❌ 失败')
console.log('')

// ============================================================================
// 测试用例 4: long-paragraph - 多行段落检测
// ============================================================================
console.log('📝 测试用例 4: long-paragraph - 多行段落检测')
const multiLineLongParagraph = Array(10).fill('This is a line of text that contributes to a long paragraph. ').join('\n')
const test4Content = `# Title

${multiLineLongParagraph}

Short paragraph.
`

const test4Result = format(test4Content, {
  enabledRules: ['long-paragraph'],
  maxParagraphChars: 200,
})

console.log('段落总长度:', multiLineLongParagraph.replace(/\n/g, ' ').length, '字符')
console.log('Lint 结果数量:', test4Result.lintResults.length)
console.log('Lint 结果:')
test4Result.lintResults.forEach((lint, index) => {
  console.log(`  ${index + 1}. Rule: ${lint.ruleId}, Line: ${lint.line}, Lines: ${lint.lines}`)
})
console.log('预期: 应该检测到多行段落，lines 字段应包含所有行号')
const hasMultiLineResult = test4Result.lintResults.some(l => 
  l.ruleId === 'long-paragraph' && 
  l.lines && 
  l.lines.length > 1
)
console.log(hasMultiLineResult ? '✅ 通过' : '❌ 失败')
console.log('')

// ============================================================================
// 测试用例 5: long-paragraph - 代码块内的段落不应被检测
// ============================================================================
console.log('📝 测试用例 5: long-paragraph - 代码块保护')
const longCodeBlockContent = `# Title

Normal paragraph.

\`\`\`javascript
${'console.log("This is a very long line in code block that should not be detected as a long paragraph."); '.repeat(20)}
\`\`\`

Another normal paragraph.
`

const test5Result = format(longCodeBlockContent, {
  enabledRules: ['long-paragraph'],
  maxParagraphChars: 100,
})

console.log('Lint 结果数量:', test5Result.lintResults.length)
console.log('Lint 结果:')
test5Result.lintResults.forEach((lint, index) => {
  console.log(`  ${index + 1}. Rule: ${lint.ruleId}, Line: ${lint.line}`)
})
console.log('预期: 代码块内的长行不应被检测为段落过长')
const noCodeBlockDetection = !test5Result.lintResults.some(l => 
  l.line && l.line >= 5 && l.line <= 6 // 代码块所在行
)
console.log(noCodeBlockDetection ? '✅ 通过' : '❌ 失败')
console.log('')

// ============================================================================
// 测试用例 6: Diff-aware Lint - 只检查变更行
// ============================================================================
console.log('📝 测试用例 6: Diff-aware Lint - 只检查变更行')
const test6Original = `# Title

Normal paragraph.

## Another Title
`

// 只修改第一行，添加一个过深的标题
const test6Modified = `# Title

Normal paragraph.

## Another Title

##### Deep Heading (超过限制)
`

const test6Result = format(test6Modified, {
  enabledRules: ['heading-depth', 'trailing-spaces'],
  maxHeadingDepth: 4,
})

console.log('变更行号:', test6Result.changedLines)
console.log('Lint 结果数量:', test6Result.lintResults.length)
console.log('Lint 结果:')
test6Result.lintResults.forEach((lint, index) => {
  console.log(`  ${index + 1}. Rule: ${lint.ruleId}, Line: ${lint.line}`)
})
console.log('预期: 如果启用了 Diff-aware，应该只检测变更行范围内的 lint 问题')
// 注意：这个测试取决于引擎是否实现了 Diff-aware 过滤
console.log('变更行:', test6Result.changedLines)
console.log('Lint 行:', test6Result.lintResults.map(l => l.line))
console.log('')

// ============================================================================
// 测试用例 7: 组合规则 - 同时检测多个写作质量规则
// ============================================================================
console.log('📝 测试用例 7: 组合规则 - 同时检测多个写作质量规则')
const test7Content = `# Title

${'This is a very long paragraph that exceeds the character limit. '.repeat(20)}

##### Deep Heading

Normal paragraph.
`

const test7Result = format(test7Content, {
  enabledRules: ['heading-depth', 'long-paragraph'],
  maxHeadingDepth: 4,
  maxParagraphChars: 200,
})

console.log('Lint 结果数量:', test7Result.lintResults.length)
console.log('Lint 结果:')
test7Result.lintResults.forEach((lint, index) => {
  console.log(`  ${index + 1}. Rule: ${lint.ruleId}, Line: ${lint.line}, Severity: ${lint.severity}`)
})
console.log('预期: 应该同时检测到段落过长和标题层级过深')
const hasLongParagraph7 = test7Result.lintResults.some(l => l.ruleId === 'long-paragraph')
const hasDeepHeading7 = test7Result.lintResults.some(l => l.ruleId === 'heading-depth')
console.log(hasLongParagraph7 && hasDeepHeading7 ? '✅ 通过' : '❌ 失败')
console.log('')

// ============================================================================
// 测试用例 8: 边界情况 - 刚好达到限制的段落
// ============================================================================
console.log('📝 测试用例 8: 边界情况 - 刚好达到限制的段落')
const exactly800Chars = 'a'.repeat(800)
const test8Content = `# Title

${exactly800Chars}

${'a'.repeat(801)}
`

const test8Result = format(test8Content, {
  enabledRules: ['long-paragraph'],
  maxParagraphChars: 800,
})

console.log('第一段长度:', exactly800Chars.length, '字符（刚好达到限制）')
console.log('第二段长度:', 801, '字符（超过限制）')
console.log('Lint 结果数量:', test8Result.lintResults.length)
console.log('Lint 结果:')
test8Result.lintResults.forEach((lint, index) => {
  console.log(`  ${index + 1}. Rule: ${lint.ruleId}, Line: ${lint.line}`)
})
console.log('预期: 只检测超过限制的段落（第 5 行），不检测刚好达到限制的')
const onlyOverLimit = test8Result.lintResults.length === 1 && test8Result.lintResults[0]?.line === 5
console.log(onlyOverLimit ? '✅ 通过' : '❌ 失败')
console.log('')

// ============================================================================
// 测试用例 9: 空段落和标题分隔
// ============================================================================
console.log('📝 测试用例 9: 空段落和标题分隔')
const test9Content = `# Title

${'Long paragraph text. '.repeat(50)}

## Subtitle

${'Another long paragraph. '.repeat(50)}

### Sub-subtitle

Short paragraph.
`

const test9Result = format(test9Content, {
  enabledRules: ['long-paragraph'],
  maxParagraphChars: 200,
})

console.log('Lint 结果数量:', test9Result.lintResults.length)
console.log('Lint 结果:')
test9Result.lintResults.forEach((lint, index) => {
  console.log(`  ${index + 1}. Rule: ${lint.ruleId}, Line: ${lint.line}, Lines: ${lint.lines}`)
})
console.log('预期: 应该分别检测两个长段落，标题应该正确分隔段落')
const hasTwoParagraphs = test9Result.lintResults.filter(l => l.ruleId === 'long-paragraph').length >= 2
console.log(hasTwoParagraphs ? '✅ 通过' : '❌ 失败')
console.log('')

// ============================================================================
// 测试用例 10: 规则未启用时不应检测
// ============================================================================
console.log('📝 测试用例 10: 规则未启用时不应检测')
const test10Content = `# Title

${'Very long paragraph. '.repeat(50)}

##### Deep Heading
`

const test10Result = format(test10Content, {
  enabledRules: ['trailing-spaces'], // 不启用写作质量规则
  maxHeadingDepth: 4,
  maxParagraphChars: 200,
})

console.log('启用的规则:', ['trailing-spaces'])
console.log('Lint 结果数量:', test10Result.lintResults.length)
console.log('Lint 结果:')
test10Result.lintResults.forEach((lint, index) => {
  console.log(`  ${index + 1}. Rule: ${lint.ruleId}, Line: ${lint.line}`)
})
console.log('预期: 不应检测写作质量规则（heading-depth, long-paragraph）')
const noWritingQualityRules = !test10Result.lintResults.some(l => 
  l.ruleId === 'heading-depth' || l.ruleId === 'long-paragraph'
)
console.log(noWritingQualityRules ? '✅ 通过' : '❌ 失败')
console.log('')

// ============================================================================
// 总结
// ============================================================================
console.log('='.repeat(60))
console.log('📊 测试总结')
console.log('='.repeat(60))
console.log(`总测试用例: 10`)
console.log(`heading-depth 规则: ${test1Result.lintResults.length > 0 ? '✅' : '❌'}`)
console.log(`long-paragraph 规则: ${test3Result.lintResults.length > 0 ? '✅' : '❌'}`)
console.log(`代码块保护: ${onlyOutsideCodeBlock && noCodeBlockDetection ? '✅' : '❌'}`)
console.log(`组合规则: ${hasLongParagraph7 && hasDeepHeading7 ? '✅' : '❌'}`)
console.log('')
console.log('✨ 测试完成！')

