import type { NextIntlConfig } from 'next-intl';

// next-intl 配置（TS，默认导出），便于 Turbopack/Next 自动发现
const config: NextIntlConfig = {
  locales: ['ja', 'en', 'zh', 'fr'],
  defaultLocale: 'ja',
  localePrefix: 'as-needed',
};

export default config;

