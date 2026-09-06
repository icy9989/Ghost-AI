import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function setup(isOwner = true) {
  const slots = []; let cursor = 0; let effect; let started = false;
  const state = { calls: [], copied: '', timer: null, fail: false };
  const react = {
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], value => { slots[i] = value; }]; },
    useRef(initial) { const i = cursor++; return slots[i] ??= { current: initial }; },
    useEffect(callback) { if (!started) effect = callback; },
  };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync('hooks/use-share-dialog.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, {
    exports, require: () => react, AbortController, Error,
    window: { location: { origin: 'https://ghost.example' } },
    navigator: { clipboard: { writeText: async text => { state.copied = text; } } },
    setTimeout: callback => { state.timer = callback; return 1; }, clearTimeout: () => { state.timer = null; },
    fetch: async (url, options) => { state.calls.push({ url, ...options }); return { ok: !state.fail, json: async () => ({ isOwner, collaborators: [{ email: 'a@example.com' }], error: 'Forbidden' }) }; },
  });
  return { state, render() { cursor = 0; return exports.useShareDialog('p1'); }, async mount() { this.render(); started = true; effect(); await new Promise(resolve => setImmediate(resolve)); } };
}

test('share hook loads access, submits invitations/removals, and reports failures', async () => {
  const app = setup(); await app.mount();
  assert.equal(app.render().loading, false); assert.equal(app.render().isOwner, true);
  app.render().setEmail('new@example.com'); await app.render().invite();
  assert.equal(app.state.calls[1].method, 'POST'); assert.equal(app.render().email, '');
  await app.render().remove('a@example.com'); assert.equal(app.state.calls[3].method, 'DELETE');
  app.state.fail = true; await app.render().remove('a@example.com'); assert.equal(app.render().error, 'Forbidden');
});
test('read-only access prevents mutations and copy feedback expires', async () => {
  const app = setup(false); await app.mount();
  await app.render().invite(); await app.render().remove('a@example.com'); assert.equal(app.state.calls.length, 1);
  await app.render().copyLink(); assert.equal(app.state.copied, 'https://ghost.example/editor/p1'); assert.equal(app.render().copied, true);
  app.state.timer(); assert.equal(app.render().copied, false);
});
