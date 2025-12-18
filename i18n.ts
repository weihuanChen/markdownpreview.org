import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// 支持的语言列表
export const locales = ['ja', 'en', 'zh', 'fr'] as const;
export type Locale = (typeof locales)[number];

// 默认语言
export const defaultLocale: Locale = 'ja';

export default getRequestConfig(async ({ requestLocale }) => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/48d890d8-f420-47d7-a37c-8a56a0569825',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H1',location:'i18n.ts:getRequestConfig',message:'enter getRequestConfig',data:{requestLocale:String(await requestLocale).trim()},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  // 通常从请求中获取 locale，如果使用 next-intl 中间件则会自动设置
  let locale = await requestLocale;

  // 如果没有 locale，使用默认语言
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/48d890d8-f420-47d7-a37c-8a56a0569825',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H1',location:'i18n.ts:getRequestConfig',message:'resolved locale',data:{resolvedLocale:locale},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
