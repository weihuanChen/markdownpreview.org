# Word Diff / Intraline Diff 实现难度评估

## 一、当前实现状态

### 1.1 现有技术栈
- **react-diff-view**: v3.3.2 - 已集成，支持 word-level diff
- **diff**: v8.0.2 - 用于行级 diff 计算
- **gitdiff-parser**: v0.3.1 - 解析 diff 结果
- **Web Worker**: 已在 `line-diff-worker.ts` 中实现

### 1.2 当前实现方式
- 使用 `markEdits(filteredHunks, { type: "block" })` 进行块级差异标记
- 行级 diff 计算在 Web Worker 中完成
- Token 化在主线程完成

## 二、实现难度评估

### 2.1 总体难度：**中等偏低** ⭐⭐⭐☆☆

### 2.2 难度分解

#### ✅ **简单部分（已完成 80%）**

1. **基础框架已就绪**
   - `react-diff-view` 库已集成并正常工作
   - Web Worker 架构已建立
   - UI 组件结构完整

2. **API 支持**
   - `react-diff-view` 的 `markEdits` 函数原生支持 `type: "word"` 选项
   - 无需引入新的依赖库

#### ⚠️ **中等难度部分（需要 2-4 小时）**

1. **修改 markEdits 参数**
   ```typescript
   // 当前代码 (components/markdown-diff.tsx:108)
   enhancers: [markEdits(filteredHunks, { type: "block" })]
   
   // 需要改为
   enhancers: [markEdits(filteredHunks, { type: "word" })]
   ```

2. **样式调整**
   - 需要确保 word-level 高亮样式正确显示
   - 当前已有 `--diff-code-insert-edit-background-color` 和 `--diff-code-delete-edit-background-color` CSS 变量
   - 可能需要微调颜色对比度

3. **中文分词处理**
   - `react-diff-view` 默认的 word diff 基于空格分词
   - 中文文本没有空格分隔，可能需要自定义 tokenizer
   - **可选优化**：集成中文分词库（如 `jieba` 或 `nodejieba`）

#### 🔧 **潜在挑战（可选优化）**

1. **性能考虑**
   - Word-level diff 比 block-level 计算量更大
   - 对于大文件（>1000 行），可能需要优化
   - 当前 Web Worker 架构可以缓解主线程压力

2. **中文分词优化**
   - 如果用户主要处理中文内容，建议集成中文分词
   - 可以使用 `diff` 库的字符级 diff 作为备选方案
   - 或者自定义 tokenizer 函数

## 三、实现方案

### 3.1 方案 A：快速实现（推荐）⭐

**时间估算：1-2 小时**

**步骤：**
1. 修改 `markEdits` 参数从 `type: "block"` 改为 `type: "word"`
2. 测试英文文本的 word diff 效果
3. 调整 CSS 样式确保高亮清晰可见
4. 测试中文文本（可能效果不理想，但基本可用）

**优点：**
- 实现快速，改动最小
- 对英文内容效果良好
- 无需引入新依赖

**缺点：**
- 中文分词可能不够精确（按字符而非词）

### 3.2 方案 B：完整优化（可选）

**时间估算：4-6 小时**

**步骤：**
1. 实现方案 A 的所有步骤
2. 集成中文分词库（如 `nodejieba`）
3. 自定义 tokenizer 函数，支持中英文混合
4. 在 Web Worker 中进行分词预处理
5. 优化大文件性能

**优点：**
- 中文分词更精确
- 用户体验更好

**缺点：**
- 需要引入新依赖（增加 bundle 大小）
- 实现复杂度更高

## 四、代码改动点

### 4.1 必须修改的文件

1. **`components/markdown-diff.tsx`** (1 处修改)
   - 第 108 行：`type: "block"` → `type: "word"`

### 4.2 可选修改的文件

1. **`components/markdown-diff.tsx`** (样式调整)
   - 第 160-161 行：调整 word-level 高亮颜色

2. **`lib/workers/line-diff-worker.ts`** (如果采用方案 B)
   - 添加中文分词逻辑
   - 预处理文本为词序列

## 五、测试建议

### 5.1 测试用例

1. **英文文本**
   ```
   Old: "The quick brown fox jumps over the lazy dog"
   New: "The quick red fox jumps over the lazy cat"
   ```
   预期：高亮 "brown"→"red" 和 "dog"→"cat"

2. **中文文本**
   ```
   Old: "这是一个测试文本"
   New: "这是一个示例文本"
   ```
   预期：高亮 "测试"→"示例"（方案 A 可能按字符高亮）

3. **中英文混合**
   ```
   Old: "Hello 世界"
   New: "Hello 地球"
   ```
   预期：高亮 "世界"→"地球"

4. **Markdown 格式**
   - 测试代码块内的差异
   - 测试链接文本的差异
   - 测试列表项的差异

## 六、风险评估

### 6.1 低风险 ✅
- `react-diff-view` 库稳定，word diff 功能成熟
- 现有架构支持此功能扩展

### 6.2 中等风险 ⚠️
- 中文分词效果可能不如预期
- 大文件性能可能下降（但 Web Worker 可缓解）

### 6.3 缓解措施
- 可以先实现方案 A，根据用户反馈决定是否优化
- 添加性能监控，对超大文件给出提示
- 提供切换选项（word diff / block diff）

## 七、推荐实施路径

1. **第一阶段（立即）**：实现方案 A
   - 修改 1 行代码启用 word diff
   - 测试基本功能
   - 预计 1-2 小时

2. **第二阶段（根据反馈）**：优化中文支持
   - 如果用户反馈中文分词不理想
   - 考虑实现方案 B
   - 预计 4-6 小时

3. **第三阶段（可选）**：性能优化
   - 添加大文件处理优化
   - 添加 diff 模式切换选项

## 八、结论

**实现难度：中等偏低** ⭐⭐⭐☆☆

**推荐方案：方案 A（快速实现）**

**预计时间：1-2 小时（基础实现）**

**主要优势：**
- 改动极小，风险低
- 对英文内容效果良好
- 可以快速验证用户需求

**后续优化：**
- 根据实际使用情况决定是否优化中文分词
- 可以添加用户选项切换 diff 模式

