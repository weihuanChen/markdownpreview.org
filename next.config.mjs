import { createRequire } from 'node:module';
import createNextIntlPlugin from 'next-intl/plugin';

const require = createRequire(import.meta.url);

const withNextIntl = createNextIntlPlugin('./i18n.ts');

// #region agent log
fetch('http://127.0.0.1:7242/ingest/48d890d8-f420-47d7-a37c-8a56a0569825',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H8',location:'next.config.mjs',message:'next.config loaded',data:{note:'withNextIntl applied'},timestamp:Date.now()})}).catch(()=>{});
// #endregion

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Cloudflare Workers 部署配置
  images: {
    // 禁用 Next.js 图片优化，使用 Cloudflare Images 服务
    unoptimized: true,
  },
  // 确保静态资源正确处理
  output: 'standalone',
  webpack(config) {
    // Force non-DOM entry in workers to avoid `document is not defined` from decode-named-character-reference.
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'decode-named-character-reference': require.resolve('decode-named-character-reference'),
    };
    return config;
  },
}

export default withNextIntl(nextConfig)
