import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function setup(user) {
  const queries = []; const exports = {};
  const source = ts.transpileModule(readFileSync('lib/projects.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(source, { exports, require(name) {
    if (name === 'server-only') return {};
    if (name === '@clerk/nextjs/server') return { currentUser: async () => user };
    if (name === 'next/navigation') return { redirect: path => { throw new Error(path); } };
    if (name === '@/lib/prisma') return { prisma: { project: { findMany: async query => { queries.push(JSON.parse(JSON.stringify(query))); return [{ id: queries.length === 1 ? 'owned' : 'shared', name: 'Project' }]; } } } };
    throw new Error(name);
  } });
  return { queries, getProjects: exports.getProjects };
}
test('server lists separate ownership and verified email membership', async () => {
  const app = setup({ id: 'owner', emailAddresses: [
    { emailAddress: 'Verified@example.com', verification: { status: 'verified' } },
    { emailAddress: 'unverified@example.com', verification: { status: 'unverified' } },
  ] });
  const lists = await app.getProjects();
  assert.deepEqual(app.queries[0].where, { ownerId: 'owner' });
  assert.deepEqual(app.queries[1].where, { ownerId: { not: 'owner' }, collaborators: { some: { OR: [{ email: { equals: 'Verified@example.com', mode: 'insensitive' } }] } } });
  assert.equal(lists.ownedProjects[0].isOwner, true);
  assert.equal(lists.sharedProjects[0].isOwner, false);
});
test('signed-out page loads redirect before querying projects', async () => {
  const app = setup(null); await assert.rejects(app.getProjects(), /sign-in/); assert.equal(app.queries.length, 0);
});
test('users without verified email addresses have no email membership matches', async () => {
  const app = setup({ id: 'owner', emailAddresses: [] }); await app.getProjects();
  assert.deepEqual(app.queries[1].where.collaborators.some.OR, []);
});
