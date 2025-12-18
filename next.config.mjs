import { createRequire } from 'node:module';
import createNextIntlPlugin from 'next-intl/plugin';

const require = createRequire(import.meta.url);

const withNextIntl = createNextIntlPlugin('./i18n.ts');

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
