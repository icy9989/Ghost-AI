import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { test } from 'node:test';
function load(file, mocks = {}, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText,
    { exports, ...globals, require: name => mocks[name] ?? load(`${name.slice(2)}.ts`, mocks, globals) });
  return exports;
}
const snapshot = load('lib/canvas-snapshot.ts');
const graph = { nodes: [{ id: 'n', type: 'canvasNode', position: { x: 1, y: 2 }, data: { label: '', color: '#fff', shape: 'rectangle' } }], edges: [] };
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
function harness(initial, fetch) {
  const effects = [], timers = new Map(), statuses = [];
  let options = { projectId: 'p', ...initial, hasContent: () => options.nodes.length > 0 || options.edges.length > 0, restore: value => { options = { ...options, ...value }; }, onStatus: value => statuses.push(value) };
  let ref, event, cursor;
  const { useCanvasAutosave: runHook } = load('hook/use-canvas-autosave.ts', {
    '@/lib/canvas-snapshot': snapshot,
    react: {
      useRef: value => ref ??= { current: value },
      useEffectEvent: fn => { event = fn; return () => event(); },
      useEffect: (fn, deps) => {
        const index = cursor++;
        const previous = effects[index];
        if (!previous || deps.some((d, i) => d !== previous.deps[i])) effects[index] = { fn, deps, pending: true };
      },
    },
  }, { fetch, AbortController, setTimeout: fn => { const id = Symbol(); timers.set(id, fn); return id; }, clearTimeout: id => timers.delete(id) });
  function render(changes = {}) { options = { ...options, ...changes }; cursor = 0; runHook(options); for (const effect of effects) if (effect.pending) { effect.pending = false; effect.cleanup = effect.fn(); } }
  return { render, statuses, timers, tick: () => { const callbacks = [...timers.values()]; timers.clear(); callbacks.forEach(fn => fn()); }, options: () => options };
}
test('snapshot validation rejects malformed graphs and serialization ignores local selection', () => {
  assert.ok(snapshot.isCanvasSnapshot(graph));
  assert.ok(!snapshot.isCanvasSnapshot({ ...graph, edges: [{ id: 'e', source: 'n', target: 'missing' }] }));
  assert.ok(!snapshot.isCanvasSnapshot({ nodes: [graph.nodes[0], graph.nodes[0]], edges: [] }));
  assert.equal(snapshot.serializeCanvas(graph), snapshot.serializeCanvas({ ...graph, nodes: [{ ...graph.nodes[0], selected: true, measured: { width: 10 } }] }));
});
test('populated rooms skip GET, debounce changes, and save empty deletions', async () => {
  const calls = [];
  const h = harness(graph, async (_url, options) => { calls.push(options); return { ok: true }; });
  h.render(); await flush();
  assert.equal(calls.length, 0);
  h.render({ nodes: [{ ...graph.nodes[0], position: { x: 3, y: 4 } }] });
  assert.equal(h.timers.size, 1);
  h.tick(); await flush();
  assert.equal(calls[0].method, 'PUT');
  assert.equal(h.statuses.at(-1), 'saved');
  h.render({ nodes: [], edges: [] }); h.tick(); await flush();
  assert.deepEqual(JSON.parse(calls[1].body), { nodes: [], edges: [] });
});
test('restoration rechecks room contents after an in-flight GET', async () => {
  let resolve;
  const h = harness({ nodes: [], edges: [] }, () => new Promise(r => { resolve = r; }));
  h.render();
  h.render(graph);
  resolve({ ok: true, json: async () => ({ canvas: { nodes: [], edges: [] } }) });
  await flush();
  assert.equal(h.options().nodes.length, 1);
});
test('failed initial loads block PUT and retry can restore without saving empty state', async () => {
  let attempts = 0;
  const h = harness({ nodes: [], edges: [] }, async (_url, options) => {
    assert.notEqual(options.method, 'PUT');
    return ++attempts === 1 ? { ok: false } : { ok: true, json: async () => ({ canvas: graph }) };
  });
  h.render(); await flush();
  assert.equal(h.statuses.at(-1), 'error');
  h.tick(); await flush(); assert.equal(attempts, 1);
  h.render({ saveRequest: 1 }); await flush(); h.render();
  assert.equal(h.options().nodes.length, 1);
  assert.equal(h.timers.size, 0);
});

test('canvas routes enforce membership and store only the returned URL in Prisma', async () => {
  let identity = null, accessible = false, writes = 0, uploaded, stored;
  const route = load('app/api/projects/[projectId]/canvas/route.ts', {
    '@/lib/canvas-snapshot': snapshot,
    '@/lib/project-access': { getCurrentIdentity: async () => identity, getAccessibleProject: async () => accessible },
    '@/lib/prisma': { prisma: { project: { update: async args => { writes++; stored = args.data; }, findUnique: async () => ({ canvasJsonPath: 'https://example.private.blob.vercel-storage.com/canvas/p.json' }) } } },
    '@vercel/blob': { put: async (_path, body) => { uploaded = body; return { url: 'blob-url' }; }, get: async () => ({ statusCode: 200, stream: new Response(JSON.stringify(graph)).body }) },
  }, { Request, Response });
  const context = { params: Promise.resolve({ projectId: 'p' }) };
  const request = () => new Request('https://app/api/projects/p/canvas', { method: 'PUT', body: JSON.stringify(graph) });
  assert.equal((await route.PUT(request(), context)).status, 401);
  identity = { userId: 'u' };
  assert.equal((await route.GET(request(), context)).status, 404);
  assert.equal(writes, 0);
  accessible = true;
  assert.equal((await route.PUT(request(), context)).status, 200);
  assert.equal(uploaded, JSON.stringify(graph));
  assert.deepEqual(JSON.parse(JSON.stringify(stored)), { canvasJsonPath: 'blob-url' });
  assert.deepEqual(await (await route.GET(request(), context)).json(), { canvas: graph });
});

test('edits during an active save wait for it and then persist the newest content', async () => {
  const calls = [];
  let finish;
  const h = harness(graph, (_url, options) => {
    calls.push(options);
    return new Promise(resolve => { finish = resolve; });
  });
  h.render(); await flush(); h.tick();
  assert.equal(calls.length, 1);
  h.render({ nodes: [{ ...graph.nodes[0], data: { ...graph.nodes[0].data, label: 'Latest' } }] });
  h.tick(); assert.equal(calls.length, 1);
  finish({ ok: true }); await flush();
  assert.equal(h.statuses.at(-1), 'saving');
  h.tick(); assert.equal(calls.length, 2);
  assert.equal(JSON.parse(calls[1].body).nodes[0].data.label, 'Latest');
  finish({ ok: true }); await flush();
  assert.equal(h.statuses.at(-1), 'saved');
});
