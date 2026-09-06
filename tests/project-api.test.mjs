import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

// Load the actual handlers with isolated Clerk/database boundaries; no live writes.
function setup() {
  const state = { userId: 'owner', rows: [{ id: 'p1', ownerId: 'owner', name: 'Original' }], writes: 0 };
  const project = {
    findMany: async ({ where }) => state.rows.filter(row => row.ownerId === where.ownerId),
    findUnique: async ({ where }) => state.rows.find(row => row.id === where.id) ?? null,
    create: async ({ data }) => { state.writes++; const row = { id: 'generated', ...data }; state.rows.push(row); return row; },
    update: async ({ where, data }) => { state.writes++; const row = state.rows.find(row => row.id === where.id && row.ownerId === where.ownerId); assert.ok(row); Object.assign(row, data); return row; },
    delete: async ({ where }) => { state.writes++; const index = state.rows.findIndex(row => row.id === where.id && row.ownerId === where.ownerId); assert.ok(index >= 0); return state.rows.splice(index, 1)[0]; },
  };
  const cache = {};
  function load(file) {
    if (cache[file]) return cache[file];
    const exports = {};
    const source = ts.transpileModule(readFileSync(resolve(file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    const mockedRequire = (name) => {
      if (name === '@clerk/nextjs/server') return { auth: async () => ({ userId: state.userId }) };
      if (name === '@/lib/prisma') return { prisma: { project } };
      if (name === '@/lib/generated/prisma/client') return { Prisma: { PrismaClientKnownRequestError: class extends Error {} } };
      if (name.startsWith('@/')) return load(name.slice(2) + '.ts');
      throw new Error(`Unexpected import: ${name}`);
    };
    vm.runInNewContext(source, { exports, require: mockedRequire, Response, console }, { filename: file });
    return cache[file] = exports;
  }
  return { state, ...load('app/api/projects/route.ts'), ...load('app/api/projects/[projectId]/route.ts') };
}
const context = { params: Promise.resolve({ projectId: 'p1' }) };
const request = (body = '{}') => new Request('http://localhost/api/projects', { method: 'POST', body });

test('all endpoints reject signed-out callers before database writes', async () => {
  const api = setup(); api.state.userId = null;
  for (const response of [await api.GET(), await api.POST(request()), await api.PATCH(request(), context), await api.DELETE(request(), context)]) assert.equal(response.status, 401);
  assert.equal(api.state.writes, 0);
});
test('list is owner scoped and create ignores client ownership and IDs', async () => {
  const api = setup(); api.state.rows.push({ id: 'foreign', ownerId: 'other', name: 'Private' });
  assert.deepEqual((await (await api.GET()).json()).projects.map(p => p.id), ['p1']);
  const response = await api.POST(request('{"ownerId":"other","id":"sequential"}'));
  assert.equal(response.status, 201);
  assert.deepEqual((await response.json()).project, { id: 'generated', ownerId: 'owner', name: 'Untitled Project' });
});
test('non-owners cannot rename or delete, including with invalid input', async () => {
  const api = setup(); api.state.userId = 'other';
  assert.equal((await api.PATCH(request('invalid'), context)).status, 403);
  assert.equal((await api.DELETE(request(), context)).status, 403);
  assert.equal(api.state.writes, 0);
});
test('owner can rename and delete; missing projects return 404', async () => {
  const api = setup();
  const renamed = await api.PATCH(request('{"name":"Renamed","ownerId":"other"}'), context);
  assert.equal(renamed.status, 200);
  assert.equal((await renamed.json()).project.name, 'Renamed');
  assert.equal(api.state.rows[0].ownerId, 'owner');
  assert.equal((await api.DELETE(request(), context)).status, 200);
  assert.equal((await api.PATCH(request('{"name":"Missing"}'), context)).status, 404);
  assert.equal((await api.DELETE(request(), context)).status, 404);
});
test('invalid bodies and names return 400 without mutations', async () => {
  const api = setup();
  for (const body of ['broken', 'null', '[]', '1', '{"name":null}', '{"name":3}', '{"name":"  "}']) {
    assert.equal((await api.POST(request(body))).status, 400);
    assert.equal((await api.PATCH(request(body), context)).status, 400);
  }
  assert.equal((await api.PATCH(request(), context)).status, 400);
  assert.equal(api.state.writes, 0);
});

test('create preserves a validated room ID and ignores supplied ownership', async () => {
  const api = setup();
  const response = await api.POST(request(JSON.stringify({ name: 'New project', roomId: 'new-project-abcdef123456', ownerId: 'other' })));
  assert.equal(response.status, 201);
  assert.deepEqual((await response.json()).project, { name: 'New project', id: 'new-project-abcdef123456', ownerId: 'owner' });
});
test('create rejects unsafe and malformed room IDs before writing', async () => {
  const api = setup();
  for (const roomId of [null, 1, '', '../escape', 'no-suffix', 'x'.repeat(201) + '-abcdef123456']) {
    assert.equal((await api.POST(request(JSON.stringify({ roomId })))).status, 400);
  }
  assert.equal(api.state.writes, 0);
});
