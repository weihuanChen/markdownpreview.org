# Markdown Diff 文件上传功能实现文档

**文档版本**: 1.0  
**最后更新**: 2025-01-XX  
**功能**: 为 markdown-diff 组件添加文件上传和错误处理功能

---

## 📋 功能概述

为 markdown-diff 组件添加了文件上传功能，用户可以通过点击上传按钮选择文件，文件内容会自动填充到对应的编辑器中。

### 实现的功能

1. ✅ **文件上传按钮**
   - 在 source 和 target 编辑器区域分别添加上传按钮
   - 点击按钮打开文件选择器

2. ✅ **文件类型验证**
   - 支持的文件类型：`.md`, `.markdown`, `.txt`, `.json`, `.js`, `.ts`, `.jsx`, `.tsx`, `.css`, `.scss`, `.html`, `.htm`, `.xml`, `.yaml`, `.yml`
   - 也支持所有 `text/*` MIME 类型的文件

3. ✅ **文件大小限制**
   - 最大文件大小：10MB
   - 超过限制会显示错误提示

4. ✅ **错误处理**
   - 文件类型不支持
   - 文件过大
   - 文件读取失败
   - 空文件检测

5. ✅ **用户体验优化**
   - 上传中显示 loading 状态
   - 错误信息显示在编辑器上方
   - 上传成功后自动填充内容到编辑器

---

## 🔧 技术实现

### 1. 文件上传处理函数

```typescript
const handleFileUpload = async (
  file: File | null,
  type: "source" | "target",
): Promise<void> => {
  // 1. 清除之前的错误
  // 2. 设置上传中状态
  // 3. 验证文件（类型、大小、是否为空）
  // 4. 读取文件内容（UTF-8 编码）
  // 5. 设置内容到对应的编辑器
  // 6. 处理错误情况
}
```

### 2. 文件验证逻辑

- **文件类型验证**：检查文件扩展名和 MIME 类型
- **文件大小验证**：限制最大 10MB
- **空文件检测**：检查文件大小是否为 0

### 3. 文件读取

使用 `FileReader` API，以 UTF-8 编码读取文件内容：

```typescript
const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      resolve(content)
    }
    reader.onerror = () => {
      reject(new Error("文件读取失败"))
    }
    reader.readAsText(file, "UTF-8")
  })
}
```

### 4. UI 实现

- 使用隐藏的 `<input type="file">` 元素
- 通过 `ref` 和 `click()` 方法触发文件选择
- 上传按钮显示 loading 状态
- 错误信息显示在编辑器上方

---

## 📝 代码改动

### 修改的文件

1. **`components/markdown-diff.tsx`**
   - 添加文件上传相关的状态管理
   - 实现文件上传处理函数
   - 添加文件验证逻辑
   - 在 UI 中添加上传按钮和错误提示

2. **`messages/zh.json`**, **`messages/en.json`**, **`messages/ja.json`**
   - 添加文件上传相关的翻译文本

### 新增的状态

```typescript
const [uploadError, setUploadError] = useState<{ source?: string; target?: string }>({})
const [isUploading, setIsUploading] = useState<{ source?: boolean; target?: boolean }>({})
const sourceFileInputRef = useRef<HTMLInputElement>(null)
const targetFileInputRef = useRef<HTMLInputElement>(null)
```

### 新增的函数

- `validateFile(file: File): string | null` - 验证文件
- `readFileContent(file: File): Promise<string>` - 读取文件内容
- `handleFileUpload(file: File | null, type: "source" | "target"): Promise<void>` - 处理文件上传
- `handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>, type: "source" | "target")` - 处理文件选择

---

## 🌐 国际化支持

添加了以下翻译键：

- `markdown_diff_upload_file` - "上传文件"
- `markdown_diff_upload_file_hint` - "点击上传或拖拽文件到此处"
- `markdown_diff_upload_success` - "文件上传成功"
- `markdown_diff_upload_error_invalid_type` - "不支持的文件类型，请上传文本文件（.md, .txt, .json 等）"
- `markdown_diff_upload_error_too_large` - "文件过大，最大支持 10MB"
- `markdown_diff_upload_error_read_failed` - "文件读取失败，请重试"
- `markdown_diff_upload_error_empty` - "文件为空"

支持的语言：中文、英文、日文

---

## ✅ 测试建议

### 测试用例

1. **基本功能测试**
   - ✅ 点击上传按钮选择文件
   - ✅ 文件内容正确填充到编辑器
   - ✅ 上传中显示 loading 状态

2. **文件类型测试**
   - ✅ 支持的文件类型可以正常上传
   - ✅ 不支持的文件类型显示错误提示

3. **文件大小测试**
   - ✅ 小文件（<1MB）正常上传
   - ✅ 大文件（>10MB）显示错误提示

4. **错误处理测试**
   - ✅ 空文件显示错误提示
   - ✅ 文件读取失败显示错误提示
   - ✅ 错误信息正确显示在编辑器上方

5. **边界情况测试**
   - ✅ 同时上传两个文件
   - ✅ 上传后再次上传覆盖内容
   - ✅ 上传后手动编辑内容

---

## 🚀 后续优化建议

### 可选功能

1. **拖拽上传**
   - 支持拖拽文件到编辑器区域
   - 添加拖拽高亮效果

2. **文件预览**
   - 显示文件名和文件大小
   - 显示文件类型图标

3. **文件历史记录**
   - 使用 localStorage 保存最近上传的文件
   - 快速选择最近使用的文件

4. **批量上传**
   - 支持一次选择多个文件
   - 自动填充到 source 和 target

---

## 📊 性能考虑

- 文件读取使用异步方式，不会阻塞 UI
- 文件大小限制为 10MB，避免内存溢出
- 错误处理及时，不会影响用户体验

---

## 🔒 安全考虑

- 文件类型验证防止上传恶意文件
- 文件大小限制防止 DoS 攻击
- 文件内容仅在客户端处理，不上传到服务器

---

## 📚 相关文档

- [Word Diff 实现评估](./word-diff-implementation-assessment.md)
- [Markdown Diff 设计文档](./markdown-diff.md)

