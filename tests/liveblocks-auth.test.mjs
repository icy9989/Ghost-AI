import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function setup({ signedIn = true, allowed = true, secret = 'sk_test', status = 200, throws = false } = {}) {
  const calls = [];
  const exports = {};
  const source = ts.transpileModule(readFileSync('app/api/liveblocks-auth/route.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(source, { exports, Response, assert, process: { env: { LIVEBLOCKS_SECRET_KEY: secret } }, require(name) {
    if (name === '@/lib/project-access') return {
      getCurrentIdentity: async () => signedIn ? { userId: 'user-1' } : null,
      getAccessibleProject: async (room) => { calls.push(['access', room]); return allowed ? { id: room } : null; },
    };
    if (name === '@clerk/nextjs/server') return { currentUser: async () => ({ id: 'user-1', fullName: 'Ada Lovelace', hasImage: true, imageUrl: 'https://example.com/ada.png' }) };
    if (name === '@/lib/presence') return { getPresenceColor: () => 'var(--accent-primary)' };
    if (name === '@liveblocks/node') return { Liveblocks: class {
      prepareSession(id, options) {
        assert.equal(options.userInfo.name, 'Ada Lovelace');
        assert.equal(options.userInfo.avatar, 'https://example.com/ada.png');
        assert.equal(options.userInfo.color, 'var(--accent-primary)');
        calls.push(['identity', id]);
        return {
          FULL_ACCESS: ['room:write'],
          allow: (room, permissions) => calls.push(['allow', room, ...permissions]),
          authorize: async () => { if (throws) throw new Error('sensitive upstream details'); return { status, body: '{"token":"test-token"}' }; },
        };
      }
    } };
    throw new Error(name);
  } });
  return { calls, post: (body) => exports.POST(new Request('http://localhost/api/liveblocks-auth', { method: 'POST', body })) };
}

test('Liveblocks denies signed-out and nonmember requests before token issuance', async () => {
  const signedOut = setup({ signedIn: false });
  assert.equal((await signedOut.post('{"room":"room-1"}')).status, 401);
  assert.deepEqual(signedOut.calls, []);
  const denied = setup({ allowed: false });
  assert.equal((await denied.post('{"room":"room-1"}')).status, 403);
  assert.deepEqual(denied.calls, [['access', 'room-1']]);
});

test('Liveblocks rejects malformed and wildcard room requests before access checks', async () => {
  for (const body of ['{', 'null', '{}', '{"room":4}', '{"room":" "}', '{"room":"*"}', JSON.stringify({ room: 'a'.repeat(129) })]) {
    const app = setup();
    assert.equal((await app.post(body)).status, 400);
    assert.deepEqual(app.calls, []);
  }
});

test('Liveblocks grants only the checked room to the server-derived user', async () => {
  const app = setup();
  const response = await app.post('{"room":"room-1","userId":"attacker"}');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { token: 'test-token' });
  assert.deepEqual(app.calls, [['access', 'room-1'], ['identity', 'user-1'], ['allow', 'room-1', 'room:write']]);
});

test('Liveblocks configuration and upstream failures return safe JSON errors', async () => {
  for (const [options, expected] of [[{ secret: '' }, 503], [{ status: 403 }, 502], [{ throws: true }, 500]]) {
    const response = await setup(options).post('{"room":"room-1"}');
    assert.equal(response.status, expected);
    const body = await response.json();
    assert.equal(typeof body.error, 'string');
    assert.ok(!JSON.stringify(body).includes('sensitive'));
  }
});
