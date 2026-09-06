import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

// Exercise the actual hook with isolated React state, navigation, and HTTP boundaries.
function setup(activeId) {
  const slots = []; let cursor = 0;
  const calls = []; const navigation = [];
  const state = { status: 200, error: null };
  const react = {
    useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], value => { slots[index] = value; }]; },
    useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial }; },
  };
  const exports = {};
  const source = ts.transpileModule(readFileSync('hooks/use-project-actions.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(source, {
    exports, Error, HTMLElement: class {}, document: { activeElement: null },
    crypto: { randomUUID: () => 'abcdef12-3456-7890-abcd-123456789012' },
    require: name => name === 'react' ? react : { useRouter: () => ({ push: path => navigation.push(['push', path]), replace: path => navigation.push(['replace', path]), refresh: () => navigation.push(['refresh']) }) },
    fetch: async (url, options) => {
      calls.push({ url, ...options });
      const body = options.body ? JSON.parse(options.body) : {};
      return { ok: state.status === 200, json: async () => ({ project: { id: body.roomId ?? 'p1' }, error: state.error }) };
    },
  });
  return { calls, navigation, state, render() { cursor = 0; return exports.useProjectActions(activeId); } };
}
const owned = { id: 'p1', name: 'Original', isOwner: true };
test('create sends the preview room ID and navigates to the saved workspace', async () => {
  const app = setup(); app.render().openCreate(); app.render().setName(' Café API ');
  const action = app.render(); assert.equal(action.roomId, 'cafe-api-abcdef123456');
  await action.submit();
  assert.deepEqual(JSON.parse(app.calls[0].body), { name: 'Café API', roomId: action.roomId });
  assert.deepEqual(app.navigation, [['push', '/editor/cafe-api-abcdef123456']]);
  assert.equal(app.render().dialog, null);
});
test('rename prefills the current name, preserves ID and refreshes', async () => {
  const app = setup(); app.render().openRename(owned); assert.equal(app.render().name, 'Original');
  app.render().setName('新名称'); await app.render().submit();
  assert.equal(app.calls[0].method, 'PATCH'); assert.equal(app.calls[0].url, '/api/projects/p1');
  assert.deepEqual(JSON.parse(app.calls[0].body), { name: '新名称' });
  assert.deepEqual(app.navigation, [['refresh']]);
});
test('delete redirects for the active project and refreshes for other projects', async () => {
  for (const active of ['p1', 'p2']) {
    const app = setup(active); app.render().openDelete(owned); assert.equal(app.render().dialog.project.name, 'Original');
    await app.render().submit(); assert.equal(app.calls[0].method, 'DELETE');
    assert.deepEqual(app.navigation, active === 'p1' ? [['replace', '/editor'], ['refresh']] : [['refresh']]);
  }
});
test('errors keep the dialog open and shared project mutations are blocked', async () => {
  const app = setup(); app.render().openDelete({ ...owned, isOwner: false }); assert.equal(app.render().dialog, null);
  app.render().openRename(owned); app.state.status = 403; app.state.error = 'Forbidden';
  await app.render().submit(); assert.equal(app.render().error, 'Forbidden');
  assert.equal(app.render().dialog.type, 'rename'); assert.equal(app.render().isLoading, false);
  assert.deepEqual(app.navigation, []);
});
