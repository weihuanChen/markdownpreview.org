import type { NextIntlConfig } from 'next-intl';

// next-intl 配置（TS，默认导出），便于 Turbopack/Next 自动发现
// #region agent log
fetch('http://127.0.0.1:7242/ingest/48d890d8-f420-47d7-a37c-8a56a0569825',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H7',location:'next-intl.config.ts',message:'config file loaded (TS)',data:{note:'ts'},timestamp:Date.now()})}).catch(()=>{});
// #endregion
const config: NextIntlConfig = {
  locales: ['ja', 'en', 'zh'],
  defaultLocale: 'ja',
  localePrefix: 'as-needed',
};

export default config;

