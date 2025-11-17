# Directus Blog 表结构文档

**文档版本**: 1.0  
**最后更新**: 2025-01-XX  
**用途**: 标准化接入指南 - 表结构参考

---

## 📋 概述

本文档详细说明 Directus CMS 中 Blog 系统所需的表结构，用于标准化接入。所有新网站接入同一 Directus 实例时，应遵循此表结构规范。

---

## 🗄️ 核心表结构

### 1. `posts` - 文章主表

**说明**: 存储文章的核心信息，日语内容存储在主表中。

#### 字段定义

| 字段名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `id` | UUID | ✅ | 主键 | `"550e8400-e29b-41d4-a716-446655440000"` |
| `slug` | String | ✅ | URL 友好标识符，唯一 | `"understanding-json"` |
| `title` | String | ✅ | 文章标题（日语） | `"JSON の理解"` |
| `description` | Text | ✅ | 文章描述（日语） | `"JSON 形式の基礎を学ぶ"` |
| `content` | Text | ✅ | 文章内容（Markdown，日语） | `"# JSON とは..."` |
| `published_at` | DateTime | ✅ | 发布时间 | `"2025-01-15T10:00:00Z"` |
| `site_id` | Integer | ✅ | 站点 ID（多站点支持） | `3` |
| `status` | Enum | ✅ | 状态：`draft` / `published` / `archived` | `"published"` |
| `post_tags` | M2M Relation | ❌ | 多对多关系：关联到 `tags` 表 | 见下方说明 |
| `post_recommend` | M2M Self-Relation | ❌ | 推荐文章（自关联） | 见下方说明 |
| `tags` | JSON Array | ❌ | 旧字段，作为 fallback | `["JSON", "教程"]` |
| `image` | String | ❌ | 封面图片 URL | `"/images/blog-cover.jpg"` |
| `view_count` | Integer | ❌ | 总浏览量 | `1250` |
| `unique_view_count` | Integer | ❌ | 独立访客数 | `890` |
| `last_viewed_at` | DateTime | ❌ | 最后访问时间 | `"2025-01-15T12:00:00Z"` |
| `date_created` | DateTime | ❌ | 创建时间 | `"2025-01-10T08:00:00Z"` |
| `date_updated` | DateTime | ❌ | 更新时间 | `"2025-01-15T10:00:00Z"` |

#### M2M 关系说明

**`post_tags` (Many-to-Many)**
- **关系类型**: Many-to-Many
- **关联表**: `tags`
- **中间表**: `post_tags` (自动生成)
- **返回结构**: `[{ tags_id: 25 }, { tags_id: 26 }]`
- **查询方式**: 在查询时使用 `'post_tags'` 字段，返回 M2M 关系对象数组

**`post_recommend` (Many-to-Many Self-Relation)**
- **关系类型**: Many-to-Many (Self)
- **关联表**: `posts` (自身)
- **中间表**: `post_recommend` (自动生成)
- **返回结构**: `[{ related_posts_id: "uuid1" }, { related_posts_id: "uuid2" }]`
- **用途**: 推荐文章列表

---

### 2. `post_translation` - 文章翻译表

**说明**: 存储非日语（英语、中文、西班牙语）的翻译内容。

#### 字段定义

| 字段名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `id` | Integer | ✅ | 主键 | `1` |
| `post_id` | UUID | ✅ | 关联到 `posts.id` | `"550e8400-..."` |
| `language_code` | String | ✅ | 语言代码：`en` / `zh` / `es` | `"en"` |
| `title` | String | ✅ | 翻译后的标题 | `"Understanding JSON"` |
| `description` | Text | ✅ | 翻译后的描述 | `"Learn the basics of JSON"` |
| `content` | Text | ✅ | 翻译后的内容（Markdown） | `"# What is JSON..."` |
| `tags` | JSON Array | ❌ | 旧字段，作为 fallback | `["JSON", "Tutorial"]` |
| `date_created` | DateTime | ❌ | 创建时间 | `"2025-01-10T08:00:00Z"` |
| `date_updated` | DateTime | ❌ | 更新时间 | `"2025-01-15T10:00:00Z"` |

#### 关系说明

- **关系类型**: One-to-Many (O2M)
- **关联**: `post_translation.post_id` → `posts.id`
- **注意**: 不存在反向关系字段（无法使用嵌套查询）

---

### 3. `tags` - 标签主表

**说明**: 存储标签的基础信息，英文名称作为默认值。

#### 字段定义

| 字段名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `id` | Integer | ✅ | 主键 | `25` |
| `name` | String | ✅ | 标签名称（英文，默认） | `"JSON"` |
| `slug` | String | ✅ | URL 友好标识符，唯一 | `"json"` |

---

### 4. `tags_translation` - 标签翻译表

**说明**: 存储标签的多语言翻译。

#### 字段定义

| 字段名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `id` | Integer | ✅ | 主键 | `1` |
| `tag_id` | Integer | ✅ | 关联到 `tags.id` | `25` |
| `language_code` | String | ✅ | 语言代码：`en` / `ja` / `zh` / `es` | `"ja"` |
| `translated_name` | String | ✅ | 翻译后的标签名称 | `"JSON"` |

#### 关系说明

- **关系类型**: One-to-Many (O2M)
- **关联**: `tags_translation.tag_id` → `tags.id`
- **支持语言**: `en`, `ja`, `zh`, `es`

---

### 5. `sites` - 站点表（多站点支持）

**说明**: 支持多个网站共享同一 Directus 实例。

#### 字段定义

| 字段名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `id` | Integer | ✅ | 主键 | `3` |
| `site_name` | String | ✅ | 站点名称 | `"JSON Beauty"` |
| `domain` | String | ✅ | 站点域名 | `"jsonbeauty.com"` |
| `date_created` | DateTime | ❌ | 创建时间 | `"2025-01-01T00:00:00Z"` |
| `date_updated` | DateTime | ❌ | 更新时间 | `"2025-01-15T10:00:00Z"` |

---

## 🔗 表关系图

```
posts (主表)
├── post_tags (M2M) → tags
├── post_recommend (M2M Self) → posts
└── post_translation (O2M) ← post_translation.post_id

tags (主表)
└── tags_translation (O2M) ← tags_translation.tag_id

sites (站点表)
└── posts.site_id → sites.id
```

---

## 📝 数据示例

### posts 表示例

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "slug": "understanding-json",
  "title": "JSON の理解",
  "description": "JSON 形式の基礎を学ぶ",
  "content": "# JSON とは\n\nJSON は...",
  "published_at": "2025-01-15T10:00:00Z",
  "site_id": 3,
  "status": "published",
  "post_tags": [
    { "tags_id": 25 },
    { "tags_id": 26 }
  ],
  "post_recommend": [
    { "related_posts_id": "uuid-1" },
    { "related_posts_id": "uuid-2" }
  ],
  "tags": ["JSON", "教程"],
  "image": "/images/blog-cover.jpg",
  "view_count": 1250,
  "unique_view_count": 890
}
```

### post_translation 表示例

```json
{
  "id": 1,
  "post_id": "550e8400-e29b-41d4-a716-446655440000",
  "language_code": "en",
  "title": "Understanding JSON",
  "description": "Learn the basics of JSON",
  "content": "# What is JSON\n\nJSON is...",
  "tags": ["JSON", "Tutorial"]
}
```

### tags 表示例

```json
{
  "id": 25,
  "name": "JSON",
  "slug": "json"
}
```

### tags_translation 表示例

```json
{
  "id": 1,
  "tag_id": 25,
  "language_code": "ja",
  "translated_name": "JSON"
}
```

---

## ⚠️ 重要注意事项

### 1. M2M 关系数据结构

**查询返回格式**:
```typescript
// 查询 posts 时，post_tags 字段返回：
post_tags: [
  { tags_id: 25 },
  { tags_id: 26 }
]

// 不是简单的数组：
// ❌ post_tags: [25, 26]  // 错误理解
```

### 2. 多语言策略

- **日语 (ja)**: 存储在 `posts` 主表
- **其他语言 (en/zh/es)**: 存储在 `post_translation` 表
- **查询逻辑**: 先查主表，再查翻译表，最后合并

### 3. 站点隔离

- 所有查询必须包含 `site_id` 过滤条件
- 确保多站点数据隔离

### 4. 状态过滤

- 所有公开查询必须过滤 `status: 'published'`
- 草稿和归档文章不应出现在公开页面

---

## 🔧 Directus 配置要求

### 权限配置

1. **Public Role** 需要以下权限：
   - `posts`: Read (filter: `status = published`)
   - `post_translation`: Read
   - `tags`: Read
   - `tags_translation`: Read
   - `sites`: Read

2. **Content 字段权限**:
   - 列表页查询：不需要 `content` 字段权限
   - 详情页查询：需要 `content` 字段权限

### 关系配置

1. **post_tags (M2M)**:
   - Collection: `posts`
   - Field: `post_tags`
   - Related Collection: `tags`
   - Type: Many-to-Many

2. **post_recommend (M2M Self)**:
   - Collection: `posts`
   - Field: `post_recommend`
   - Related Collection: `posts`
   - Type: Many-to-Many

3. **post_translation (O2M)**:
   - Collection: `post_translation`
   - Field: `post_id`
   - Related Collection: `posts`
   - Type: Many-to-One

4. **tags_translation (O2M)**:
   - Collection: `tags_translation`
   - Field: `tag_id`
   - Related Collection: `tags`
   - Type: Many-to-One

---

## 📚 相关文档

- [Directus Blog 查询逻辑文档](./DIRECTUS_BLOG_QUERY.md)
- [Tags 系统完整文档](./DIRECTUS_BLOG_TAGS.md)
- [优化方案文档](./DIRECTUS_BLOG_OPTIMIZATION.md)
- [标准化接入指南](./DIRECTUS_BLOG_INTEGRATION.md)

---

**文档维护**: 本文档应与 Directus 实例结构保持同步。如有变更，请及时更新。

