import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

export default createMiddleware({
  // 支持的语言列表
  locales,

  // 默认语言
  defaultLocale,

  // 语言前缀策略：始终在 URL 中包含语言前缀
  localePrefix: 'always',

  // 从 Cookie 中读取和存储用户的语言选择
  localeDetection: true,
});

export const config = {
  // 匹配所有路径，除了 API 路由、静态文件等
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
