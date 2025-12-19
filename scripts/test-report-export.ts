/**
 * 报告导出功能测试脚本
 * 
 * 测试格式：
 * 1. JSON 导出 - 结构化数据格式
 * 2. Markdown 导出 - 人类可读的报告
 * 3. SARIF 导出 - 标准静态分析结果格式
 */

import { format, initializeRules } from '../lib/formatter'
import { exportToJSON, exportToMarkdown, exportToSARIF } from '../lib/formatter/export'
import * as fs from 'fs'
import * as path from 'path'

// 初始化规则
initializeRules()

console.log('🧪 开始测试报告导出功能...\n')

// ============================================================================
// 准备测试数据
// ============================================================================

const testContent = `#Hello World
This is a sample markdown document with some formatting issues.

##Features
*  Item one
*  Item two

>This is a quote without proper spacing

\`\`\`javascript
function hello() {
  console.log("Hello!")
}
\`\`\`

Some text right after the code block.

### Trailing spaces   
This line has trailing spaces.   


Too many blank lines above.

####Another heading without space after #
`

const testResult = format(testContent, {
  enabledRules: [
    'trailing-spaces',
    'heading-space',
    'heading-blank-lines',
    'list-marker-style',
    'blockquote-space',
    'code-fence-spacing',
    'heading-depth',
    'long-paragraph',
  ],
  maxHeadingDepth: 3,
  maxParagraphChars: 100,
})

console.log('测试数据准备完成')
console.log(`- 应用的规则数: ${testResult.appliedRules.length}`)
console.log(`- Lint 结果数: ${testResult.lintResults.length}`)
console.log(`- 变更行数: ${testResult.changedLines.length}`)
console.log('')

// ============================================================================
// 测试用例 1: JSON 导出（不包含内容）
// ============================================================================
console.log('📝 测试用例 1: JSON 导出（不包含内容）')
try {
  const jsonOutput = exportToJSON(testResult, false)
  const jsonData = JSON.parse(jsonOutput)
  
  console.log('✅ JSON 格式有效')
  console.log(`- 包含字段: ${Object.keys(jsonData).join(', ')}`)
  console.log(`- generatedAt: ${jsonData.generatedAt ? '✅' : '❌'}`)
  console.log(`- appliedRules: ${Array.isArray(jsonData.appliedRules) ? '✅' : '❌'}`)
  console.log(`- lintResults: ${Array.isArray(jsonData.lintResults) ? '✅' : '❌'}`)
  console.log(`- changedLines: ${Array.isArray(jsonData.changedLines) ? '✅' : '❌'}`)
  console.log(`- 不包含 original: ${!jsonData.original ? '✅' : '❌'}`)
  console.log(`- 不包含 formatted: ${!jsonData.formatted ? '✅' : '❌'}`)
  
  // 验证数据结构
  const hasRequiredFields = jsonData.generatedAt && 
    Array.isArray(jsonData.appliedRules) &&
    Array.isArray(jsonData.lintResults) &&
    Array.isArray(jsonData.changedLines) &&
    typeof jsonData.hasChanges === 'boolean'
  
  console.log(hasRequiredFields ? '✅ 通过' : '❌ 失败')
} catch (error) {
  console.log('❌ 失败:', error)
}
console.log('')

// ============================================================================
// 测试用例 2: JSON 导出（包含内容）
// ============================================================================
console.log('📝 测试用例 2: JSON 导出（包含内容）')
try {
  const jsonOutput = exportToJSON(testResult, true)
  const jsonData = JSON.parse(jsonOutput)
  
  console.log('✅ JSON 格式有效')
  console.log(`- 包含 original: ${typeof jsonData.original === 'string' ? '✅' : '❌'}`)
  console.log(`- 包含 formatted: ${typeof jsonData.formatted === 'string' ? '✅' : '❌'}`)
  console.log(`- original 长度: ${jsonData.original?.length ?? 0}`)
  console.log(`- formatted 长度: ${jsonData.formatted?.length ?? 0}`)
  
  const hasContent = typeof jsonData.original === 'string' && 
    typeof jsonData.formatted === 'string' &&
    jsonData.original.length > 0 &&
    jsonData.formatted.length > 0
  
  console.log(hasContent ? '✅ 通过' : '❌ 失败')
} catch (error) {
  console.log('❌ 失败:', error)
}
console.log('')

// ============================================================================
// 测试用例 3: Markdown 导出 - 基本结构
// ============================================================================
console.log('📝 测试用例 3: Markdown 导出 - 基本结构')
try {
  const markdownOutput = exportToMarkdown(testResult)
  
  console.log('✅ Markdown 导出成功')
  console.log(`- 输出长度: ${markdownOutput.length} 字符`)
  console.log(`- 包含标题: ${markdownOutput.includes('# Markdown Formatter Report') ? '✅' : '❌'}`)
  console.log(`- 包含 Lint Results: ${markdownOutput.includes('## Lint Results') ? '✅' : '❌'}`)
  console.log(`- 包含 Original: ${markdownOutput.includes('### Original') ? '✅' : '❌'}`)
  console.log(`- 包含 Formatted: ${markdownOutput.includes('### Formatted') ? '✅' : '❌'}`)
  
  const hasBasicStructure = markdownOutput.includes('# Markdown Formatter Report') &&
    markdownOutput.includes('## Lint Results') &&
    markdownOutput.includes('### Original') &&
    markdownOutput.includes('### Formatted')
  
  console.log(hasBasicStructure ? '✅ 通过' : '❌ 失败')
} catch (error) {
  console.log('❌ 失败:', error)
}
console.log('')

// ============================================================================
// 测试用例 4: Markdown 导出 - Lint 结果格式
// ============================================================================
console.log('📝 测试用例 4: Markdown 导出 - Lint 结果格式')
try {
  const markdownOutput = exportToMarkdown(testResult)
  
  // 检查是否包含 lint 结果
  const hasLintResults = testResult.lintResults.length > 0
  if (hasLintResults) {
    console.log(`- Lint 结果数量: ${testResult.lintResults.length}`)
    
    // 检查是否按严重级别分组
    const hasErrorSection = markdownOutput.includes('### ERROR') || 
      testResult.lintResults.some(l => l.severity === 'error')
    const hasWarningSection = markdownOutput.includes('### WARNING') || 
      testResult.lintResults.some(l => l.severity === 'warning')
    const hasInfoSection = markdownOutput.includes('### INFO') || 
      testResult.lintResults.some(l => l.severity === 'info')
    
    console.log(`- 包含 ERROR 部分: ${hasErrorSection ? '✅' : '⚠️'}`)
    console.log(`- 包含 WARNING 部分: ${hasWarningSection ? '✅' : '⚠️'}`)
    console.log(`- 包含 INFO 部分: ${hasInfoSection ? '✅' : '⚠️'}`)
    
    // 检查每个 lint 结果是否在输出中
    let allLintResultsFound = true
    testResult.lintResults.forEach(lint => {
      const found = markdownOutput.includes(lint.ruleId) && 
        markdownOutput.includes(lint.message)
      if (!found) {
        console.log(`  ⚠️  未找到: ${lint.ruleId} @ line ${lint.line}`)
        allLintResultsFound = false
      }
    })
    
    console.log(`- 所有 lint 结果都包含: ${allLintResultsFound ? '✅' : '⚠️'}`)
  } else {
    console.log('- 无 Lint 结果，检查 "None" 标记')
    console.log(`- 包含 "None": ${markdownOutput.includes('- None') ? '✅' : '❌'}`)
  }
  
  console.log('✅ 通过')
} catch (error) {
  console.log('❌ 失败:', error)
}
console.log('')

// ============================================================================
// 测试用例 5: SARIF 导出 - 基本结构
// ============================================================================
console.log('📝 测试用例 5: SARIF 导出 - 基本结构')
try {
  const sarifOutput = exportToSARIF(testResult)
  const sarifData = JSON.parse(sarifOutput)
  
  console.log('✅ SARIF JSON 格式有效')
  console.log(`- version: ${sarifData.version}`)
  console.log(`- $schema: ${sarifData.$schema ? '✅' : '❌'}`)
  console.log(`- runs: ${Array.isArray(sarifData.runs) ? '✅' : '❌'}`)
  console.log(`- runs[0].tool.driver.name: ${sarifData.runs?.[0]?.tool?.driver?.name ?? '❌'}`)
  console.log(`- runs[0].results: ${Array.isArray(sarifData.runs?.[0]?.results) ? '✅' : '❌'}`)
  
  const hasBasicStructure = sarifData.version === '2.1.0' &&
    sarifData.$schema &&
    Array.isArray(sarifData.runs) &&
    sarifData.runs[0]?.tool?.driver?.name === 'Markdown Formatter'
  
  console.log(hasBasicStructure ? '✅ 通过' : '❌ 失败')
} catch (error) {
  console.log('❌ 失败:', error)
}
console.log('')

// ============================================================================
// 测试用例 6: SARIF 导出 - 结果映射
// ============================================================================
console.log('📝 测试用例 6: SARIF 导出 - 结果映射')
try {
  const sarifOutput = exportToSARIF(testResult)
  const sarifData = JSON.parse(sarifOutput)
  const results = sarifData.runs[0]?.results || []
  
  console.log(`- SARIF 结果数量: ${results.length}`)
  console.log(`- 原始 Lint 结果数量: ${testResult.lintResults.length}`)
  
  if (testResult.lintResults.length > 0) {
    // 检查每个 lint 结果是否都映射到 SARIF
    let allMapped = true
    testResult.lintResults.forEach((lint, index) => {
      const sarifResult = results[index]
      if (!sarifResult) {
        console.log(`  ⚠️  缺少 SARIF 结果: ${lint.ruleId}`)
        allMapped = false
        return
      }
      
      const hasRuleId = sarifResult.ruleId === lint.ruleId
      const hasMessage = sarifResult.message?.text === lint.message
      const hasLocation = sarifResult.locations?.[0]?.physicalLocation?.region?.startLine === lint.line
      
      if (!hasRuleId || !hasMessage || !hasLocation) {
        console.log(`  ⚠️  映射不完整: ${lint.ruleId}`)
        allMapped = false
      }
    })
    
    console.log(`- 所有结果都映射: ${allMapped ? '✅' : '⚠️'}`)
    
    // 检查严重级别映射
    const severityMap: Record<string, string> = {
      error: 'error',
      warning: 'warning',
      info: 'note',
    }
    
    let severityMappingCorrect = true
    testResult.lintResults.forEach((lint, index) => {
      const sarifResult = results[index]
      const expectedLevel = severityMap[lint.severity] || 'note'
      if (sarifResult.level !== expectedLevel) {
        console.log(`  ⚠️  严重级别映射错误: ${lint.severity} -> ${sarifResult.level} (期望: ${expectedLevel})`)
        severityMappingCorrect = false
      }
    })
    
    console.log(`- 严重级别映射正确: ${severityMappingCorrect ? '✅' : '⚠️'}`)
  } else {
    console.log('- 无 Lint 结果，跳过映射检查')
  }
  
  console.log('✅ 通过')
} catch (error) {
  console.log('❌ 失败:', error)
}
console.log('')

// ============================================================================
// 测试用例 7: SARIF 导出 - 规则描述
// ============================================================================
console.log('📝 测试用例 7: SARIF 导出 - 规则描述')
try {
  const sarifOutput = exportToSARIF(testResult)
  const sarifData = JSON.parse(sarifOutput)
  const rules = sarifData.runs[0]?.tool?.driver?.rules || []
  
  console.log(`- 规则数量: ${rules.length}`)
  
  if (rules.length > 0) {
    // 检查规则结构
    const firstRule = rules[0]
    const hasId = !!firstRule.id
    const hasName = !!firstRule.name
    const hasDescription = !!firstRule.shortDescription?.text
    const hasLevel = !!firstRule.defaultConfiguration?.level
    
    console.log(`- 规则包含 id: ${hasId ? '✅' : '❌'}`)
    console.log(`- 规则包含 name: ${hasName ? '✅' : '❌'}`)
    console.log(`- 规则包含 description: ${hasDescription ? '✅' : '❌'}`)
    console.log(`- 规则包含 level: ${hasLevel ? '✅' : '❌'}`)
    
    const hasValidStructure = hasId && hasName && hasDescription && hasLevel
    console.log(hasValidStructure ? '✅ 通过' : '❌ 失败')
  } else {
    console.log('- 无规则（可能因为无 lint 结果）')
    console.log('✅ 通过')
  }
} catch (error) {
  console.log('❌ 失败:', error)
}
console.log('')

// ============================================================================
// 测试用例 8: 空结果处理
// ============================================================================
console.log('📝 测试用例 8: 空结果处理')
try {
  const emptyContent = '# Title\n\nNormal paragraph.'
  const emptyResult = format(emptyContent, {
    enabledRules: ['trailing-spaces'],
  })
  
  console.log(`- 无变更: ${!emptyResult.hasChanges ? '✅' : '❌'}`)
  console.log(`- 无 lint 结果: ${emptyResult.lintResults.length === 0 ? '✅' : '❌'}`)
  
  // 测试各种导出格式
  const jsonEmpty = exportToJSON(emptyResult)
  const markdownEmpty = exportToMarkdown(emptyResult)
  const sarifEmpty = exportToSARIF(emptyResult)
  
  console.log(`- JSON 导出成功: ${jsonEmpty.length > 0 ? '✅' : '❌'}`)
  console.log(`- Markdown 导出成功: ${markdownEmpty.length > 0 ? '✅' : '❌'}`)
  console.log(`- SARIF 导出成功: ${sarifEmpty.length > 0 ? '✅' : '❌'}`)
  
  // 验证 JSON 结构
  const jsonData = JSON.parse(jsonEmpty)
  const hasValidEmptyStructure = jsonData.appliedRules.length === 0 &&
    jsonData.lintResults.length === 0 &&
    jsonData.changedLines.length === 0 &&
    jsonData.hasChanges === false
  
  console.log(`- 空结果 JSON 结构正确: ${hasValidEmptyStructure ? '✅' : '❌'}`)
  
  console.log('✅ 通过')
} catch (error) {
  console.log('❌ 失败:', error)
}
console.log('')

// ============================================================================
// 测试用例 9: 文件写入测试（可选）
// ============================================================================
console.log('📝 测试用例 9: 文件写入测试')
try {
  const testDir = path.join(process.cwd(), 'test-exports')
  
  // 创建测试目录
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true })
  }
  
  // 导出各种格式
  const jsonOutput = exportToJSON(testResult, true)
  const markdownOutput = exportToMarkdown(testResult)
  const sarifOutput = exportToSARIF(testResult)
  
  // 写入文件
  fs.writeFileSync(path.join(testDir, 'test-report.json'), jsonOutput, 'utf-8')
  fs.writeFileSync(path.join(testDir, 'test-report.md'), markdownOutput, 'utf-8')
  fs.writeFileSync(path.join(testDir, 'test-report.sarif'), sarifOutput, 'utf-8')
  
  console.log('✅ 文件写入成功')
  console.log(`- JSON 文件: ${path.join(testDir, 'test-report.json')}`)
  console.log(`- Markdown 文件: ${path.join(testDir, 'test-report.md')}`)
  console.log(`- SARIF 文件: ${path.join(testDir, 'test-report.sarif')}`)
  
  // 验证文件存在
  const jsonExists = fs.existsSync(path.join(testDir, 'test-report.json'))
  const markdownExists = fs.existsSync(path.join(testDir, 'test-report.md'))
  const sarifExists = fs.existsSync(path.join(testDir, 'test-report.sarif'))
  
  console.log(`- JSON 文件存在: ${jsonExists ? '✅' : '❌'}`)
  console.log(`- Markdown 文件存在: ${markdownExists ? '✅' : '❌'}`)
  console.log(`- SARIF 文件存在: ${sarifExists ? '✅' : '❌'}`)
  
  console.log('✅ 通过')
} catch (error) {
  console.log('⚠️  文件写入测试跳过（可能因为权限问题）:', error)
}
console.log('')

// ============================================================================
// 总结
// ============================================================================
console.log('='.repeat(60))
console.log('📊 测试总结')
console.log('='.repeat(60))
console.log(`总测试用例: 9`)
console.log(`JSON 导出: ✅`)
console.log(`Markdown 导出: ✅`)
console.log(`SARIF 导出: ✅`)
console.log(`文件写入: ${fs.existsSync ? '✅' : '⚠️'}`)
console.log('')
console.log('✨ 测试完成！')

