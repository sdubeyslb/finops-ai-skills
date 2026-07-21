'use strict';

// Zero-dependency test suite — run with `npm test` (node --test).
// Exercises the CLI end-to-end via child processes so we test real behaviour.

const { test } = require('node:test');
const assert = require('node:assert');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const SKILL_DIR = path.resolve(__dirname, '..');
const INDEX = path.join(SKILL_DIR, 'index.js');

function run(args, opts = {}) {
  return execFileSync('node', [INDEX, ...args], {
    encoding: 'utf8',
    cwd: opts.cwd || SKILL_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function tmpRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'acc-skill-'));
  fs.writeFileSync(path.join(dir, 'package.json'), '{"name":"fixture"}\n');
  return dir;
}

test('index.js parses (syntax)', () => {
  execFileSync('node', ['--check', INDEX], { stdio: 'ignore' });
});

test('exactly 21 prompts, FINOPS-00..20', () => {
  const out = JSON.parse(run(['--list-prompts']));
  assert.strictEqual(out.promptCount, 21, 'expected exactly 21 prompt files');
  const ids = out.prompts.map(p => p.id);
  assert.ok(ids.includes('FINOPS-00-Shared-Context'), 'shared context present');
  for (let i = 1; i <= 20; i++) {
    const n = String(i).padStart(2, '0');
    assert.ok(ids.some(id => id.startsWith(`FINOPS-${n}-`)), `FINOPS-${n} present`);
  }
});

test('bundled stylesheet resolves and respects palette discipline', () => {
  const css = run(['--read-style-css']);
  assert.match(css, /:root/, 'has :root tokens');
  assert.match(css, /--accent:\s*#1877f2/i, 'Facebook blue accent present');
  // Check actual declarations, not documentation comments.
  const decls = css.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/#000000/i.test(decls), 'no pure black');
  assert.ok(!/(purple|violet|#800080|#7f007f)/i.test(decls), 'no purple/violet');
});

test('opt-in gate: no config => excluded', () => {
  const dir = tmpRepo();
  const out = JSON.parse(run(['--scan-repos'], { cwd: dir }));
  assert.strictEqual(out.includedCount, 0, 'repo without config is excluded');
});

test('opt-in gate: avoid-cloud-cost-config.yaml => included', () => {
  const dir = tmpRepo();
  fs.mkdirSync(path.join(dir, 'skill-config'));
  fs.copyFileSync(
    path.join(SKILL_DIR, 'skill-config', 'avoid-cloud-cost-config.minimal.yaml'),
    path.join(dir, 'skill-config', 'avoid-cloud-cost-config.yaml'),
  );
  const out = JSON.parse(run(['--scan-repos'], { cwd: dir }));
  assert.strictEqual(out.includedCount, 1, 'repo with config opts in');
});

test('sample configs parse through the bundled YAML parser', () => {
  // minimal => zero overrides
  const min = tmpRepo();
  fs.mkdirSync(path.join(min, 'skill-config'));
  fs.copyFileSync(
    path.join(SKILL_DIR, 'skill-config', 'avoid-cloud-cost-config.minimal.yaml'),
    path.join(min, 'skill-config', 'avoid-cloud-cost-config.yaml'),
  );
  const minCfg = JSON.parse(run(['--read-config'], { cwd: min }));
  assert.strictEqual(minCfg.promptOverrideCount, 0);

  // example => 21 per-prompt overrides (FINOPS-00..20)
  const full = tmpRepo();
  fs.mkdirSync(path.join(full, 'skill-config'));
  fs.copyFileSync(
    path.join(SKILL_DIR, 'skill-config', 'avoid-cloud-cost-config.example.yaml'),
    path.join(full, 'skill-config', 'avoid-cloud-cost-config.yaml'),
  );
  const fullCfg = JSON.parse(run(['--read-config'], { cwd: full }));
  assert.strictEqual(fullCfg.promptOverrideCount, 21);
});
