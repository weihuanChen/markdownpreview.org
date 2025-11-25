# Blog Revalidation API 标准文档

## 概述

这是一个标准化的 On-Demand Revalidation API，用于在内容更新时自动刷新 Next.js 静态页面缓存。

**适用场景**：
- 博客/CMS 内容更新通知
- 多站点内容同步
- n8n/Zapier 等自动化工作流集成

---

## API 端点规范

### 基本信息

```
POST /api/revalidate
Content-Type: application/json
Authorization: Bearer {REVALIDATE_TOKEN}
```

### 请求格式

#### Headers

| Header | 必需 | 说明 |
|--------|------|------|
| `Authorization` | ✅ | Bearer token 格式：`Bearer {token}` |
| `Content-Type` | ✅ | 必须为 `application/json` |

#### Body (JSON)

```json
{
  "event": "items.update",
  "collection": "posts",
  "key": "post-id-or-slug"
}
```

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `event` | string | ❌ | 事件类型（items.create, items.update, items.delete） |
| `collection` | string | ❌ | 集合名称（posts, pages 等） |
| `key` | string | ❌ | 记录 ID 或 slug |

**注意**：所有 body 字段都是可选的，仅用于日志记录。

---

## 响应格式

### 成功响应 (200 OK)

```json
{
  "revalidated": true,
  "tags": [
    "blog-slugs",
    "blog-posts",
    "blog-search"
  ],
  "timestamp": "2025-11-17T04:16:53.209Z"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `revalidated` | boolean | 是否成功重新验证 |
| `tags` | string[] | 已重新验证的缓存标签列表 |
| `timestamp` | string | ISO 8601 格式的时间戳 |

### 错误响应

#### 401 Unauthorized - 无效 Token

```json
{
  "message": "Invalid token"
}
```

#### 500 Server Error - 服务器配置错误

```json
{
  "message": "Server configuration error"
}
```

#### 500 Server Error - 重新验证失败

```json
{
  "message": "Error revalidating",
  "error": "具体错误信息"
}
```

---

## 安全认证

### Token 生成

使用安全的随机字符串作为 token：

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"

# OpenSSL
openssl rand -base64 32

# 在线工具
# https://generate-secret.vercel.app/32
```

### 环境变量配置

在 `.env.local` 中配置：

```env
REVALIDATE_TOKEN=your-secure-random-token-here
```

**⚠️ 安全建议**：
- Token 长度至少 32 字节
- 使用加密安全的随机数生成器
- 不要将 token 提交到版本控制
- 在生产环境使用环境变量管理

---

## 集成示例

### 1. cURL 测试

```bash
curl -X POST "https://your-domain.com/api/revalidate" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "items.update",
    "collection": "posts",
    "key": "my-blog-post"
  }'
```

### 2. Directus Webhook

**设置步骤**：

1. 进入 Directus 后台
2. Settings → Webhooks → Create New
3. 配置如下：

| 字段 | 值 |
|------|-----|
| Name | Revalidate Blog Posts |
| Status | Active |
| Method | POST |
| URL | `https://your-domain.com/api/revalidate` |
| Triggers | `items.create`, `items.update`, `items.delete` |
| Collections | `posts` |

4. 添加 Header：
   - Key: `Authorization`
   - Value: `Bearer YOUR_TOKEN_HERE`

### 3. n8n 工作流

#### 方案 A: 单站点触发

```json
{
  "nodes": [
    {
      "parameters": {
        "method": "POST",
        "url": "https://your-domain.com/api/revalidate",
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "Bearer YOUR_TOKEN_HERE"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "event",
              "value": "={{ $json.event }}"
            },
            {
              "name": "collection",
              "value": "={{ $json.collection }}"
            },
            {
              "name": "key",
              "value": "={{ $json.key }}"
            }
          ]
        }
      },
      "name": "Revalidate Site",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 1
    }
  ]
}
```

#### 方案 B: 多站点批量通知

**节点配置**：

1. **Webhook 触发器** (接收 Directus 通知)
   ```
   Webhook URL: https://your-n8n.com/webhook/blog-update
   Method: POST
   ```

2. **数据提取** (Extract event data)
   ```javascript
   {
     event: $json.event,
     collection: $json.collection,
     key: $json.key
   }
   ```

3. **Split In Batches** (遍历所有站点)
   ```javascript
   // 站点配置列表
   [
     {
       "name": "16to10",
       "url": "https://16to10.com/api/revalidate",
       "token": "token_for_16to10"
     },
     {
       "name": "site2",
       "url": "https://site2.com/api/revalidate",
       "token": "token_for_site2"
     }
   ]
   ```

4. **HTTP Request** (并发调用所有站点)
   ```
   Method: POST
   URL: {{ $json.url }}
   Headers:
     - Authorization: Bearer {{ $json.token }}
   Body:
     - event: {{ $node["Extract Data"].json.event }}
     - collection: {{ $node["Extract Data"].json.collection }}
     - key: {{ $node["Extract Data"].json.key }}
   ```

5. **汇总结果** (可选)
   ```javascript
   {
     totalSites: $items.length,
     successful: $items.filter(item => item.json.revalidated).length,
     failed: $items.filter(item => !item.json.revalidated).length,
     results: $items.map(item => ({
       site: item.json.siteName,
       status: item.json.revalidated ? 'success' : 'failed'
     }))
   }
   ```

### 4. JavaScript/TypeScript SDK

```typescript
// revalidate-client.ts
export interface RevalidateRequest {
  event?: string
  collection?: string
  key?: string
}

export interface RevalidateResponse {
  revalidated: boolean
  tags: string[]
  timestamp: string
}

export class RevalidateClient {
  constructor(
    private baseUrl: string,
    private token: string
  ) {}

  async revalidate(data?: RevalidateRequest): Promise<RevalidateResponse> {
    const response = await fetch(`${this.baseUrl}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data || {}),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Revalidation failed: ${error.message}`)
    }

    return response.json()
  }
}

// 使用示例
const client = new RevalidateClient(
  'https://16to10.com',
  'YOUR_TOKEN_HERE'
)

await client.revalidate({
  event: 'items.update',
  collection: 'posts',
  key: 'my-post-slug'
})
```

### 5. Python SDK

```python
# revalidate_client.py
import requests
from typing import Optional, Dict, Any
from datetime import datetime

class RevalidateClient:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url.rstrip('/')
        self.token = token

    def revalidate(
        self,
        event: Optional[str] = None,
        collection: Optional[str] = None,
        key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        触发站点重新验证

        Args:
            event: 事件类型 (items.create, items.update, items.delete)
            collection: 集合名称 (posts, pages 等)
            key: 记录 ID 或 slug

        Returns:
            重新验证响应结果

        Raises:
            requests.HTTPError: 请求失败时抛出
        """
        url = f"{self.base_url}/api/revalidate"
        headers = {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
        data = {}
        if event:
            data['event'] = event
        if collection:
            data['collection'] = collection
        if key:
            data['key'] = key

        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()

        return response.json()

# 使用示例
client = RevalidateClient(
    'https://16to10.com',
    'YOUR_TOKEN_HERE'
)

result = client.revalidate(
    event='items.update',
    collection='posts',
    key='my-post-slug'
)

print(f"Revalidated: {result['revalidated']}")
print(f"Tags: {', '.join(result['tags'])}")
```

---

## 多站点配置指南

### 场景：中心化内容管理

**架构**：
```
Directus CMS (中央)
    ↓ Webhook
n8n (内容分发中心)
    ↓ 并发调用
┌────────┬────────┬────────┐
Site A   Site B   Site C   Site D
```

### 配置步骤

#### 1. 为每个站点配置独立 Token

```bash
# 站点 A
REVALIDATE_TOKEN=token_a_xxxxxxxx

# 站点 B
REVALIDATE_TOKEN=token_b_yyyyyyyy

# 站点 C
REVALIDATE_TOKEN=token_c_zzzzzzzz
```

#### 2. 在 n8n 中创建站点配置表

创建一个 JSON 配置文件或数据库表：

```json
{
  "sites": [
    {
      "id": "16to10",
      "name": "16进制转换工具",
      "url": "https://16to10.com/api/revalidate",
      "token": "RvoKbqKRK9QlbUJiYks7qKie9bJ2Ud6ymYcPZeu2axg",
      "enabled": true,
      "collections": ["posts", "tutorials"]
    },
    {
      "id": "site2",
      "name": "站点2",
      "url": "https://site2.com/api/revalidate",
      "token": "another_token_here",
      "enabled": true,
      "collections": ["posts"]
    }
  ]
}
```

#### 3. n8n 工作流配置

**触发条件**：
- Directus Webhook 触发
- 定时任务（每小时检查更新）
- 手动触发（测试用）

**处理逻辑**：
1. 接收 Directus 事件
2. 过滤符合条件的站点（根据 collection）
3. 并发调用所有站点的 revalidate API
4. 记录结果（成功/失败）
5. 发送通知（可选）

---

## 监控与日志

### 服务器端日志

API 会自动记录以下信息：

**成功日志**：
```
Revalidation triggered: {
  event: 'items.update',
  collection: 'posts',
  key: 'my-post-slug',
  timestamp: '2025-11-17T04:16:53.209Z'
}
Successfully revalidated tags: blog-slugs, blog-posts, blog-search
```

**失败日志**：
```
Invalid revalidation token attempt
Error during revalidation: [错误详情]
```

### 监控建议

1. **设置告警**：
   - Token 验证失败次数过多
   - 重新验证失败率超过阈值

2. **性能监控**：
   - API 响应时间
   - 重新验证执行时间

3. **日志聚合**：
   - 使用 Vercel Analytics
   - 或自建 ELK/Loki stack

---

## 故障排查

### 问题 1: 401 Unauthorized

**原因**：
- Token 不匹配
- Token 格式错误（缺少 "Bearer " 前缀）
- 环境变量未设置

**解决方案**：
```bash
# 检查环境变量
echo $REVALIDATE_TOKEN

# 检查请求格式
Authorization: Bearer YOUR_TOKEN_HERE
# 注意：Bearer 后面有空格
```

### 问题 2: 500 Server Error

**原因**：
- 服务器未设置 REVALIDATE_TOKEN 环境变量
- 内部错误（检查服务器日志）

**解决方案**：
1. 检查 Vercel 环境变量配置
2. 查看服务器日志
3. 验证 Next.js 版本是否支持 revalidateTag

### 问题 3: 更新未生效

**原因**：
- CDN 缓存未清除
- 页面未真正重新生成

**解决方案**：
1. 检查是否调用了正确的 API 端点
2. 确认响应中 `revalidated: true`
3. 等待几秒钟后刷新页面（硬刷新 Cmd+Shift+R）
4. 检查页面是否使用了正确的缓存标签

### 问题 4: n8n 调用超时

**原因**：
- 站点响应慢
- 网络问题

**解决方案**：
1. 增加 HTTP 请求超时时间（默认 10s → 30s）
2. 使用重试机制
3. 添加错误处理节点

---

## 最佳实践

### 1. 安全性

✅ **推荐**：
- 使用强随机 token（32+ 字节）
- 定期轮换 token
- 仅允许可信来源调用
- 使用 HTTPS

❌ **避免**：
- 在代码中硬编码 token
- 使用简单密码作为 token
- 暴露 token 到前端代码

### 2. 性能优化

✅ **推荐**：
- 使用批量操作（一次更新多篇文章）
- 设置合理的缓存标签粒度
- 避免过于频繁的调用

❌ **避免**：
- 每次小修改都触发重新验证
- 重新验证整个站点
- 在高流量时段批量更新

### 3. 可靠性

✅ **推荐**：
- 实现重试机制（指数退避）
- 记录详细日志
- 设置监控告警
- 使用幂等性设计

❌ **避免**：
- 忽略错误响应
- 无限重试
- 缺少日志记录

---

## 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2025-11-17 | 初始版本，支持基本重新验证功能 |

---

## 许可证

MIT License

---

## 支持

遇到问题？

1. 查看本文档的故障排查部分
2. 检查服务器日志
3. 提交 Issue 到项目仓库

---

**文档维护者**: @16to10-converter
**最后更新**: 2025-11-17
