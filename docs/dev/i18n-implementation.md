# i18n 技术实施文档

## 概述

本项目使用 **next-intl** 库实现国际化（i18n）功能，支持日语（ja）、英语（en）、中文（zh）三种语言。

## 技术栈

- **框架**: Next.js 16.0 App Router
- **i18n 库**: next-intl (v4.5.2)
- **语言持久化**: Cookie (通过 middleware)
- **路由策略**: 始终包含语言前缀 (`/ja`, `/en`, `/zh`)

## 目录结构

```
项目根目录/
├── app/
│   └── [locale]/           # 国际化路由
│       ├── layout.tsx      # 集成 NextIntlClientProvider
│       └── page.tsx        # 主页面，使用 useTranslations
├── components/
│   ├── faq.tsx            # FAQ 组件（使用 i18n）
│   ├── footer.tsx         # Footer 组件（使用 i18n）
│   └── language-switcher.tsx  # 语言切换器组件
├── messages/              # 翻译文件目录
│   ├── ja.json           # 日语翻译
│   ├── en.json           # 英语翻译
│   └── zh.json           # 中文翻译
├── public/templates/      # Markdown 模板文件
│   ├── default-ja.md     # 日语模板
│   ├── default-en.md     # 英语模板
│   └── default-zh.md     # 中文模板
├── i18n.ts               # i18n 配置文件
├── middleware.ts         # 语言检测和路由中间件
└── navigation.ts         # 国际化路由辅助函数
```

## 核心配置文件

### 1. i18n.ts

定义支持的语言列表、默认语言和消息加载逻辑：

```typescript
import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

export const locales = ['ja', 'en', 'zh'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ja';

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  return {
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
```

### 2. middleware.ts

处理语言检测、路由和 Cookie 持久化：

```typescript
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',  // URL 始终包含语言前缀
  localeDetection: true,   // 启用语言检测和 Cookie
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
```

### 3. next.config.mjs

配置 next-intl 插件（next-intl v4 必需）：

```javascript
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default withNextIntl(nextConfig)
```

**重要**: 在 next-intl v4 中，必须使用 `createNextIntlPlugin` 包装配置并指定 i18n 配置文件路径。

### 4. navigation.ts

提供国际化的路由辅助函数：

```typescript
import { createNavigation } from 'next-intl/navigation';
import { locales } from './i18n';

export const { Link, redirect, usePathname, useRouter } = createNavigation({
  locales
});
```

**注意**: next-intl v4 使用 `createNavigation` 替代了 v3 的 `createSharedPathnamesNavigation`。

## 翻译文件管理

### 文件位置

所有翻译内容存储在 `messages/` 目录下的 JSON 文件中：

- `messages/ja.json` - 日语翻译
- `messages/en.json` - 英语翻译
- `messages/zh.json` - 中文翻译

### 翻译键命名规范

```json
{
  // 应用核心
  "app_title": "应用标题",
  "editor_title": "编辑器标题",
  "preview_title": "预览标题",

  // 主题和语言
  "theme_light": "浅色模式",
  "theme_dark": "深色模式",
  "lang_ja": "日语",
  "lang_en": "英语",
  "lang_zh": "中文",

  // FAQ 部分
  "faq_title": "常见问题",
  "faq_q1": "问题1",
  "faq_a1": "答案1",

  // Footer 部分
  "footer_description": "描述文本",
  "footer_quicklinks": "快速链接"
}
```

### 添加新的翻译键

1. 在三个 JSON 文件中同时添加相同的键
2. 确保所有语言的翻译都已提供
3. 在组件中使用 `t('translation_key')` 访问

## 组件中使用 i18n

### 客户端组件

```typescript
"use client"

import { useTranslations, useLocale } from 'next-intl';

export function MyComponent() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <div>
      <h1>{t('app_title')}</h1>
      <p>Current locale: {locale}</p>
    </div>
  );
}
```

### 服务端组件

```typescript
import { getTranslations } from 'next-intl/server';

export default async function MyPage() {
  const t = await getTranslations();

  return (
    <div>
      <h1>{t('app_title')}</h1>
    </div>
  );
}
```

## 语言切换实现

使用 `components/language-switcher.tsx` 组件：

```typescript
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/navigation';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale });
  };

  // UI 实现...
}
```

## 动态内容国际化

### Markdown 模板

Markdown 编辑器的默认模板存储在 `public/templates/` 目录：

- `default-ja.md` - 日语教程模板
- `default-en.md` - 英语教程模板
- `default-zh.md` - 中文教程模板

在 `app/[locale]/page.tsx` 中根据当前语言动态加载：

```typescript
useEffect(() => {
  async function loadTemplate() {
    const response = await fetch(`/templates/default-${locale}.md`);
    if (response.ok) {
      const template = await response.text();
      setMarkdown(template);
    }
  }
  loadTemplate();
}, [locale]);
```

### Metadata 国际化

在 `app/[locale]/layout.tsx` 中动态生成 metadata：

```typescript
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const titles: Record<string, string> = {
    ja: "Markdown Preview 道場 - Markdown を学ぶ",
    en: "Markdown Preview Dojo - Learn Markdown",
    zh: "Markdown Preview 演练场 - 学习 Markdown"
  };

  return {
    title: titles[locale] || titles.ja,
    // ...
  };
}
```

## 语言持久化机制

### Cookie 存储

next-intl 的 middleware 自动将用户选择的语言存储在 Cookie 中（`NEXT_LOCALE` Cookie）。

### 语言检测优先级

1. 用户手动选择的语言（Cookie: `NEXT_LOCALE`）
2. URL 路径中的语言前缀（`/ja`, `/en`, `/zh`）
3. `Accept-Language` HTTP 请求头
4. 默认语言（日语 `ja`）

## 路由结构

### URL 格式

所有页面 URL 都包含语言前缀：

- 日语：`/ja` (默认)
- 英语：`/en`
- 中文：`/zh`

访问根路径 `/` 会自动重定向到 `/ja`。

### 静态生成

在 `app/[locale]/layout.tsx` 中使用 `generateStaticParams` 为所有语言生成静态页面：

```typescript
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
```

## 添加新语言

### 步骤

1. 在 `i18n.ts` 中添加新语言代码到 `locales` 数组
2. 在 `messages/` 目录创建新的 JSON 翻译文件（如 `messages/ko.json`）
3. 在 `public/templates/` 创建对应的 Markdown 模板（如 `default-ko.md`）
4. 在 `app/[locale]/layout.tsx` 的 `generateMetadata` 中添加新语言的 metadata
5. 在所有翻译文件中添加新语言的显示名称（如 `lang_ko`）

## 性能优化

### 按需加载

- 翻译消息仅在运行时按语言加载（通过 `i18n.ts` 的动态 import）
- Markdown 模板通过客户端 fetch 按需加载

### 静态生成

- 所有语言的页面在构建时预渲染（`generateStaticParams`）
- 减少运行时计算和网络请求

## 常见问题

### Q: 如何确保翻译完整性？

A: 使用 TypeScript 类型推导。在一个语言文件中定义类型，其他语言文件引用相同类型，确保键的一致性。

### Q: 语言切换后页面内容不更新？

A: 确保使用 `@/navigation` 的 `useRouter` 和 `usePathname`，而不是 Next.js 原生的路由 hooks。

### Q: 如何测试多语言功能？

A:
1. 手动切换语言并检查 UI 显示
2. 检查 URL 是否包含正确的语言前缀
3. 刷新页面后检查语言是否保持（Cookie 持久化）
4. 检查浏览器 Application > Cookies 中的 `NEXT_LOCALE` Cookie

## 相关文件

- [多语言文案管理文档](../product/i18n-content.md)
- [项目文档索引](../index.md)

---

**最后更新**: 2025-11-13
**维护者**: 开发团队
