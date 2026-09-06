# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Foundation

## Current Goal

- Prisma foundation is implemented and migrated; default Turbopack build verification remains blocked by the environment's port-binding restriction.

## Completed

- Prisma (`05-prisma`) implementation: added Project and ProjectCollaborator models, required indexes and cascade relation, cached URL-based Prisma singleton, Accelerate extension, and initial migration. Migration applied and client generated successfully; Webpack production build passes.
- Design system (`01-design-system`): configured shadcn/ui with the Radix Nova preset.
- Added generated Button, Card, Dialog, Input, Tabs, Textarea, and ScrollArea primitives.
- Installed Lucide React and added the shared Tailwind-aware `cn()` helper.
- Applied the dark-only Ghost AI palette and Geist Sans/Mono typography globally.
- Editor chrome (`02-editor`): added the controlled navbar, floating project sidebar with project tabs and empty states, and editor-shell integration.
- Confirmed the existing dialog primitive supports title, description, and footer composition using semantic tokens, ready for future product dialogs.
- Authentication (`03-auth`): added the Clerk provider and dark token-based theme, responsive sign-in/sign-up routes, protected-first proxy, session-aware root redirects, protected editor route, and default user menu.
- Refined the authentication UI to a balanced 50/50 desktop layout with a differentiated surface, product-focused feature list, and explicit Geist font configuration for both app and Clerk UI.

## In Progress

- Prisma (`05-prisma`) verification: plain `npm run build` remains blocked by Turbopack's environment port-binding error; `npm run build -- --webpack` passes.
- Project dialogs (`04-project-dialogs`): implementation complete with centered editor home, create/rename/delete dialogs, live slug preview, a dedicated state hook, owned-project sidebar actions, and mobile backdrop dismissal. TypeScript, ESLint, and production build pass; authenticated browser verification remains pending.
- Logout redirect fix: configured the public sign-in destination; authenticated browser verification of the reported intermittent RSC warning remains pending.

## Next Up

- Recheck plain `npm run build` in an environment that permits Turbopack's internal port binding.
- Verify project dialogs in the authenticated editor at desktop and mobile sizes.

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Prisma schemas are loaded from the `prisma/` folder through `prisma.config.ts`, which loads `.env.local` before `.env`. Project ownership stores the Clerk user ID without a local User model. Collaborators use a compound project/email primary key for uniqueness without an extra ID field; the future canvas blob path is nullable.
- shadcn semantic color variables map to the project-defined dark palette; the root document is always marked dark, with no light-mode token set.
- Editor sidebars use fixed-position overlays so opening them never changes the canvas layout.
- Clerk route protection follows a protected-first model; only the configured sign-in and sign-up route trees are public.

## Session Notes

- Prisma: applied `20260906052047_init_projects` to the configured database. Validation passed: Prisma format/validate/generate, ESLint, TypeScript, read-only queries for both models through the singleton, development hot-reload identity checks, and the Webpack production build. Default Turbopack build failed because internal port binding is not permitted, including with elevated execution. Accelerate construction/cache assertions passed, but its synthetic-URL smoke check failed during connection initialization; live Accelerate access is unverified because the configured database uses direct PostgreSQL. No project UI persistence was added in this feature.
- Project dialogs: create, rename, and delete update mock projects in memory only, with no API calls or persistence. Rename auto-focuses and submits with Enter; delete uses an input-free destructive confirmation. Shared projects expose no rename/delete actions. Existing navbar and sidebar toggle/tab behavior are preserved. Validation passed: `npm run lint`, `npx tsc --noEmit`, `npm run build -- --webpack`, and `git diff --check`. Browser interactions have not been exercised.
- Logout redirect: added `ClerkProvider.afterSignOutUrl` using the existing sign-in URL environment variable with `/sign-in` fallback. ESLint and the production build (`--webpack`), including TypeScript checking, passed. No browser was connected for end-to-end logout verification.
- Production HTTP smoke check on port 3100: signed-out `/editor` returned 307; `/sign-in` returned 500 with a local proxy socket error. Runtime verification remains incomplete.

- Verification passed after editor chrome implementation: ESLint, TypeScript, and the Next.js production build (`--webpack`).
- Verification passed after authentication implementation: ESLint, TypeScript, and the Next.js production build (`--webpack`). Turbopack could not bind its internal process port in the execution environment.
