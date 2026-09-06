# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Foundation

## Current Goal

- Editor home wiring (`07-wire-editor-home`) is implemented. All 14 isolated tests, ESLint, and the Webpack production build pass. Plain `npm run build` remains blocked by the environment's Turbopack port-binding restriction; authenticated browser/database integration remains unverified.

## Completed

- Editor home wiring (`07-wire-editor-home`): server-rendered owned/shared project lists, `useProjectActions` API mutations, stable slug/suffix room ID preview, create navigation, rename refresh, and delete redirect/refresh. Sidebar projects link to membership-checked `/editor/[projectId]` pages using the existing editor shell. Failed requests retain the dialog and show an error; shared projects have no mutation actions.

- Project APIs (`06-project-apis`) implementation: added GET/POST `/api/projects` and PATCH/DELETE `/api/projects/[projectId]`, Clerk-derived ownership, default create name, cuid ID generation by default, input validation, and owner-only rename/delete. Project API requests reach handlers for explicit JSON `401` responses; non-owners receive `403`. UI API wiring is now completed in feature 07.
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

- Editor home wiring (`07-wire-editor-home`) verification: authenticated browser/database integration is pending. Plain `npm run build` fails before compilation due to Turbopack internal port binding (`Operation not permitted`); the Webpack production build passes.

- Project APIs (`06-project-apis`) verification: plain `npm run build` is blocked by the existing Turbopack port-binding restriction. Authenticated HTTP/database integration remains unverified; handler tests use isolated Clerk and database mocks.
- Prisma (`05-prisma`) verification: plain `npm run build` remains blocked by Turbopack's environment port-binding error; `npm run build -- --webpack` passes.
- Project dialogs (`04-project-dialogs`): implementation complete with centered editor home, create/rename/delete dialogs, live slug preview, a dedicated state hook, owned-project sidebar actions, and mobile backdrop dismissal. TypeScript, ESLint, and production build pass; authenticated browser verification remains pending.
- Logout redirect fix: configured the public sign-in destination; authenticated browser verification of the reported intermittent RSC warning remains pending.

## Next Up

- Recheck plain `npm run build` in an environment that permits Turbopack's internal port binding.
- Verify project dialogs in the authenticated editor at desktop and mobile sizes.

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Feature 07 adds `lib/projects.ts` because the spec's assumed project-list helper was absent. It reuses the Prisma singleton, fetches both lists server-side, and matches shared projects against verified Clerk email addresses case-insensitively. Workspace membership uses those same lists.
- Editor create requests supply an optional validated `roomId` (slug plus 12 random hexadecimal characters), stored as the project ID. Omitted room IDs retain cuid defaults; arbitrary client `id` and ownership fields remain ignored. Duplicate room IDs return `409`. Rename does not change the project/room ID. Real-time canvas setup remains outside feature 07.

- Project API response contract: `{ projects }` for lists, `{ project }` for create/rename, `{ success: true }` for delete, and `{ error }` for failures. Create returns `201`; malformed JSON or invalid names return `400`; missing projects return `404`. Omitted create names default to `Untitled Project`; supplied names must be non-empty strings. Project handlers enforce authentication directly so signed-out API requests return `401`.
- Prisma schemas are loaded from the `prisma/` folder through `prisma.config.ts`, which loads `.env.local` before `.env`. Project ownership stores the Clerk user ID without a local User model. Collaborators use a compound project/email primary key for uniqueness without an extra ID field; the future canvas blob path is nullable.
- shadcn semantic color variables map to the project-defined dark palette; the root document is always marked dark, with no light-mode token set.
- Editor sidebars use fixed-position overlays so opening them never changes the canvas layout.
- Clerk route protection follows a protected-first model; sign-in and sign-up route trees are public. Project API routes use handler-level authentication to return JSON `401` responses instead of proxy redirects/404s.

## Session Notes

- Editor home wiring: `node --test tests/*.test.mjs` passes all 14 tests covering API authentication/ownership/input validation, room ID persistence, hook create/rename/delete navigation, errors, and server list membership filtering. Tests isolate React state, HTTP, Clerk, and Prisma boundaries; they do not establish browser or live database integration. ESLint, Webpack production build (including TypeScript), and `git diff --check` pass. Plain `npm run build` reproduces the existing Turbopack internal port-binding failure. Existing uncommitted API/auth/Prisma work was preserved.

- Project APIs: five tests pass via `node --test tests/project-api.test.mjs`, covering all four endpoints' `401` responses, owner-scoped lists, ignored client ownership/IDs, default names, owner mutations, non-owner `403` responses, missing-project `404` responses, and invalid-input `400` responses. ESLint, Webpack production build (including TypeScript), and `git diff --check` pass. Plain `npm run build` fails on Turbopack internal port binding (`Operation not permitted`). The Prisma singleton exposes the common PrismaClient type to resolve incompatible direct/Accelerate generic read signatures; runtime connection selection and development caching remain intact.
- Prisma: applied `20260906052047_init_projects` to the configured database. Validation passed: Prisma format/validate/generate, ESLint, TypeScript, read-only queries for both models through the singleton, development hot-reload identity checks, and the Webpack production build. Default Turbopack build failed because internal port binding is not permitted, including with elevated execution. Accelerate construction/cache assertions passed, but its synthetic-URL smoke check failed during connection initialization; live Accelerate access is unverified because the configured database uses direct PostgreSQL. No project UI persistence was added in this feature.
- Project dialogs (historical feature 04 verification; superseded by feature 07): create, rename, and delete originally updated mock projects in memory only. Rename auto-focuses and submits with Enter; delete uses an input-free destructive confirmation. Shared projects expose no rename/delete actions. Existing navbar and sidebar toggle/tab behavior are preserved. Validation passed: `npm run lint`, `npx tsc --noEmit`, `npm run build -- --webpack`, and `git diff --check`. Browser interactions have not been exercised.
- Logout redirect: added `ClerkProvider.afterSignOutUrl` using the existing sign-in URL environment variable with `/sign-in` fallback. ESLint and the production build (`--webpack`), including TypeScript checking, passed. No browser was connected for end-to-end logout verification.
- Production HTTP smoke check on port 3100: signed-out `/editor` returned 307; `/sign-in` returned 500 with a local proxy socket error. Runtime verification remains incomplete.

- Verification passed after editor chrome implementation: ESLint, TypeScript, and the Next.js production build (`--webpack`).
- Verification passed after authentication implementation: ESLint, TypeScript, and the Next.js production build (`--webpack`). Turbopack could not bind its internal process port in the execution environment.
