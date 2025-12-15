import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';
import intlConfig from './next-intl.config.js';

// #region agent log
fetch('http://127.0.0.1:7242/ingest/48d890d8-f420-47d7-a37c-8a56a0569825',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H5',location:'middleware.ts',message:'middleware module loaded',data:{locales,defaultLocale},timestamp:Date.now()})}).catch(()=>{});
// #endregion
// #region agent log
fetch('http://127.0.0.1:7242/ingest/48d890d8-f420-47d7-a37c-8a56a0569825',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H6',location:'middleware.ts',message:'imported next-intl.config.js',data:{hasConfig:Boolean(intlConfig)},timestamp:Date.now()})}).catch(()=>{});
// #endregion

export default createMiddleware({
  // 支持的语言列表
  locales,

  // 默认语言
  defaultLocale,

  // 语言前缀策略：仅非默认语言需要前缀（默认日语无前缀，英文/中文有前缀）
  localePrefix: 'as-needed',

  // 禁用自动语言检测，始终使用默认语言 ja
  localeDetection: true,
});

export const config = {
  // 匹配所有路径，除了 API 路由、静态文件等
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
