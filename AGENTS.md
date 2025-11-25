# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router entry point with locale-specific routes under `app/[locale]`, shared layout, and site metadata (robots/sitemap).
- `components/`: Reusable UI and layout pieces; `components/ui/` wraps Radix/Tailwind primitives; feature blocks like `markdown-preview.tsx` and `code-editor.tsx` live here.
- `lib/`: Data layer utilities such as the Directus client (`directus.ts`), blog queries (`cms-blog.ts`), shared types, and helpers.
- `messages/` + `i18n.ts`: Locale message catalogs and the language configuration.
- `public/`: Static assets (favicons, images) served as-is. `docs/` holds content pages; `navigation.ts` defines top-level nav items.
- `test-directus.js`: Manual Directus connectivity check; keep alongside `.env.local` and do not commit secrets.

## Build, Test, and Development Commands
- `npm run dev`: Start the development server at `http://localhost:3000`.
- `npm run build`: Production build for Vercel/Node targets; run before shipping.
- `npm run start`: Serve the production build locally for smoke testing.
- `npm run lint`: ESLint across the repo; fix lint before opening a PR.
- Cloudflare workers path: `npm run build:cloudflare`, `npm run preview:cloudflare`, `npm run deploy:cloudflare` for OpenNext pipelines.
- `node test-directus.js`: Quick check that Directus URL/token/site ID are valid.

## Coding Style & Naming Conventions
- TypeScript + React 19 with App Router; prefer server components unless client hooks are required.
- 2-space indentation, single quotes, and `camelCase` for variables/functions; keep filenames in `kebab-case.tsx` as in existing components.
- Styling uses Tailwind v4 and component-level CSS in `app/globals.css`; keep utility classes concise and leverage `clsx`/`cva` helpers when present.
- Run `npm run lint` after changes; follow existing ESLint config (`eslint.config.mjs`) instead of custom rules.

## Testing Guidelines
- No comprehensive automated suite yet; treat linting and manual browser checks as required gates.
- Use `node test-directus.js` with `.env.local` to validate Directus connectivity before merging data-layer changes.
- When adding tests, prefer `.test.ts`/`.test.tsx` colocated with the code or under a `__tests__/` folder; cover locale rendering and Directus fetch logic.

## Commit & Pull Request Guidelines
- Write clear, imperative commit messages; Conventional Commit prefixes (`feat:`, `fix:`, `chore:`) are preferred for consistency with Node/Next tooling.
- Keep PRs focused; include a short summary, linked issue (if any), and checklists for lint/build.
- For UI changes, attach before/after screenshots or short notes on responsive behavior; mention any i18n updates or new env vars.

## Environment & Secrets
- Required variables: `DIRECTUS_URL`, `DIRECTUS_TOKEN`, and `NEXT_PUBLIC_SITE_ID` (defaults to `3` if unset); store them in `.env.local`, never in Git.
- Rotate tokens promptly and exercise least privilege on Directus roles; sanitize logs when running `test-directus.js`.
