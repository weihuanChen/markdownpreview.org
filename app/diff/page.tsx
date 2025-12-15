import { getLocale } from 'next-intl/server';
import { redirect } from '@/navigation';

export default async function DiffRootRedirect() {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/48d890d8-f420-47d7-a37c-8a56a0569825',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H3',location:'app/diff/page.tsx',message:'before getLocale',data:{},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  const locale = await getLocale();
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/48d890d8-f420-47d7-a37c-8a56a0569825',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H3',location:'app/diff/page.tsx',message:'after getLocale',data:{locale},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  redirect(`/${locale}/diff`);
}
