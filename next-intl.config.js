/**
 * next-intl config (CJS fallback) for runtime auto-discovery.
 * Keep in sync with i18n.ts.
 * @type {import('next-intl').NextIntlConfig}
 */
// #region agent log
fetch('http://127.0.0.1:7242/ingest/48d890d8-f420-47d7-a37c-8a56a0569825',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H6',location:'next-intl.config.js',message:'config file loaded (CJS)',data:{note:'cjs'},timestamp:Date.now()})}).catch(()=>{});
// #endregion
module.exports = {
  locales: ['ja', 'en', 'zh'],
  defaultLocale: 'ja',
  localePrefix: 'as-needed',
};

