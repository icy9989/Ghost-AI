When I click the logout button, the following button appears:
POST /editor 200 in 33ms (next.js: 3ms, proxy.ts: 9ms, application-code: 21ms)
  └─ ƒ invalidateCacheAction() in 3ms node_modules/@clerk/nextjs/dist/esm/app-router/server-actions.js
[browser] Failed to fetch RSC payload for http://localhost:3000/. Falling back to browser navigation. TypeError: Load failed
Error: aborted
    at ignore-listed frames {
  code: 'ECONNRESET'
}

Sometimes 

## Logout redirect fix

- Configured `ClerkProvider.afterSignOutUrl` to use `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, falling back to `/sign-in`. Logout now targets the public auth route directly instead of the protected `/` route.
- ESLint and the production build (`--webpack`), including TypeScript checking, passed.
- Browser verification remains pending: no connected browser was available to reproduce logout or confirm that the intermittent RSC request interruption is resolved.
- Production HTTP smoke check on port 3100: signed-out `/editor` returned 307; `/sign-in` returned 500 with `Failed to proxy http://localhost:3100/sign-in` / `socket hang up`. Runtime verification is incomplete.
