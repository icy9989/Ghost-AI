import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function setup() {
  const state = { identity: { userId: 'owner' }, project: { isOwner: true }, writes: [], rows: [{ email: 'known@example.com' }, { email: 'missing@example.com' }], clerkFails: false, lookups: 0 };
  function load(file) {
    const exports = {};
    const require = (name) => {
      if (name === 'server-only') return {};
      if (name === '@/lib/project-access') return { getCurrentIdentity: async () => state.identity, getAccessibleProject: async () => state.project };
      if (name === '@/lib/prisma') return { prisma: { projectCollaborator: { findMany: async () => state.rows }, project: { update: async (args) => { state.writes.push(args); } } } };
      if (name === '@clerk/nextjs/server') return { clerkClient: async () => ({ users: { getUserList: async () => {
        state.lookups++;
        if (state.clerkFails) throw new Error('offline');
        return { totalCount: 1, data: [{ firstName: 'Known', lastName: 'Person', hasImage: true, imageUrl: 'https://img.clerk.com/avatar', emailAddresses: [{ emailAddress: 'KNOWN@example.com' }] }] };
      } } }) };
      if (name.startsWith('@/')) return load(name.slice(2) + '.ts');
      throw new Error(name);
    };
    const source = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    vm.runInNewContext(source, { exports, require, Response });
    return exports;
  }
  return { state, ...load('app/api/projects/[projectId]/collaborators/route.ts') };
}
const context = { params: Promise.resolve({ projectId: 'p1' }) };
const request = (body = '{}') => new Request('http://localhost', { method: 'POST', body });

test('collaborator endpoints reject signed-out and inaccessible projects before writes or enrichment', async () => {
  const api = setup();
  for (const [identity, project, status] of [[null, null, 401], [{ userId: 'outsider' }, null, 404]]) {
    api.state.identity = identity; api.state.project = project;
    for (const method of ['GET', 'POST', 'DELETE']) assert.equal((await api[method](request(), context)).status, status);
  }
  assert.equal(api.state.writes.length, 0); assert.equal(api.state.lookups, 0);
});
test('collaborators can list enriched profiles but cannot invite or remove', async () => {
  const api = setup(); api.state.project.isOwner = false;
  const data = await (await api.GET(request(), context)).json();
  assert.equal(data.isOwner, false);
  assert.equal(data.collaborators[0].displayName, 'Known Person');
  assert.equal(data.collaborators[0].imageUrl, 'https://img.clerk.com/avatar');
  assert.equal(data.collaborators[1].displayName, null);
  for (const method of ['POST', 'DELETE']) assert.equal((await api[method](request('{"email":"new@example.com"}'), context)).status, 403);
  assert.equal(api.state.writes.length, 0);
});
test('owner writes are normalized and scoped to project and owner', async () => {
  const api = setup();
  assert.equal((await api.POST(request('{"email":" New@Example.com "}'), context)).status, 200);
  const write = api.state.writes[0];
  assert.equal(write.where.id, 'p1'); assert.equal(write.where.ownerId, 'owner');
  assert.equal(write.data.collaborators.upsert.create.email, 'new@example.com');
  assert.equal((await api.DELETE(request('{"email":"NEW@example.com"}'), context)).status, 200);
  assert.equal(api.state.writes[1].data.collaborators.deleteMany.email.equals, 'new@example.com');
});
test('malformed invitations and removals do not mutate; Clerk failures preserve email list', async () => {
  const api = setup();
  for (const body of ['invalid', 'null', '[]', '{}', '{"email":1}', '{"email":"bad"}', '{"email":"a@b.c d"}']) {
    for (const method of ['POST', 'DELETE']) assert.equal((await api[method](request(body), context)).status, 400);
  }
  assert.equal(api.state.writes.length, 0);
  api.state.clerkFails = true;
  const data = await (await api.GET(request(), context)).json();
  assert.equal(data.collaborators.length, 2); assert.equal(data.collaborators[0].displayName, null);
});
