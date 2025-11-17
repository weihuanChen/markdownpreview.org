import createNextIntlPlugin from 'next-intl/plugin';

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
}

export default withNextIntl(nextConfig)
