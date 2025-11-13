import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// 支持的语言列表
export const locales = ['ja', 'en', 'zh'] as const;
export type Locale = (typeof locales)[number];

// 默认语言
export const defaultLocale: Locale = 'ja';

export default getRequestConfig(async ({ requestLocale }) => {
  // 通常从请求中获取 locale，如果使用 next-intl 中间件则会自动设置
  let locale = await requestLocale;

  // 如果没有 locale，使用默认语言
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
