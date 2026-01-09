# Next.js Cloudflare 迁移规则 (基于 OpenNext)

## 规则目标 (Objective)

本规则用于指导智能代理（Agent）或开发流程，确保 Next.js 应用使用 `@opennextjs/cloudflare` 适配器成功转换为 Cloudflare Workers 可部署的格式。

## I. 核心要求与技术栈 (Core Requirements)

### 1. 运行时约束 (Runtime Constraint)

- **强制要求：** 目标 Next.js 应用必须使用 **Node.js Runtime**。
- **说明：** OpenNext 的 Cloudflare 适配器旨在利用 Cloudflare Workers 提供的 Node.js API，以支持 Next.js 的全部功能。请避免使用 Next.js 的 Edge Runtime，因为其功能受限。

### 2. Next.js 版本支持 (Version Support)

- **支持范围：** 确认项目使用的 Next.js 版本在以下范围内：
  - Next.js **15** (所有次要和补丁版本)
  - Next.js **14** (最新次要版本)
  - Next.js **16.0.10** (最新次要版本)

### 3. 功能支持 (Supported Features)

- **核心支持：** OpenNext Cloudflare 适配器支持 Next.js 的大多数核心功能，包括：
  - App Router (应用路由) 和 Pages Router (页面路由)
  - Route Handlers (路由处理程序)
  - Dynamic routes (动态路由)
  - Static Site Generation (SSG, 静态站点生成)
  - Server-Side Rendering (SSR, 服务器端渲染)
  - Incremental Static Regeneration (ISR, 增量静态再生)
  - Middleware (中间件)
  - Partial Prerendering (PPR, 部分预渲染)
  - Composable Caching ('use cache' 策略)
- **注意：** Node Middleware (Next.js 15.2 中引入) 尚未得到支持。

## II. 迁移与编译流程 (Migration and Compilation Process)

### 1. 依赖安装 (Dependency Installation)

- 在现有 Next.js 项目中，确保已安装 OpenNext Cloudflare 适配器：

  ```
  npm install @opennextjs/cloudflare
  # 或 yarn add @opennextjs/cloudflare
  ```

### 2. 编译与转换 (Build and Transformation)

- **编译命令：** 必须使用 OpenNext 提供的 CLI 工具进行编译和转换。

- **执行步骤：**

  1. Agent 必须首先确保 `package.json` 中的 `build` 脚本能够正常运行 (`next build`)。

  2. 执行 OpenNext 转换命令：

     ```
     npx opennextjs-cloudflare
     ```

- **行为说明：** 该命令将首先执行 Next.js 的原生构建，然后将构建输出转换为 Cloudflare Workers 的兼容格式。

### 3. 配置文件设置 (Configuration File Setup)

- **配置文件位置：** 在项目根目录创建 `open-next.config.ts` 文件，用于配置 OpenNext Cloudflare 适配器的缓存和队列策略。

- **标准配置示例：**

  ```typescript
  import type { QueueMessage } from '@opennextjs/aws/types/overrides';
  import { IgnorableError } from '@opennextjs/aws/utils/error.js';
  import { defineCloudflareConfig, getCloudflareContext } from '@opennextjs/cloudflare';
  import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache';
  import d1NextTagCache from '@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache';

  const wranglerDurableQueue = () => ({
    name: 'durable-queue',
    send: async (msg: QueueMessage) => {
      const { env } = getCloudflareContext();
      const durableObject =
        env.NEXT_CACHE_DO_QUEUE ??
        // Some wrangler templates name the binding `DO_QUEUE`; fall back if present.
        (env as { DO_QUEUE?: unknown })?.DO_QUEUE;

      if (!durableObject) {
        throw new IgnorableError('No durable object binding for cache revalidation');
      }

      const id = durableObject.idFromName(msg.MessageGroupId);
      const stub = durableObject.get(id);
      await stub.revalidate({ ...msg });
    },
  });

  export default defineCloudflareConfig({
    incrementalCache: r2IncrementalCache,
    tagCache: d1NextTagCache,
    queue: wranglerDurableQueue,
  });
  ```

- **配置说明：**
  - **`incrementalCache`**: 使用 R2 (Cloudflare 对象存储) 作为增量缓存存储，用于 ISR (增量静态再生) 功能。
  - **`tagCache`**: 使用 D1 (Cloudflare SQLite 数据库) 作为标签缓存，用于管理缓存标签和失效策略。
  - **`queue`**: 配置 Durable Queue (持久化队列)，用于处理缓存重新验证任务。支持 `NEXT_CACHE_DO_QUEUE` 或 `DO_QUEUE` 绑定名称。

### 4. R2 和 D1 绑定配置流程 (R2 and D1 Binding Configuration)

#### 4.1 R2 存储桶创建与绑定 (R2 Bucket Creation and Binding)

R2 用于存储 Next.js 的增量缓存数据，支持 ISR (增量静态再生) 功能。

**步骤 1：创建 R2 存储桶**

使用 Wrangler CLI 创建 R2 存储桶：

```bash
npx wrangler r2 bucket create cache
```

**步骤 2：在 `wrangler.jsonc` 中配置 R2 绑定**

在 `wrangler.jsonc` 文件中添加 `r2_buckets` 配置：

```jsonc
{
  // ... 其他配置 ...
  "r2_buckets": [
    {
      "binding": "NEXT_INC_CACHE_R2_BUCKET",
      "bucket_name": "cache"
    }
  ]
}
```

**配置说明：**
- **`binding`**: 绑定名称，必须为 `NEXT_INC_CACHE_R2_BUCKET`（OpenNext 要求的固定名称）
- **`bucket_name`**: R2 存储桶的名称，与步骤 1 中创建的存储桶名称一致

#### 4.2 D1 数据库创建与绑定 (D1 Database Creation and Binding)

D1 用于存储 Next.js 的标签缓存，支持按需重新验证（On-demand revalidation）功能。

**步骤 1：创建 D1 数据库**

使用 Wrangler CLI 创建 D1 数据库：

```bash
npx wrangler d1 create markdownpreview
```

命令执行后会返回数据库 ID，例如：`a908f521-8267-489f-803b-1265a964adf3`

**步骤 2：在 `wrangler.jsonc` 中配置 D1 绑定**

在 `wrangler.jsonc` 文件中添加 `d1_databases` 配置：

```jsonc
{
  // ... 其他配置 ...
  "d1_databases": [
    {
      "binding": "NEXT_TAG_CACHE_D1",
      "database_id": "a908f521-8267-489f-803b-1265a964adf3",
      "database_name": "markdownpreview"
    }
  ]
}
```

**配置说明：**
- **`binding`**: 绑定名称，必须为 `NEXT_TAG_CACHE_D1`（OpenNext 要求的固定名称）
- **`database_id`**: D1 数据库的唯一标识符，从步骤 1 的创建命令输出中获取
- **`database_name`**: D1 数据库的名称，与步骤 1 中创建的数据库名称一致

**步骤 3：运行数据库迁移（可选）**

如果需要在本地开发环境中使用 D1，可以运行迁移：

```bash
npx wrangler d1 migrations apply markdownpreview --local
```

#### 4.3 Durable Objects 配置 (Durable Objects Configuration)

Durable Objects 用于处理缓存重新验证队列。

**步骤 1：在 `wrangler.jsonc` 中配置 Durable Objects 绑定**

在 `wrangler.jsonc` 文件中添加 `durable_objects` 配置：

```jsonc
{
  // ... 其他配置 ...
  "durable_objects": {
    "bindings": [
      {
        "name": "DO_QUEUE",
        "class_name": "DOQueueHandler",
        "script_name": "markdownpreview-org"
      }
    ]
  }
}
```

**配置说明：**
- **`name`**: 绑定名称，可以是 `DO_QUEUE` 或 `NEXT_CACHE_DO_QUEUE`（需与 `open-next.config.ts` 中的配置保持一致）
- **`class_name`**: Durable Object 的类名，固定为 `DOQueueHandler`
- **`script_name`**: Worker 脚本名称，通常与 `wrangler.jsonc` 中的 `name` 字段一致

**步骤 2：配置迁移（Migrations）**

在 `wrangler.jsonc` 中添加迁移配置，用于创建 Durable Object 类：

```jsonc
{
  // ... 其他配置 ...
  "migrations": [
    {
      "tag": "v1",
      "new_classes": ["DOQueueHandler", "DOShardedTagCache", "BucketCachePurge"]
    }
  ]
}
```

**注意：** 首次部署时，Wrangler 会自动应用这些迁移，创建所需的 Durable Object 类。

#### 4.4 完整配置示例 (Complete Configuration Example)

以下是 `wrangler.jsonc` 的完整配置示例，包含所有必需的绑定：

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "markdownpreview-org",
  "compatibility_date": "2025-11-12",
  "workers_dev": true,
  "main": ".open-next/worker.js",
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  },
  "compatibility_flags": ["nodejs_compat"],
  // R2 增量缓存绑定
  "r2_buckets": [
    {
      "binding": "NEXT_INC_CACHE_R2_BUCKET",
      "bucket_name": "cache"
    }
  ],
  // D1 标签缓存绑定
  "d1_databases": [
    {
      "binding": "NEXT_TAG_CACHE_D1",
      "database_id": "a908f521-8267-489f-803b-1265a964adf3",
      "database_name": "markdownpreview"
    }
  ],
  // Durable Objects 绑定（用于缓存重新验证队列）
  "durable_objects": {
    "bindings": [
      {
        "name": "DO_QUEUE",
        "class_name": "DOQueueHandler",
        "script_name": "markdownpreview-org"
      }
    ]
  },
  // 迁移配置
  "migrations": [
    {
      "tag": "v1",
      "new_classes": ["DOQueueHandler", "DOShardedTagCache", "BucketCachePurge"]
    }
  ]
}
```

### 5. 环境变量与密钥配置 (Environment Variables and Secrets Configuration)

Cloudflare Workers 支持两种类型的环境变量配置：
- **`vars`**: 非敏感的环境变量，直接在 `wrangler.jsonc` 中配置
- **`secrets`**: 敏感信息（如 API 令牌、密钥），需要通过 Wrangler CLI 上传

#### 5.1 非敏感环境变量配置 (Non-Sensitive Variables)

在 `wrangler.jsonc` 文件的 `vars` 部分配置非敏感的环境变量：

```jsonc
{
  // ... 其他配置 ...
  "vars": {
    "DIRECTUS_URL": "https://directus.lzyinglian.com/",
    "NEXT_PUBLIC_SITE_ID": 6,
    "NEXT_PUBLIC_SITE_URL": "https://markdownpreview.org"
  }
}
```

**配置说明：**
- **`DIRECTUS_URL`**: Directus CMS 实例的 URL 地址
- **`NEXT_PUBLIC_SITE_ID`**: 站点 ID（用于多站点支持）
- **`NEXT_PUBLIC_SITE_URL`**: 站点完整 URL（可选，用于生成 sitemap 和 SEO）

**注意：** `vars` 中的配置会直接写入到构建产物中，因此**不要**在此处放置任何敏感信息（如 API 令牌、密码等）。

#### 5.2 敏感密钥上传 (Secrets Upload)

对于敏感信息（如 API 令牌），必须使用 Wrangler 的 `secret` 命令上传到 Cloudflare Workers。

**步骤 1：上传单个密钥**

使用以下命令上传敏感密钥：

```bash
# 上传 DIRECTUS_TOKEN
npx wrangler secret put DIRECTUS_TOKEN

# 上传 REVALIDATE_TOKEN（如果使用重新验证 API）
npx wrangler secret put REVALIDATE_TOKEN
```

**执行流程：**
1. 运行命令后，Wrangler 会提示你输入密钥值
2. 输入密钥值并按 Enter（输入时不会显示，这是正常的安全行为）
3. 密钥会被加密存储到 Cloudflare Workers 环境中

**步骤 2：批量上传密钥（推荐）**

如果需要在 CI/CD 中自动上传密钥，可以使用环境变量：

```bash
# 从环境变量读取并上传
echo "your-directus-token" | npx wrangler secret put DIRECTUS_TOKEN

# 或使用管道方式
export DIRECTUS_TOKEN="your-directus-token"
echo "$DIRECTUS_TOKEN" | npx wrangler secret put DIRECTUS_TOKEN
```

**步骤 3：验证密钥是否已设置**

查看已配置的密钥列表（注意：出于安全考虑，不会显示密钥值）：

```bash
npx wrangler secret list
```

**步骤 4：删除密钥（如需要）**

如果密钥泄露或需要更新，可以删除后重新上传：

```bash
npx wrangler secret delete DIRECTUS_TOKEN
```

#### 5.3 项目必需的环境变量清单 (Required Environment Variables)

根据项目实际情况，以下是需要配置的环境变量：

| 变量名 | 类型 | 配置方式 | 说明 | 示例 |
|--------|------|----------|------|------|
| `DIRECTUS_URL` | 非敏感 | `vars` | Directus CMS 实例 URL | `https://directus.lzyinglian.com/` |
| `DIRECTUS_TOKEN` | **敏感** | `secret` | Directus API 访问令牌 | `your-token-here` |
| `NEXT_PUBLIC_SITE_ID` | 非敏感 | `vars` | 站点 ID（多站点支持） | `6` |
| `NEXT_PUBLIC_SITE_URL` | 非敏感 | `vars` | 站点完整 URL（可选） | `https://markdownpreview.org` |
| `REVALIDATE_TOKEN` | **敏感** | `secret` | 重新验证 API 令牌（可选） | `your-revalidate-token` |

#### 5.4 本地开发环境配置 (Local Development Configuration)

**重要：** 本地开发时，Wrangler 会从以下位置读取环境变量：

1. **`.dev.vars` 文件**（推荐用于本地开发）

   在项目根目录创建 `.dev.vars` 文件（此文件应添加到 `.gitignore`）：

   ```env
   DIRECTUS_TOKEN=your-local-directus-token
   REVALIDATE_TOKEN=your-local-revalidate-token
   ```

2. **系统环境变量**

   也可以直接设置系统环境变量：

   ```bash
   export DIRECTUS_TOKEN="your-token"
   export REVALIDATE_TOKEN="your-token"
   ```

**注意：** `.dev.vars` 文件仅用于本地开发，不会被部署到生产环境。生产环境的密钥必须通过 `wrangler secret put` 命令上传。

#### 5.5 完整配置示例 (Complete Configuration Example)

**`wrangler.jsonc` 配置：**

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "markdownpreview-org",
  "compatibility_date": "2025-11-12",
  "workers_dev": true,
  "main": ".open-next/worker.js",
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  },
  "compatibility_flags": ["nodejs_compat"],

  // 非敏感环境变量
  "vars": {
    "DIRECTUS_URL": "https://directus.lzyinglian.com/",
    "NEXT_PUBLIC_SITE_ID": 6,
    "NEXT_PUBLIC_SITE_URL": "https://markdownpreview.org"
  },

  // ... 其他绑定配置 ...
}
```

**密钥上传命令（执行一次即可）：**

```bash
# 上传 Directus 令牌
npx wrangler secret put DIRECTUS_TOKEN

# 上传重新验证令牌（如果使用）
npx wrangler secret put REVALIDATE_TOKEN
```

**本地开发配置（`.dev.vars` 文件）：**

```env
DIRECTUS_TOKEN=your-local-development-token
REVALIDATE_TOKEN=your-local-revalidate-token
```

### 6. 环境与部署 (Environment and Deployment)

## III. 性能与容量检查 (Performance and Capacity Check)

### 1. Worker 体积限制 (Worker Size Limit)

- **关注指标：** 严格关注最终生成的 Worker 文件 **压缩后 (gzip)** 的体积。
- **限制标准：**
  - **免费计划：** 3 MiB (兆字节)
  - **付费计划：** 10 MiB (兆字节)
- **Agent 验证：** Agent 必须在编译完成后检查 Wrangler 输出的压缩大小，并在超过限制时发出警告。

### 2. 额外配置 (Additional Configuration)

- **图像优化：** Next.js 的 Image Optimization 功能需要单独配置 **Cloudflare Images** 服务。Agent 在归档图像相关文档时，需将此配置作为依赖项进行记录。
- **缓存处理：** OpenNext 支持 ISR (Incremental Static Regeneration) 等 Next.js 缓存机制。Agent 在总结缓存相关文档时，应强调这些机制如何被适配器映射到 Cloudflare 的缓存策略。

## IV. 快速开始和新应用创建 (Get Started / New App Creation)

- **新应用创建指令：** 如果是全新项目，Agent 应建议用户使用 Cloudflare 提供的官方命令，该命令会预配置 OpenNext 适配器：

  ```
  npm create cloudflare@latest -- my-next-app --framework=next --platform=workers
  ```

- **说明：** 对于现有 Next.js 应用，请继续遵循 II. 迁移与编译流程。

## V. 其他 
参照 [opennext-cloudflare](https://opennext.js.org/cloudflare/get-started)