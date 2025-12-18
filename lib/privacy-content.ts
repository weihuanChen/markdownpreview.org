import type { Locale } from './types'

export const PRIVACY_PRIMARY_LOCALE: Locale = 'en'

export const privacyMeta = {
  siteName: 'markdownpreview.org',
  contactEmail: 'support@markdownpreview.org',
  // Use fixed date strings to avoid hydration mismatch
  lastUpdated: {
    en: 'December 18, 2025',
    zh: '2025年12月18日',
    ja: '2025年12月18日',
    fr: '18 décembre 2025',
  },
}

interface PrivacySection {
  title: string
  paragraphs: string[]
  bullets?: string[]
}

export interface PrivacyContent {
  intro: string
  lastUpdated: string
  sections: PrivacySection[]
  contact: {
    email: string
    note?: string
  }
}

const privacyContent: Record<Locale, PrivacyContent> = {
  en: {
    intro: `Welcome to ${privacyMeta.siteName} ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights.`,
    lastUpdated: privacyMeta.lastUpdated.en,
    sections: [
      {
        title: '1. Introduction',
        paragraphs: [
          `Welcome to ${privacyMeta.siteName} ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights.`,
        ],
      },
      {
        title: '2. Data We Collect',
        paragraphs: [
          'As an individual developer operating this site, I strive to collect minimal data:',
        ],
        bullets: [
          'Usage Data: We may use tools (like Google Analytics or Vercel Analytics) to collect anonymous data about how you use our website.',
          'Cookies: We use cookies to improve your experience.',
        ],
      },
      {
        title: '3. How We Use Your Data',
        paragraphs: ['We use your data to:'],
        bullets: [
          'Provide and maintain the service.',
          'Monitor the usage of the service.',
          'Detect, prevent and address technical issues.',
        ],
      },
      {
        title: '4. Third-Party Services',
        paragraphs: [
          'We may use third-party Service Providers to monitor and analyze the use of our Service:',
        ],
        bullets: [
          'Google Analytics: [Add link if used]',
          'Vercel: [Add link if used]',
          'Cloudflare: [Add link if used]',
        ],
      },
    ],
    contact: {
      email: privacyMeta.contactEmail,
      note: 'If you have any questions about this Privacy Policy, please contact me.',
    },
  },
  zh: {
    intro: `欢迎访问 ${privacyMeta.siteName}（"我们"或"我们的"）。我们尊重您的隐私，并致力于保护您的个人数据。本隐私政策将告知您我们在您访问我们的网站时如何保护您的个人数据，并告知您您的隐私权利。`,
    lastUpdated: privacyMeta.lastUpdated.zh,
    sections: [
      {
        title: '1. 介绍',
        paragraphs: [
          `欢迎访问 ${privacyMeta.siteName}（"我们"或"我们的"）。我们尊重您的隐私，并致力于保护您的个人数据。本隐私政策将告知您我们在您访问我们的网站时如何保护您的个人数据，并告知您您的隐私权利。`,
        ],
      },
      {
        title: '2. 我们收集的数据',
        paragraphs: ['作为运营本网站的个人开发者，我努力收集最少的数据：'],
        bullets: [
          '使用数据：我们可能使用工具（如 Google Analytics 或 Vercel Analytics）收集有关您如何使用我们网站的匿名数据。',
          'Cookie：我们使用 Cookie 来改善您的体验。',
        ],
      },
      {
        title: '3. 我们如何使用您的数据',
        paragraphs: ['我们使用您的数据来：'],
        bullets: [
          '提供和维护服务。',
          '监控服务的使用情况。',
          '检测、预防和解决技术问题。',
        ],
      },
      {
        title: '4. 第三方服务',
        paragraphs: ['我们可能使用第三方服务提供商来监控和分析我们服务的使用情况：'],
        bullets: [
          'Google Analytics：[如使用，请添加链接]',
          'Vercel：[如使用，请添加链接]',
          'Cloudflare：[如使用，请添加链接]',
        ],
      },
    ],
    contact: {
      email: privacyMeta.contactEmail,
      note: '如果您对本隐私政策有任何疑问，请联系我。',
    },
  },
  ja: {
    intro: `${privacyMeta.siteName}（"当社"、"私たち"）へようこそ。当社はお客様のプライバシーを尊重し、個人データの保護に取り組んでいます。本プライバシーポリシーは、お客様が当社のウェブサイトを訪問する際に、当社がお客様の個人データをどのように保護するか、およびお客様のプライバシー権利について説明します。`,
    lastUpdated: privacyMeta.lastUpdated.ja,
    sections: [
      {
        title: '1. はじめに',
        paragraphs: [
          `${privacyMeta.siteName}（"当社"、"私たち"）へようこそ。当社はお客様のプライバシーを尊重し、個人データの保護に取り組んでいます。本プライバシーポリシーは、お客様が当社のウェブサイトを訪問する際に、当社がお客様の個人データをどのように保護するか、およびお客様のプライバシー権利について説明します。`,
        ],
      },
      {
        title: '2. 収集するデータ',
        paragraphs: ['本サイトを運営する個人開発者として、最小限のデータ収集に努めています：'],
        bullets: [
          '使用データ：Google Analytics や Vercel Analytics などのツールを使用して、お客様が当社のウェブサイトをどのように使用しているかに関する匿名データを収集する場合があります。',
          'Cookie：お客様の体験を向上させるために Cookie を使用しています。',
        ],
      },
      {
        title: '3. データの使用方法',
        paragraphs: ['お客様のデータを次の目的で使用します：'],
        bullets: [
          'サービスを提供および維持するため。',
          'サービスの使用状況を監視するため。',
          '技術的な問題を検出、防止、対処するため。',
        ],
      },
      {
        title: '4. 第三者サービス',
        paragraphs: ['当社のサービスの使用を監視および分析するために、第三者サービスプロバイダーを使用する場合があります：'],
        bullets: [
          'Google Analytics：[使用する場合はリンクを追加]',
          'Vercel：[使用する場合はリンクを追加]',
          'Cloudflare：[使用する場合はリンクを追加]',
        ],
      },
    ],
    contact: {
      email: privacyMeta.contactEmail,
      note: '本プライバシーポリシーに関するご質問がございましたら、お問い合わせください。',
    },
  },
  fr: {
    intro: `Bienvenue sur ${privacyMeta.siteName} (« nous », « notre »). Nous respectons votre vie privée et nous engageons à protéger vos données personnelles. Cette politique de confidentialité vous informera de la manière dont nous protégeons vos données personnelles lorsque vous visitez notre site web et vous informera de vos droits en matière de confidentialité.`,
    lastUpdated: privacyMeta.lastUpdated.fr,
    sections: [
      {
        title: '1. Introduction',
        paragraphs: [
          `Bienvenue sur ${privacyMeta.siteName} (« nous », « notre »). Nous respectons votre vie privée et nous engageons à protéger vos données personnelles. Cette politique de confidentialité vous informera de la manière dont nous protégeons vos données personnelles lorsque vous visitez notre site web et vous informera de vos droits en matière de confidentialité.`,
        ],
      },
      {
        title: '2. Données que nous collectons',
        paragraphs: ['En tant que développeur individuel exploitant ce site, je m\'efforce de collecter un minimum de données :'],
        bullets: [
          'Données d\'utilisation : Nous pouvons utiliser des outils (comme Google Analytics ou Vercel Analytics) pour collecter des données anonymes sur la façon dont vous utilisez notre site web.',
          'Cookies : Nous utilisons des cookies pour améliorer votre expérience.',
        ],
      },
      {
        title: '3. Comment nous utilisons vos données',
        paragraphs: ['Nous utilisons vos données pour :'],
        bullets: [
          'Fournir et maintenir le service.',
          'Surveiller l\'utilisation du service.',
          'Détecter, prévenir et résoudre les problèmes techniques.',
        ],
      },
      {
        title: '4. Services tiers',
        paragraphs: ['Nous pouvons utiliser des prestataires de services tiers pour surveiller et analyser l\'utilisation de notre service :'],
        bullets: [
          'Google Analytics : [Ajouter le lien si utilisé]',
          'Vercel : [Ajouter le lien si utilisé]',
          'Cloudflare : [Ajouter le lien si utilisé]',
        ],
      },
    ],
    contact: {
      email: privacyMeta.contactEmail,
      note: 'Si vous avez des questions concernant cette politique de confidentialité, veuillez me contacter.',
    },
  },
}

export function getPrivacyContent(locale: Locale): PrivacyContent {
  return privacyContent[locale] || privacyContent[PRIVACY_PRIMARY_LOCALE]
}
