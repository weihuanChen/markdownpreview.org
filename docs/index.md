# Markdown Preview 项目文档索引

欢迎查阅 Markdown Preview 项目的文档中心。本索引按照文档组织规则分类整理。

---

## 📁 文档分类目录

根据项目的文档管理规则，所有文档归档在以下六个维度的目录中：

### 🎯 产品 (Product) - `docs/product/`

包含需求文档、功能定义、用户故事、市场分析、用户反馈和版本迭代计划等。

#### 主要文档

- [多语言文案管理文档](./product/i18n-content.md)
  - FAQ 三语文案对照表
  - Footer 三语文案对照表
  - DEFAULT_MARKDOWN 模板说明
  - 文案更新流程和风格指南

---

### 💻 开发 (Development) - `docs/dev/`

包含代码架构、技术选型、接口文档、编码规范、技术设计和底层逻辑实现等。

#### 主要文档

- [i18n 技术实施文档](./dev/i18n-implementation.md)
  - next-intl 配置说明
  - 翻译文件管理规范
  - 如何添加新的翻译键
  - 如何添加新语言
  - 组件中使用 i18n 的方法
  - 语言切换和持久化实现

- [SEO 配置文档](./dev/seo-configuration.md)
  - robots.txt 和 sitemap.xml 配置
  - Hreflang 标签和 Canonical URL
  - Open Graph 和 Twitter Card
  - 多语言 SEO 最佳实践
  - 日语优先收录策略

- [Blog 代码块显示逻辑](./dev/blog-code-block-rendering.md)
  - Streamdown 配置说明
  - 代码高亮主题配置
  - CSS 样式实现
  - 已知问题和优化建议

- [博客性能优化和 500 错误修复](./dev/blog-performance-fix.md)
  - N+1 查询问题修复
  - 缓存层实现
  - 错误处理增强
  - 性能对比和优化效果

---

### 🚀 部署 (Deployment) - `docs/deploy/`

包含 CI/CD 流程、环境配置、服务器配置、运维手册、发布流程和回滚策略等。

#### 主要文档

*暂无文档*

---

### 🎨 UI/设计 (UI/Design) - `docs/ui-design/`

包含设计规范、界面草图、高保真原型、视觉资源、品牌指南和交互设计说明等。

#### 主要文档

*暂无文档*

---

### ⚡ 优化 (Optimization) - `docs/optimization/`

包含性能优化报告、代码重构计划、数据库调优记录、资源消耗分析和效率提升方案等。

#### 主要文档

*暂无文档*

---

### 🧪 测试 (Testing) - `docs/testing/`

包含测试计划、测试用例、测试报告、缺陷记录和质量保障流程等。

#### 主要文档

*暂无文档*

---

## 🔍 快速导航

### 按主题查找

#### 国际化 (i18n)

- **技术实施**: [docs/dev/i18n-implementation.md](./dev/i18n-implementation.md)
- **文案管理**: [docs/product/i18n-content.md](./product/i18n-content.md)

#### Markdown 编辑器

*待补充*

#### 性能优化

- **博客性能优化**: [docs/dev/blog-performance-fix.md](./dev/blog-performance-fix.md)
  - 修复博客加载慢和 GSC 500 错误
  - 缓存策略和查询优化

---

## 📊 文档统计

| 类别 | 文档数量 |
|-----|---------|
| 产品 | 1 |
| 开发 | 3 |
| 部署 | 0 |
| UI/设计 | 0 |
| 优化 | 0 |
| 测试 | 0 |
| **总计** | **4** |

---

## 📝 文档贡献指南

### 新增文档

1. 根据文档内容选择合适的分类目录（产品/开发/部署/ui设计/优化/测试）
2. 在对应目录下创建 Markdown 文件
3. 更新本索引文档，添加新文档的链接和简介
4. 确保文档包含以下元素：
   - 清晰的标题和目录结构
   - 最后更新日期
   - 维护者信息
   - 相关文档的交叉引用

### 文档命名规范

- 使用小写字母和连字符（kebab-case）
- 使用有意义的描述性名称
- 示例：`i18n-implementation.md`、`api-documentation.md`

### 文档格式要求

- 使用 Markdown 格式
- 标题层级清晰（H1 > H2 > H3）
- 包含代码示例时使用语法高亮
- 适当使用表格、列表提高可读性

---

## 🔗 相关资源

### 外部文档

- [Next.js 官方文档](https://nextjs.org/docs)
- [next-intl 文档](https://next-intl-docs.vercel.app/)
- [Markdown 指南](https://www.markdownguide.org/)

### 项目仓库

- GitHub: *（待添加）*
- 项目主页: *（待添加）*

---

## 📅 更新日志

### 2025-01-XX

- ✅ 添加博客性能优化和 500 错误修复文档

### 2025-01-27

- ✅ 添加 Blog 代码块显示逻辑文档

### 2025-11-13

- ✅ 创建文档索引结构
- ✅ 添加 i18n 技术实施文档
- ✅ 添加多语言文案管理文档

---

**维护者**: 开发团队
**最后更新**: 2025-11-13
