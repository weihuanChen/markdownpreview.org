import type { Locale } from './types'

export const SUPPORT_PRIMARY_LOCALE: Locale = 'en'

export const supportMeta = {
  siteName: 'markdownpreview.org',
  contactEmail: 'support@markdownpreview.org',
}

interface SupportSection {
  title: string
  paragraphs: string[]
  bullets?: string[]
}

export interface SupportContent {
  intro: string
  sections: SupportSection[]
  contact: {
    email: string
    responseTime: string
    languages: string
    note?: string
  }
}

const supportContent: Record<Locale, SupportContent> = {
  en: {
    intro: `Hi there! 👋 Thanks for using <strong>${supportMeta.siteName}</strong>.`,
    sections: [
      {
        title: '📮 How to Reach Me',
        paragraphs: [
          "Since I run this project alone, I don't have a 24/7 support team, but I check my emails every day.",
        ],
        bullets: [
          `Email: ${supportMeta.contactEmail}`,
          'Response Time: Usually within 24-48 hours.',
          'Languages: Feel free to write in <strong>English</strong> or <strong>Chinese</strong>.',
        ],
      },
      {
        title: '🐛 Reporting a Bug?',
        paragraphs: ['To help me fix issues faster, please include:'],
        bullets: [
          'Device & Browser (e.g., iPhone / Chrome on Windows).',
          'A screenshot or a short description of what happened.',
        ],
      },
      {
        title: '💡 Have a Feature Request?',
        paragraphs: [
          "Many of the current features came from user suggestions! If you think something is missing, please let me know. I build this tool for you.",
        ],
      },
    ],
    contact: {
      email: supportMeta.contactEmail,
      responseTime: 'Usually within 24-48 hours.',
      languages: 'Feel free to write in <strong>English</strong> or <strong>Chinese</strong>.',
      note: 'Note: I respect your privacy. Your email address will only be used to reply to your inquiry and will never be shared.',
    },
  },
  zh: {
    intro: `你好！👋 感谢使用 <strong>${supportMeta.siteName}</strong>。`,
    sections: [
      {
        title: '📮 如何联系我',
        paragraphs: [
          '由于我独自运营这个项目，没有 24/7 支持团队，但我每天都会查看邮件。',
        ],
        bullets: [
          `邮箱：${supportMeta.contactEmail}`,
          '回复时间：通常在 24-48 小时内。',
          '语言：欢迎使用<strong>英语</strong>或<strong>中文</strong>联系。',
        ],
      },
      {
        title: '🐛 报告 Bug？',
        paragraphs: ['为了帮助我更快地修复问题，请包含：'],
        bullets: [
          '设备和浏览器（例如，iPhone / Windows 上的 Chrome）。',
          '截图或简短描述发生了什么。',
        ],
      },
      {
        title: '💡 有功能建议？',
        paragraphs: [
          '当前的许多功能都来自用户的建议！如果您觉得缺少什么，请告诉我。我为您构建这个工具。',
        ],
      },
    ],
    contact: {
      email: supportMeta.contactEmail,
      responseTime: '通常在 24-48 小时内。',
      languages: '欢迎使用<strong>英语</strong>或<strong>中文</strong>联系。',
      note: '注意：我尊重您的隐私。您的邮箱地址仅用于回复您的询问，绝不会被分享。',
    },
  },
  ja: {
    intro: `こんにちは！👋 <strong>${supportMeta.siteName}</strong> をご利用いただきありがとうございます。`,
    sections: [
      {
        title: '📮 お問い合わせ方法',
        paragraphs: [
          'このプロジェクトを一人で運営しているため、24時間365日のサポートチームはありませんが、毎日メールを確認しています。',
        ],
        bullets: [
          `メール：${supportMeta.contactEmail}`,
          '返信時間：通常24-48時間以内。',
          '言語：<strong>英語</strong>または<strong>中国語</strong>でお気軽にご連絡ください。',
        ],
      },
      {
        title: '🐛 バグを報告しますか？',
        paragraphs: ['問題をより迅速に修正するために、以下を含めてください：'],
        bullets: [
          'デバイスとブラウザ（例：iPhone / Windows の Chrome）。',
          'スクリーンショットまたは発生したことの簡単な説明。',
        ],
      },
      {
        title: '💡 機能リクエストがありますか？',
        paragraphs: [
          '現在の機能の多くはユーザーの提案から生まれました！何か不足していると思われる場合は、お知らせください。このツールはあなたのために構築しています。',
        ],
      },
    ],
    contact: {
      email: supportMeta.contactEmail,
      responseTime: '通常24-48時間以内。',
      languages: '<strong>英語</strong>または<strong>中国語</strong>でお気軽にご連絡ください。',
      note: '注意：プライバシーを尊重します。メールアドレスはお問い合わせへの返信にのみ使用され、共有されることはありません。',
    },
  },
}

export function getSupportContent(locale: Locale): SupportContent {
  return supportContent[locale] || supportContent[SUPPORT_PRIMARY_LOCALE]
}
