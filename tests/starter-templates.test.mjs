import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import vm from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
function load(file, overrides = {}, globals = {}) {
  const exports = {};
  const source = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(source, { exports, structuredClone, crypto: { randomUUID }, ...globals, require(name) {
    if (name in overrides) return overrides[name];
    if (name.endsWith('.css')) return {};
    if (name.startsWith('@/')) return load(`${name.slice(2)}.ts`, overrides);
    return require(name);
  } });
  return exports;
}
const { CANVAS_TEMPLATES } = load('components/editor/starter-templates.ts');

test('starter graphs have unique IDs, valid connections, dimensions, and shared palette/shape data', () => {
  const { NODE_COLORS, NODE_SHAPES } = load('types/canvas.ts');
  assert.ok(CANVAS_TEMPLATES.length >= 3);
  assert.equal(new Set(CANVAS_TEMPLATES.map(t => t.id)).size, CANVAS_TEMPLATES.length);
  for (const template of CANVAS_TEMPLATES) {
    const ids = new Set(template.nodes.map(n => n.id));
    assert.equal(ids.size, template.nodes.length);
    assert.equal(new Set(template.edges.map(e => e.id)).size, template.edges.length);
    for (const node of template.nodes) {
      assert.equal(node.type, 'canvasNode');
      assert.ok(node.width > 0 && node.height > 0);
      assert.ok(NODE_SHAPES.includes(node.data.shape));
      assert.ok(NODE_COLORS.some(c => c.color === node.data.color && c.textColor === node.data.textColor));
    }
    for (const edge of template.edges) {
      assert.ok(ids.has(edge.source) && ids.has(edge.target));
      assert.equal(edge.type, 'canvasEdge');
    }
  }
});

test('import replaces populated and repeated graphs through deletion before additions, then fits after render', () => {
  let nodes = [{ id: 'old-node' }], edges = [{ id: 'old-edge' }];
  let effect, frame, batchCount = 0, fitCount = 0;
  const pending = { current: null };
  const calls = [];
  const presenceUpdates = [];
  const flow = { screenToFlowPosition(position, options) {
    assert.equal(options.snapToGrid, false);
    return { x: (position.x - 100) / 2, y: (position.y - 50) / 2 };
  }, fitView(options) {
    assert.equal(options.nodes.length, nodes.length);
    assert.ok(options.nodes.every(n => nodes.some(current => current.id === n.id)));
    fitCount++;
  } };
  const jsx = (type, props) => ({ type, props });
  const { Canvas } = load('components/editor/canvas.tsx', {
    '@/hook/use-canvas-autosave': { useCanvasAutosave() {} },
    react: { useState: () => [flow, () => {}], useRef: () => pending, useEffect: fn => { effect = fn; } },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    '@liveblocks/react/suspense': { useUpdateMyPresence: () => update => presenceUpdates.push(update), useRoom: () => ({ batch(fn) { batchCount++; fn(); } }) },
    '@liveblocks/react-flow': { useLiveblocksFlow: () => ({ nodes, edges,
      onDelete(graph) { calls.push('delete'); nodes = nodes.filter(n => !graph.nodes.includes(n)); edges = edges.filter(e => !graph.edges.includes(e)); },
      onNodesChange(changes) { calls.push('nodes'); assert.equal(nodes.length, 0); assert.equal(edges.length, 0); nodes = changes.map(c => c.item); },
      onEdgesChange(changes) { calls.push('edges'); assert.equal(edges.length, 0); edges = changes.map(c => c.item); },
    }) },
    ...Object.fromEntries(['canvas-node', 'canvas-edge', 'shape-panel', 'canvas-controls', 'canvas-presence', 'canvas-cursors', 'starter-templates-modal'].map(name => [`@/components/editor/${name}`, {}])),
  }, { requestAnimationFrame: fn => { frame = fn; return 1; }, cancelAnimationFrame: () => {} });
  const canvasTree = Canvas({ templatesOpen: false, onTemplatesOpenChange() {} });
  const reactFlow = canvasTree.props.children[0];
  reactFlow.props.onMouseMove({ clientX: 140, clientY: 90 });
  assert.equal(presenceUpdates[0].cursor.x, 20);
  assert.equal(presenceUpdates[0].cursor.y, 20);
  reactFlow.props.onMouseLeave();
  assert.equal(presenceUpdates[1].cursor, null);
  const original = JSON.stringify(CANVAS_TEMPLATES);
  let previousIds = new Set(['old-node']);
  for (const template of [CANVAS_TEMPLATES[0], CANVAS_TEMPLATES[0], CANVAS_TEMPLATES[2]]) {
    const tree = Canvas({ templatesOpen: true, onTemplatesOpenChange() {} });
    const modal = tree.props.children.find(child => child.props?.onImport);
    modal.props.onImport(template);
    assert.equal(nodes.length, template.nodes.length);
    assert.equal(edges.length, template.edges.length);
    assert.ok(nodes.every(n => !previousIds.has(n.id)));
    assert.ok(edges.every(e => nodes.some(n => n.id === e.source) && nodes.some(n => n.id === e.target)));
    assert.equal(pending.current.length, nodes.length);
    Canvas({ templatesOpen: false, onTemplatesOpenChange() {} });
    effect(); frame();
    assert.equal(pending.current, null);
    previousIds = new Set(nodes.map(n => n.id));
    nodes[0].data.label = 'Edited after import';
  }
  assert.equal(JSON.stringify(CANVAS_TEMPLATES), original);
  assert.equal(batchCount, 3);
  assert.equal(fitCount, 3);
  assert.deepEqual(calls, ['delete', 'nodes', 'edges', 'delete', 'nodes', 'edges', 'delete', 'nodes', 'edges']);
});
