import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

export default createMiddleware({
  // 支持的语言列表
  locales,

  // 默认语言
  defaultLocale,

  // 语言前缀策略：仅非默认语言需要前缀（默认日语无前缀，英文/中文有前缀）
  localePrefix: 'as-needed',

  // 禁用自动语言检测，始终使用默认语言 ja
  localeDetection: false,
});

export const config = {
  // 匹配所有路径，除了 API 路由、静态文件等
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
