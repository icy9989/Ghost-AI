import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
function load(file, overrides = {}) {
  const exports = {};
  const source = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(source, { exports, require(name) {
    if (name in overrides) return overrides[name];
    if (name === '@/lib/presence') return load('lib/presence.ts');
    return require(name);
  } });
  return exports;
}

function setup(others, userId = 'self') {
  const overrides = {
    '@clerk/nextjs': {
      useAuth: () => ({ userId }),
      UserButton: ({ appearance }) => React.createElement('button', { 'aria-label': 'Clerk profile', style: appearance.elements.avatarBox }),
    },
    '@liveblocks/react/suspense': {
      shallow: () => {},
      useOthersMapped: selector => others.map((other, index) => [index, selector(other)]),
    },
    '@xyflow/react': { useViewport: () => ({ x: 50, y: -20, zoom: 2 }) },
  };
  return {
    avatars: () => renderToStaticMarkup(React.createElement(load('components/editor/canvas-presence.tsx', overrides).CanvasPresence)),
    cursors: () => renderToStaticMarkup(React.createElement(load('components/editor/canvas-cursors.tsx', overrides).CanvasCursors)),
  };
}

function participant(id, name = id, cursor = { x: 10, y: 30 }) {
  return { id, info: { name, color: 'var(--accent-primary)' }, presence: { cursor, thinking: false } };
}

test('solo and same-user sessions show only Clerk profile without a divider', () => {
  for (const others of [[], [participant('self'), participant('self')]]) {
    const html = setup(others).avatars();
    assert.equal((html.match(/<button/g) || []).length, 1);
    assert.ok(html.includes('width:32px;height:32px'));
    assert.ok(!html.includes('role="img"'));
    assert.ok(!html.includes('w-px'));
    assert.ok(!html.includes('more collaborators'));
  }
});

test('collaborators have photos or initials, are display-only, and overflow after five unique users', () => {
  const ada = participant('ada', 'Ada Lovelace');
  ada.info.avatar = 'https://example.com/ada.png';
  const html = setup([participant('self'), ada, ada, participant('grace', 'Grace Hopper'), ...Array.from({ length: 5 }, (_, i) => participant(`other-${i}`))]).avatars();
  assert.equal((html.match(/role="img"/g) || []).length, 5);
  assert.equal((html.match(/<button/g) || []).length, 1);
  assert.ok(html.includes('src="https://example.com/ada.png"'));
  assert.ok(html.includes('>GH</span>'));
  assert.ok(html.includes('2 more collaborators'));
  assert.ok(html.includes('>+2</span>'));
  assert.ok(html.includes('w-px'));
  assert.ok(!html.includes('aria-label="self"'));
  const five = setup(Array.from({ length: 5 }, (_, i) => participant(`user-${i}`))).avatars();
  assert.ok(!five.includes('more collaborators'));
});

test('remote cursors respect viewer pan and zoom, ignore self and null positions, and share pointer/badge colors', () => {
  const html = setup([participant('self'), participant('ada', 'Ada Lovelace'), participant('away', 'Away', null)]).cursors();
  assert.equal((html.match(/<svg/g) || []).length, 1);
  assert.ok(html.includes('translate(70px, 40px)'));
  assert.ok(html.includes('color:var(--accent-primary)'));
  assert.ok(html.includes('background-color:var(--accent-primary)'));
  assert.ok(html.includes('Ada Lovelace'));
  assert.ok(!html.includes('Away'));
  assert.ok(html.includes('pointer-events-none'));
  assert.ok(!setup([participant('ada')], null).cursors().includes('<svg'));
});
