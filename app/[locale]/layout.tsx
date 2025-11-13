import type React from "react"
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { locales } from '@/i18n';
import "../globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://markdownpreview.org';

  const titles: Record<string, string> = {
    ja: "Markdown Preview 道場 - Markdown を学ぶ",
    en: "Markdown Preview Dojo - Learn Markdown",
    zh: "Markdown Preview 演练场 - 学习 Markdown"
  };

  const descriptions: Record<string, string> = {
    ja: "高性能でリアルタイムな Markdown エディターとプレビューで Markdown 構文を学習",
    en: "A high-performance, real-time Markdown editor and preview for learning Markdown syntax",
    zh: "高性能实时 Markdown 编辑器和预览工具，用于学习 Markdown 语法"
  };

  const title = titles[locale] || titles.ja;
  const description = descriptions[locale] || descriptions.ja;
  const currentUrl = `${baseUrl}/${locale}`;

  return {
    title,
    description,
    generator: "v0.app",

    // Alternates (hreflang) - 日语为默认
    alternates: {
      canonical: currentUrl,
      languages: {
        'ja': `${baseUrl}/ja`,
        'en': `${baseUrl}/en`,
        'zh': `${baseUrl}/zh`,
        'x-default': `${baseUrl}/ja`, // 默认使用日语
      },
    },

    // Open Graph
    openGraph: {
      title,
      description,
      url: currentUrl,
      siteName: 'Markdown Preview 道場',
      locale: locale === 'zh' ? 'zh_CN' : locale === 'en' ? 'en_US' : 'ja_JP',
      type: 'website',
      images: [
        {
          url: `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/og-image.png`],
      creator: '@markdowndojo',
      site: '@markdowndojo',
    },

    // 其他 SEO 相关
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // 图标配置
    icons: {
      icon: [
        {
          url: "/icon-light-32x32.png",
          media: "(prefers-color-scheme: light)",
        },
        {
          url: "/icon-dark-32x32.png",
          media: "(prefers-color-scheme: dark)",
        },
        {
          url: "/icon.svg",
          type: "image/svg+xml",
        },
      ],
      apple: "/apple-icon.png",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // 验证 locale 是否有效
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // 获取翻译消息 - 在 next-intl v4 中需要传递 locale
  const messages = await getMessages({ locale });

  return (
    <html lang={locale}>
      <body className={`font-sans antialiased`}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
