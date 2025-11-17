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

### 3. 环境与部署 (Environment and Deployment)

- **部署工具：** 部署至 Cloudflare Workers 时，需使用 **Wrangler** 工具。
- **Windows环境限制：**
  - 若开发环境为 Windows，应建议用户或 Agent 优先在 **Windows Subsystem for Linux (WSL)** 或 **Linux/MacOS CI/CD 系统**（如 GitHub Actions）中运行 `opennextjs-cloudflare` 编译命令。

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