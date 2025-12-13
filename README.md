<div align="center">

**🌐 Language / 语言 / 言語**: [English](#) | [中文](./README.zh.md)

</div>

---

# MarkdownPreview.org

**Official Website**: [https://markdownpreview.org](https://markdownpreview.org)

A powerful online Markdown editor with live preview, diff comparison, and blog system.

## 📋 Project Overview

MarkdownPreview.org is a free online Markdown editing and preview tool designed to provide developers, technical writers, and content creators with a convenient Markdown editing experience. Built with modern web technologies, it supports multilingual content, live preview, diff comparison, and other core features.

## ✨ Key Features

### 1. Live Markdown Editor
- **Live Preview**: Instantly view formatted HTML output while typing Markdown
- **Syntax Highlighting**: Code editor based on CodeMirror with syntax highlighting support
- **GitHub Flavored Markdown**: Full support for GFM syntax specification
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

### 2. Markdown Diff Tool
- **Side-by-Side Comparison**: Display original and comparison documents in split view
- **Precise Highlighting**: Line-level and word-level diff highlighting
- **Navigation**: Quick jump to next/previous diff points
- **Web Worker Processing**: Background computation using Web Workers for smooth UI

### 3. Blog System
- **Directus CMS Integration**: Uses Directus as the content management system
- **Multilingual Support**: Blog content supports multiple language versions
- **Table of Contents**: Automatic TOC generation
- **SEO Optimization**: Complete structured data (JSON-LD) support
- **Tag System**: Article tag categorization support

### 4. Internationalization
- **Three Languages**: Japanese (default), English, Chinese
- **Auto Language Detection**: Automatically switches based on browser language
- **URL Routing**: Supports language-prefixed routing structure

## 🛠️ Tech Stack

### Core Framework
- **Next.js 16**: Built with App Router architecture
- **React 19**: Latest React version
- **TypeScript**: Type-safe development experience

### UI & Styling
- **Tailwind CSS v4**: Modern CSS framework
- **Radix UI**: Accessible UI component library
- **next-themes**: Theme switching support (light/dark mode)

### Feature Libraries
- **next-intl**: Internationalization solution
- **@uiw/react-codemirror**: Markdown code editor
- **react-diff-view**: Markdown diff comparison UI
- **streamdown**: Markdown content rendering
- **@directus/sdk**: Directus CMS client

### Deployment
- **Vercel**: Primary deployment platform
- **Cloudflare Workers**: Supports Cloudflare deployment (via OpenNext)

## 🚀 Quick Start

### Requirements
- Node.js 18+
- npm / pnpm / yarn

### Install Dependencies

```bash
npm install
# or
pnpm install
```

### Environment Variables

Create a `.env.local` file and configure the following variables:

```env
# Directus CMS Configuration
DIRECTUS_URL=your_directus_url
DIRECTUS_TOKEN=your_directus_token
NEXT_PUBLIC_SITE_ID=3

# Site URL (optional, defaults to https://markdownpreview.org)
NEXT_PUBLIC_SITE_URL=https://markdownpreview.org
```

### Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

### Build for Production

```bash
npm run build
npm run start
```

### Cloudflare Workers Deployment

```bash
# Build for Cloudflare
npm run build:cf

# Preview locally
npm run preview:cf

# Deploy to Cloudflare
npm run deploy:cf
```

## 📁 Project Structure

```
markdownpreview.org/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Multilingual routes
│   │   ├── blog/          # Blog pages
│   │   ├── diff/          # Diff comparison page
│   │   └── page.tsx       # Home page
│   └── api/               # API routes
├── components/            # React components
│   ├── blog/             # Blog-related components
│   ├── ui/               # UI base components
│   └── ...               # Other feature components
├── lib/                  # Utility libraries
│   ├── cms-blog.ts       # Blog data queries
│   ├── directus.ts       # Directus client
│   └── workers/          # Web Workers
├── messages/             # Internationalization message files
│   ├── en.json
│   ├── ja.json
│   └── zh.json
├── docs/                 # Project documentation
│   ├── dev/              # Development documentation
│   ├── product/          # Product documentation
│   └── deploy/           # Deployment documentation
└── public/               # Static assets
    └── templates/        # Markdown template files
```

## 🔧 Development Guide

### Code Standards
- Use TypeScript for type checking
- Follow ESLint configuration rules
- Use 2-space indentation
- Component files use `kebab-case.tsx` naming

### Run Lint

```bash
npm run lint
```

### Test Directus Connection

```bash
node test-directus.js
```

## 📚 Documentation

Project documentation is located in the `docs/` directory, including:

- **Development Docs** (`docs/dev/`): Technical implementation details, architecture design
- **Product Docs** (`docs/product/`): Feature requirements, product planning
- **Deployment Docs** (`docs/deploy/`): Deployment processes, environment configuration

For detailed documentation index, see [docs/index.md](./docs/index.md)

## 🌐 Multilingual Support

The project supports three languages:
- **Japanese (ja)**: Default language
- **English (en)**
- **Chinese (zh)**

Language files are located in the `messages/` directory and managed using `next-intl`.

## 📝 Feature Checklist

### Markdown Editor
- ✅ Live preview
- ✅ Syntax highlighting
- ✅ GitHub Flavored Markdown
- ✅ Code block highlighting
- ✅ Table support
- ✅ Task lists

### Diff Comparison
- ✅ Side-by-side comparison view
- ✅ Line-level diff highlighting
- ✅ Word-level diff highlighting
- ✅ Diff navigation
- ✅ Web Worker performance optimization

### Blog System
- ✅ Directus CMS integration
- ✅ Multilingual content
- ✅ Automatic TOC generation
- ✅ SEO optimization
- ✅ Tag system
- ✅ Pagination

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📄 License

This project is private.

## 🔗 Related Links

- **Official Website**: [https://markdownpreview.org](https://markdownpreview.org)
- **Next.js Documentation**: [https://nextjs.org/docs](https://nextjs.org/docs)
- **Directus Documentation**: [https://docs.directus.io](https://docs.directus.io)

---

**Made with ❤️ for the Markdown community**
