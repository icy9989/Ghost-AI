When I click the logout button, the following button appears:
POST /editor 200 in 33ms (next.js: 3ms, proxy.ts: 9ms, application-code: 21ms)
  └─ ƒ invalidateCacheAction() in 3ms node_modules/@clerk/nextjs/dist/esm/app-router/server-actions.js
[browser] Failed to fetch RSC payload for http://localhost:3000/. Falling back to browser navigation. TypeError: Load failed
Error: aborted
    at ignore-listed frames {
  code: 'ECONNRESET'
}

