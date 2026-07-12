import { test } from 'node:test';
import assert from 'node:assert/strict';
import { levels } from '../js/levels/index.js';
import { runHeadless } from '../js/core/engine.js';
import { SOLUTIONS, CHEATS } from './solutions.js';

// Replays main.js's verifySolution headlessly for a given action log.
function verify(level, actions) {
  const results = [];
  for (const env of level.makeCases()) {
    const { state, errors } = runHeadless({
      actions, env, allowedOps: level.allowedOps, allowLiteral: !level.noLiteralContent,
    });
    if (errors) { results.push({ env, pass: false, errors }); continue; }
    results.push({ env, pass: env.check(state), state });
  }
  return { results, pass: results.every((r) => r.pass) };
}

test('every level has a reference solution', () => {
  for (const level of levels) {
    assert.ok(SOLUTIONS[level.id], `missing reference solution for ${level.id}`);
  }
});

test('reference solutions solve their level (all envs, visible + hidden)', () => {
  for (const level of levels) {
    const v = verify(level, SOLUTIONS[level.id]);
    if (!v.pass) {
      const bad = v.results.filter((r) => !r.pass)
        .map((r) => `env ${r.env.id}${r.errors ? ` [${JSON.stringify(r.errors)}]` : ''}`);
      assert.fail(`${level.id}: solution failed on ${bad.join(', ')}`);
    }
  }
});

test('anti-cheat: a cheat passes every VISIBLE env but fails a hidden one', () => {
  for (const [id, cheat] of Object.entries(CHEATS)) {
    const level = levels.find((l) => l.id === id);
    const { results } = verify(level, cheat);
    const visible = results.filter((r) => r.env.visible);
    const hidden = results.filter((r) => !r.env.visible);
    assert.ok(visible.every((r) => r.pass), `${id}: cheat should pass all visible envs (be plausible)`);
    assert.ok(hidden.some((r) => !r.pass), `${id}: a hidden env should defeat the cheat`);
  }
});

test('every level exposes the fields the UI relies on', () => {
  for (const level of levels) {
    assert.ok(level.id && level.title?.en && level.title?.it, `${level.id}: title`);
    assert.ok(level.text?.en && level.goal?.en, `${level.id}: text/goal`);
    assert.ok(Array.isArray(level.allowedOps) && level.allowedOps.length, `${level.id}: allowedOps`);
    assert.ok(Array.isArray(level.tokens) && Array.isArray(level.paths), `${level.id}: tokens/paths`);
    const envs = level.makeCases();
    assert.ok(envs.some((e) => e.visible) && envs.some((e) => !e.visible),
      `${level.id}: needs visible AND hidden envs`);
    // every token referenced by paths/solution must be bound in every env
    for (const e of envs) {
      for (const tok of level.tokens) {
        assert.ok(tok in e.content, `${level.id}: env ${e.id} missing token ${tok}`);
      }
    }
  }
});
