// ESM next-intl config (additional visibility for Turbopack).
// #region agent log
fetch('http://127.0.0.1:7242/ingest/48d890d8-f420-47d7-a37c-8a56a0569825',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H6b',location:'next-intl.config.mjs',message:'config file loaded (MJS)',data:{note:'mjs'},timestamp:Date.now()})}).catch(()=>{});
// #endregion
export default {
  locales: ['ja', 'en', 'zh'],
  defaultLocale: 'ja',
  localePrefix: 'as-needed',
};

