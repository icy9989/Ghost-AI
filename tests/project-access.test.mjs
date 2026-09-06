import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function setup(user, row = null) {
  const queries = [];
  const load = (file, overrides = {}) => {
    const exports = {};
    const source = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    vm.runInNewContext(source, { exports, require(name) {
      if (name in overrides) return overrides[name];
      if (name === 'server-only') return {};
      if (name === '@clerk/nextjs/server') return { currentUser: async () => user };
      if (name === '@/lib/prisma') return { prisma: { project: { findFirst: async query => { queries.push(JSON.parse(JSON.stringify(query))); return row; } } } };
      throw new Error(name);
    } });
    return exports;
  };
  return { queries, load, ...load('lib/project-access.ts') };
}
test('identity uses only the verified primary email and handles signed-out users', async () => {
  assert.equal(await setup(null).getCurrentIdentity(), null);
  for (const status of ['verified', 'unverified']) {
    const identity = await setup({ id: 'u1', primaryEmailAddress: { emailAddress: 'Primary@example.com', verification: { status } }, emailAddresses: [{ emailAddress: 'other@example.com' }] }).getCurrentIdentity();
    assert.equal(identity.userId, 'u1');
    assert.equal(identity.primaryEmail, status === 'verified' ? 'Primary@example.com' : null);
  }
});
test('access query requires the requested room and owner or collaborator membership', async () => {
  const app = setup(null, { id: 'room', name: 'Workspace', ownerId: 'owner' });
  const project = await app.getAccessibleProject('room', { userId: 'collaborator', primaryEmail: 'member@example.com' });
  assert.deepEqual(app.queries[0].where, { id: 'room', OR: [{ ownerId: 'collaborator' }, { collaborators: { some: { email: { equals: 'member@example.com', mode: 'insensitive' } } } }] });
  assert.equal(project.isOwner, false);
  assert.equal((await app.getAccessibleProject('room', { userId: 'owner', primaryEmail: null })).isOwner, true);
  assert.deepEqual(app.queries[1].where.OR, [{ ownerId: 'owner' }]);
});
test('missing or unauthorized projects return null', async () => {
  assert.equal(await setup(null).getAccessibleProject('missing', { userId: 'u1', primaryEmail: null }), null);
});
test('workspace page redirects signed-out users and renders AccessDenied for denied access', async () => {
  for (const mode of ['signed-out', 'denied', 'allowed']) {
    const app = setup(null); let listsRead = false;
    const page = app.load('app/editor/[roomId]/page.tsx', {
      'react/jsx-runtime': { jsx: (type, props) => ({ type, props }) },
      'next/navigation': { redirect: path => { throw new Error(path); } },
      '@/components/editor/access-denied': { AccessDenied: 'AccessDenied' },
      '@/components/editor/editor-shell': { EditorShell: 'EditorShell' },
      '@/lib/project-access': { getCurrentIdentity: async () => mode === 'signed-out' ? null : { userId: 'u1' }, getAccessibleProject: async () => mode === 'allowed' ? { id: 'room', name: 'Project' } : null },
      '@/lib/projects': { getProjects: async () => { listsRead = true; return { ownedProjects: [], sharedProjects: [] }; } },
    }).default;
    if (mode === 'signed-out') await assert.rejects(page({ params: Promise.resolve({ roomId: 'room' }) }), /sign-in/);
    else {
      const result = await page({ params: Promise.resolve({ roomId: 'room' }) });
      assert.equal(result.type, mode === 'allowed' ? 'EditorShell' : 'AccessDenied');
      if (mode === 'allowed') assert.equal(result.props.activeProject.id, 'room');
    }
    assert.equal(listsRead, mode === 'allowed');
  }
});
