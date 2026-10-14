# AGENTS.md — Ticket Hub

Guidance for AI agents and contributors. Stack and conventions mirror `open-office-fe` so shared code can move between the two.

## Stack

Vite + React 19 (TS strict) · TanStack Router (code-based, `src/routes/router.tsx`) · TanStack Query v5 · Zustand (session) · Tailwind v4 + shadcn/ui (new-york) · react-hook-form + zod v4 · i18next (vi default, en) · sonner · lucide · bun · Cloudflare Workers static assets.

## Rules

- **No hardcoded UI strings.** Every visible text goes through i18n keys in `src/i18n/locales/{vi,en}/<ns>.json`; add the key to every language and run `bun run check:i18n`. Namespaces: `common`, `auth`, `tickets`. New languages: add a `locales/<code>/` folder plus `SUPPORTED_LANGUAGES` / `LANGUAGE_OPTIONS` entries; bundles load automatically. Format dates and numbers with the active i18n language, never a fixed locale.
- **Theme tokens only.** Colors come from `src/styles/globals.css` (`bg-primary`, `text-muted-foreground`, …). Do not add raw hex in components; add a token instead.
- **shadcn first.** Reuse `src/components/ui/*`; add new primitives in the same style (data-slot, `cn`, cva variants) rather than ad-hoc markup.
- **Feature folders.** `src/features/<feature>/{api,types,hooks,components,pages,constants}`. API clients parse responses with zod; query keys live in `*.keys.ts`.
- **Auth.** The role gate (admin | support) is enforced in `features/auth/utils/route-guards.ts` and again by the backend; never bypass it client-side. Tokens are handled only through `src/lib/auth`.
- **Backend contract.** The Hub talks to `open-office` (`/api`). Staff endpoints are `/admin/tickets*`; do not invent endpoints — check the backend branch `feat/support-tickets` first.
- **Accessibility and states.** Every list has loading (skeleton), empty (`EmptyState`) and error states; errors use `role="alert"`; icon-only buttons have `aria-label`; interactive elements are at least 44px tall and have visible focus rings; respect `prefers-reduced-motion`.
- **Imports.** Use the `@/` alias; keep import groups (node, third-party, local) separated as in existing files.

## Commands

`bun run dev` · `bun run typecheck` · `bun run lint` · `bun run build` · `bun run deploy`

Run `typecheck` and `lint` before committing. Commits: imperative English subject, body explains why.
