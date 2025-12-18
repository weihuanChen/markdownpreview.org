import type { Locale } from './types'

export const USER_SERVICE_PRIMARY_LOCALE: Locale = 'en'

export const userServiceMeta = {
  siteName: 'markdownpreview.org',
  contactEmail: 'support@markdownpreview.org',
  effectiveDate: 'November 25, 2025',
}

interface UserServiceSection {
  title: string
  paragraphs: string[]
  bullets?: string[]
}

export interface UserServiceContent {
  intro: string
  summary: string
  effectiveDate: string
  sections: UserServiceSection[]
  contact: {
    email: string
    site: string
    note?: string
  }
}

const userServiceContent: Record<Locale, UserServiceContent> = {
  en: {
    intro: `Welcome to the services provided by ${userServiceMeta.siteName} (the "Website"). Please read this User Service Agreement ("Agreement") carefully before using the Website.`,
    summary:
      'By accessing or using any part of the services, you agree to be bound by this Agreement. If you do not agree, please discontinue use immediately.',
    effectiveDate: userServiceMeta.effectiveDate,
    sections: [
      {
        title: '1. Agreement and Modifications',
        paragraphs: [
          'This Agreement is the entire agreement between you and the Website regarding use of the services.',
          'We may modify this Agreement at our discretion by posting updates on the Website. Continued use after changes means you accept the new terms.',
        ],
      },
      {
        title: '2. Description of Services',
        paragraphs: [
          'The Website provides online tools, content, information browsing, and related network services (collectively, the "Services").',
          'We may change, suspend, or discontinue any part of the Services at any time without prior notice or liability.',
          'Content and results are provided for informational or auxiliary purposes only; we do not guarantee accuracy, completeness, or reliability.',
        ],
      },
      {
        title: '3. User Responsibilities',
        paragraphs: [
          'Use the Services only as permitted by this Agreement and applicable laws.',
          'You are responsible for any content you submit or publish through the Services.',
        ],
        bullets: [
          'Do not upload or share content that violates laws, endangers public security, or harms others.',
          'Avoid defamatory, obscene, violent, or criminally instructive material.',
          'Do not infringe third-party intellectual property, privacy, or other legal rights.',
          'Do not interfere with or disrupt the Services, attempt unauthorized access, distribute malware, or overload infrastructure.',
          'You agree to indemnify and hold the Website harmless from claims arising from your violation of this Agreement or the law.',
        ],
      },
      {
        title: '4. Privacy and Data',
        paragraphs: [
          'We respect your privacy. We may collect personal and non-personal information to provide, maintain, and improve the Services.',
          'Please review the separate Privacy Policy for details on how data is collected, used, and protected.',
          'We may automatically collect non-personal data (e.g., IP, browser, device) for analytics and security, and may use cookies to enhance your experience.',
        ],
      },
      {
        title: '5. Disclaimers',
        paragraphs: [
          'The Services are provided on an "as is" and "as available" basis without warranties of any kind, express or implied.',
          'You use the Services at your own discretion and risk. We are not liable for data loss, program errors, or system failures arising from use.',
          'Links to third-party websites are provided for convenience; we are not responsible for their content, security, or practices.',
        ],
      },
      {
        title: '6. Limitation of Liability',
        paragraphs: [
          'To the fullest extent permitted by law, the Website is not liable for any direct, indirect, incidental, special, punitive, or consequential damages arising from use of the Services.',
          'If liability is found, our total liability is limited to the lesser of USD 100 or the amount you paid for the Services in the six months preceding the claim (if any).',
        ],
      },
      {
        title: '7. Intellectual Property',
        paragraphs: [
          'All content on the Website, including text, graphics, logos, software, and tools, is owned by the Website or its content suppliers and protected by applicable laws.',
          'You receive a limited, non-exclusive, non-transferable license to access and use the Services. Do not copy, modify, sell, rent, distribute, reverse engineer, or decompile any part of the content or software.',
        ],
      },
      {
        title: '8. Governing Law and Jurisdiction',
        paragraphs: [
          'This Agreement shall be governed by the laws of the jurisdiction in which the Website operator is located, without regard to its conflict of law provisions.',
          "Any dispute arising out of or relating to this Agreement shall first be resolved through good-faith negotiation. If negotiation fails, the parties agree to submit the dispute to the courts of competent jurisdiction in the operator's location.",
        ],
      },
      {
        title: '9. Contact Information',
        paragraphs: ['If you have questions about this Agreement, please reach out to us.'],
        bullets: [`Email: ${userServiceMeta.contactEmail}`, `Website: ${userServiceMeta.siteName}`],
      },
    ],
    contact: {
      email: userServiceMeta.contactEmail,
      site: userServiceMeta.siteName,
      note: 'We respond to inquiries related to this Agreement as promptly as possible.',
    },
  },
  zh: {
    intro: `欢迎使用 ${userServiceMeta.siteName}（以下简称“本网站”）提供的服务。在使用前请仔细阅读本《用户服务协议》("本协议")。`,
    summary:
      '访问或使用本网站即表示您同意受本协议约束；如不同意，请立即停止使用。',
    effectiveDate: '2025年11月25日',
    sections: [
      {
        title: '1. 协议与修改',
        paragraphs: [
          '本协议构成您与本网站就服务使用达成的完整协议。',
          '我们可能随时修改本协议并在网站发布更新。您继续使用服务即视为接受更新后的条款。',
        ],
      },
      {
        title: '2. 服务描述',
        paragraphs: [
          '本网站提供在线工具、内容、信息浏览及相关网络服务（统称“服务”）。',
          '我们可在不事先通知且无需承担责任的情况下变更、暂停或终止任何服务内容。',
          '所有内容和结果仅供参考或辅助使用，我们不对其准确性、完整性或可靠性作出保证。',
        ],
      },
      {
        title: '3. 用户责任',
        paragraphs: [
          '您应在本协议和适用法律允许的范围内使用服务。',
          '您对通过服务提交或发布的任何内容承担全部责任。',
        ],
        bullets: [
          '不得上传或分享违反法律、危害公共安全或损害他人的内容。',
          '避免发布诽谤、淫秽、暴力或教唆违法的内容。',
          '不得侵犯第三方的知识产权、隐私权或其他合法权益。',
          '不得干扰或破坏服务、尝试未经授权的访问、传播恶意代码或过度占用资源。',
          '如因您违反本协议或法律引发索赔，您同意赔偿并使本网站免受损害。',
        ],
      },
      {
        title: '4. 隐私与数据',
        paragraphs: [
          '我们重视您的隐私，可能为提供、维护和改进服务而收集个人及非个人信息。',
          '请参阅独立的《隐私政策》以了解数据收集、使用与保护方式。',
          '我们可能自动收集非个人信息（如 IP、浏览器、设备）用于分析和安全，也可能使用 Cookie 改善体验。',
        ],
      },
      {
        title: '5. 免责声明',
        paragraphs: [
          '服务按“现状”和“可用”提供，我们不对任何明示或默示的保证负责。',
          '您自行承担使用服务的风险，我们不对使用产生的数据丢失、程序错误或系统故障负责。',
          '指向第三方网站的链接仅为方便提供，我们不对其内容、安全或做法负责。',
        ],
      },
      {
        title: '6. 责任限制',
        paragraphs: [
          '在法律允许的最大范围内，本网站不对因使用服务产生的任何直接、间接、附带、特殊、惩罚性或后果性损害负责。',
          '若被认定需承担责任，我们的总责任以 100 美元或您在索赔发生前六个月为服务支付的金额（以较低者为准）为限。',
        ],
      },
      {
        title: '7. 知识产权',
        paragraphs: [
          '本网站的文本、图形、标识、软件和工具等内容归本网站或内容提供方所有，受相关法律保护。',
          '我们授予您有限的、非排他、不可转让的许可以使用服务；不得复制、修改、出售、出租、分发、反向工程或反编译任何内容或软件。',
        ],
      },
      {
        title: '8. 适用法律与管辖',
        paragraphs: [
          '本协议受网站运营者所在司法管辖区的法律管辖，不考虑法律冲突原则。',
          '因本协议产生或与之相关的任何争议应首先通过友好协商解决。如协商失败，双方同意将争议提交运营者所在地有管辖权的法院解决。',
        ],
      },
      {
        title: '9. 联系方式',
        paragraphs: ['如对本协议有疑问，请与我们联系。'],
        bullets: [`邮箱：${userServiceMeta.contactEmail}`, `网站：${userServiceMeta.siteName}`],
      },
    ],
    contact: {
      email: userServiceMeta.contactEmail,
      site: userServiceMeta.siteName,
      note: '我们会尽快处理与本协议相关的咨询。',
    },
  },
  ja: {
    intro: `${userServiceMeta.siteName}（以下「本サイト」）が提供するサービスをご利用いただきありがとうございます。ご利用前に本「ユーザーサービス規約」（本規約）をよくお読みください。`,
    summary:
      '本サイトへアクセスまたは利用することで、本規約に同意したものとみなされます。不同意の場合は直ちに利用を中止してください。',
    effectiveDate: '2025年11月25日',
    sections: [
      {
        title: '1. 規約と変更',
        paragraphs: [
          '本規約は、サービス利用に関するお客様と本サイトとの完全な合意です。',
          '本サイトは本規約を随時改定することがあり、改定はサイト上で告知します。改定後もサービスを利用する場合、新しい条件に同意したものとみなします。',
        ],
      },
      {
        title: '2. サービスの説明',
        paragraphs: [
          '本サイトはオンラインツール、コンテンツ、情報閲覧および関連ネットワークサービス（総称して「サービス」）を提供します。',
          '本サイトは予告なしにサービスの内容を変更・停止・終了する場合があります。',
          '提供するコンテンツや結果は参考目的であり、正確性・完全性・信頼性について保証しません。',
        ],
      },
      {
        title: '3. ユーザーの責任',
        paragraphs: [
          '本規約および適用法に従ってサービスを利用してください。',
          'サービスを通じて投稿・公開するコンテンツについて、責任はユーザー自身が負います。',
        ],
        bullets: [
          '法律違反、公序良俗に反する、または他者に害を与えるコンテンツをアップロード・共有しないでください。',
          '名誉毀損、わいせつ、暴力的、または違法行為を助長する内容を避けてください。',
          '第三者の知的財産権、プライバシーその他の権利を侵害しないでください。',
          'サービスを妨害・破壊したり、不正アクセスを試みたり、マルウェアを配布したり、過度にリソースを消費しないでください。',
          '本規約または法律違反に起因する請求について、本サイトを補償し免責とすることに同意します。',
        ],
      },
      {
        title: '4. プライバシーとデータ',
        paragraphs: [
          '本サイトはプライバシーを尊重し、サービス提供・維持・改善のために個人情報および非個人情報を収集する場合があります。',
          'データの収集・利用・保護については別途「プライバシーポリシー」をご確認ください。',
          '分析とセキュリティ目的で非個人情報（IP、ブラウザ、デバイスなど）を自動収集する場合があり、体験向上のため Cookie を使用することがあります。',
        ],
      },
      {
        title: '5. 免責事項',
        paragraphs: [
          'サービスは「現状有姿」「提供可能な範囲」で提供され、明示または黙示のいかなる保証も行いません。',
          'サービスの利用は自己責任であり、利用に起因するデータ損失、プログラムエラー、システム障害について当社は責任を負いません。',
          '第三者サイトへのリンクは便宜上のものであり、その内容や安全性、運用について責任を負いません。',
        ],
      },
      {
        title: '6. 責任の制限',
        paragraphs: [
          '法令で認められる最大限の範囲で、本サイトはサービス利用に起因する直接的・間接的・偶発的・特別・懲罰的または結果的損害について責任を負いません。',
          '責任が認められる場合でも、総額は100米ドルまたは請求前6か月間にお支払いいただいた金額のいずれか低い方を上限とします。',
        ],
      },
      {
        title: '7. 知的財産',
        paragraphs: [
          '本サイトのテキスト、グラフィック、ロゴ、ソフトウェア、ツール等のコンテンツは本サイトまたは提供者が所有し、法的保護を受けます。',
          'ユーザーには限定的かつ非独占的、譲渡不可のライセンスを付与します。コンテンツやソフトウェアを複製・改変・販売・賃貸・配布・リバースエンジニアリング・逆コンパイルすることは禁止します。',
        ],
      },
      {
        title: '8. 準拠法と管轄',
        paragraphs: [
          '本規約は、ウェブサイト運営者が所在する司法管轄区の法律に準拠し、抵触法の原則は適用されません。',
          '本規約から生じる、または本規約に関連する紛争は、まず誠実に協議して解決するものとします。協議が失敗した場合、当事者は紛争を運営者所在地の管轄裁判所に提起することに合意します。',
        ],
      },
      {
        title: '9. 連絡先',
        paragraphs: ['本規約に関する質問がある場合はご連絡ください。'],
        bullets: [`メール：${userServiceMeta.contactEmail}`, `ウェブサイト：${userServiceMeta.siteName}`],
      },
    ],
    contact: {
      email: userServiceMeta.contactEmail,
      site: userServiceMeta.siteName,
      note: '本規約に関するお問い合わせには可能な限り迅速に対応します。',
    },
  },
  fr: {
    intro: `Bienvenue sur les services fournis par ${userServiceMeta.siteName} (le « Site »). Veuillez lire attentivement ce Contrat de Service Utilisateur (« Contrat ») avant d'utiliser le Site.`,
    summary:
      'En accédant ou en utilisant une partie des services, vous acceptez d\'être lié par ce Contrat. Si vous n\'êtes pas d\'accord, veuillez cesser immédiatement l\'utilisation.',
    effectiveDate: '25 novembre 2025',
    sections: [
      {
        title: '1. Contrat et Modifications',
        paragraphs: [
          'Ce Contrat constitue l\'accord intégral entre vous et le Site concernant l\'utilisation des services.',
          'Nous pouvons modifier ce Contrat à notre discrétion en publiant des mises à jour sur le Site. L\'utilisation continue après les modifications signifie que vous acceptez les nouvelles conditions.',
        ],
      },
      {
        title: '2. Description des Services',
        paragraphs: [
          'Le Site fournit des outils en ligne, du contenu, la navigation d\'informations et des services réseau connexes (collectivement, les « Services »).',
          'Nous pouvons modifier, suspendre ou interrompre toute partie des Services à tout moment sans préavis ni responsabilité.',
          'Le contenu et les résultats sont fournis à titre informatif ou auxiliaire uniquement ; nous ne garantissons pas leur exactitude, exhaustivité ou fiabilité.',
        ],
      },
      {
        title: '3. Responsabilités de l\'Utilisateur',
        paragraphs: [
          'Utilisez les Services uniquement comme autorisé par ce Contrat et les lois applicables.',
          'Vous êtes responsable de tout contenu que vous soumettez ou publiez via les Services.',
        ],
        bullets: [
          'Ne téléchargez pas ou ne partagez pas de contenu qui viole les lois, met en danger la sécurité publique ou nuit à autrui.',
          'Évitez les contenus diffamatoires, obscènes, violents ou incitant à des activités criminelles.',
          'Ne portez pas atteinte à la propriété intellectuelle, à la vie privée ou aux autres droits légaux de tiers.',
          'N\'interférez pas avec les Services, ne tentez pas d\'accès non autorisé, ne distribuez pas de logiciels malveillants et ne surchargez pas l\'infrastructure.',
          'Vous acceptez d\'indemniser et de dégager le Site de toute responsabilité en cas de réclamations découlant de votre violation de ce Contrat ou de la loi.',
        ],
      },
      {
        title: '4. Confidentialité et Données',
        paragraphs: [
          'Nous respectons votre vie privée. Nous pouvons collecter des informations personnelles et non personnelles pour fournir, maintenir et améliorer les Services.',
          'Veuillez consulter la Politique de Confidentialité séparée pour plus de détails sur la collecte, l\'utilisation et la protection des données.',
          'Nous pouvons collecter automatiquement des données non personnelles (ex. : IP, navigateur, appareil) à des fins d\'analyse et de sécurité, et pouvons utiliser des cookies pour améliorer votre expérience.',
        ],
      },
      {
        title: '5. Clause de Non-Responsabilité',
        paragraphs: [
          'Les Services sont fournis « en l\'état » et « selon disponibilité » sans aucune garantie, expresse ou implicite.',
          'Vous utilisez les Services à vos propres risques. Nous ne sommes pas responsables des pertes de données, erreurs de programme ou pannes système résultant de l\'utilisation.',
          'Les liens vers des sites tiers sont fournis pour votre commodité ; nous ne sommes pas responsables de leur contenu, sécurité ou pratiques.',
        ],
      },
      {
        title: '6. Limitation de Responsabilité',
        paragraphs: [
          'Dans toute la mesure permise par la loi, le Site n\'est pas responsable des dommages directs, indirects, accessoires, spéciaux, punitifs ou consécutifs découlant de l\'utilisation des Services.',
          'Si une responsabilité est établie, notre responsabilité totale est limitée au moindre de 100 USD ou du montant que vous avez payé pour les Services au cours des six mois précédant la réclamation (le cas échéant).',
        ],
      },
      {
        title: '7. Propriété Intellectuelle',
        paragraphs: [
          'Tout le contenu du Site, y compris les textes, graphiques, logos, logiciels et outils, appartient au Site ou à ses fournisseurs de contenu et est protégé par les lois applicables.',
          'Vous recevez une licence limitée, non exclusive et non transférable pour accéder et utiliser les Services. Ne copiez pas, ne modifiez pas, ne vendez pas, ne louez pas, ne distribuez pas, ne procédez pas à l\'ingénierie inverse ou à la décompilation de tout contenu ou logiciel.',
        ],
      },
      {
        title: '8. Loi Applicable et Juridiction',
        paragraphs: [
          'Ce Contrat est régi par les lois de la juridiction où l\'opérateur du Site est situé, sans égard aux principes de conflit de lois.',
          'Tout litige découlant de ce Contrat ou s\'y rapportant sera d\'abord résolu par négociation de bonne foi. Si la négociation échoue, les parties conviennent de soumettre le litige aux tribunaux compétents du lieu de l\'opérateur.',
        ],
      },
      {
        title: '9. Coordonnées',
        paragraphs: ['Si vous avez des questions concernant ce Contrat, veuillez nous contacter.'],
        bullets: [`E-mail : ${userServiceMeta.contactEmail}`, `Site web : ${userServiceMeta.siteName}`],
      },
    ],
    contact: {
      email: userServiceMeta.contactEmail,
      site: userServiceMeta.siteName,
      note: 'Nous répondons aux demandes relatives à ce Contrat dans les meilleurs délais.',
    },
  },
}

export function getUserServiceContent(locale: Locale): UserServiceContent {
  return userServiceContent[locale] || userServiceContent[USER_SERVICE_PRIMARY_LOCALE]
}
