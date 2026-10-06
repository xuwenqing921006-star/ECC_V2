'use strict';

const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const test = require('node:test');
const { runDoctor } = require('../scripts/lib/doctor');

const ROOT = path.resolve(__dirname, '..');
const WALK_EXCLUDES = new Set([
  '.build', '.codex-tmp', '.git', '.local-run', '.local-tools', '.tmp',
  '.tmp-docx', '.worktrees', '.wt', 'Projects_Repo', 'Release_Artifacts',
  'Release_Worktrees', 'node_modules', 'outputs', 'tmp',
]);

function walk(directory) {
  const output = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && WALK_EXCLUDES.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...walk(fullPath));
    else if (entry.isFile()) output.push(fullPath);
  }
  return output;
}

test('framework Doctor passes without project state', () => {
  const result = runDoctor(ROOT, { frameworkOnly: true });
  assert.deepEqual(result.problems, []);
});

test('CLI enforces its Node 20 runtime boundary', () => {
  const cli = fs.readFileSync(path.join(ROOT, 'scripts', 'ecc-v2.js'), 'utf8');
  assert.match(cli, /nodeMajor < 20/);
  assert.match(cli, /requires Node\.js 20 or later/);
});

test('router exposes full product and maintenance lifecycle', () => {
  const router = fs.readFileSync(path.join(ROOT, 'harness-core', 'router.md'), 'utf8');
  for (const token of [
    'new-product.md',
    'existing-change.md',
    'bugfix.md',
    'refactor.md',
    'R —',
    'B1 —',
    'Product Manager',
    'Developer may implement but must not mark PASS',
    'full_independent',
    'protocols/full-independent-testing.md',
    'guard development',
    'guard completion',
  ]) {
    assert.match(router, new RegExp(token.replace(/[.*+?^$()|[\\]{}]/g, '\\\\$&')));
  }
});

test('full independent testing is a traceable opt-in protocol', () => {
  const protocol = fs.readFileSync(
    path.join(ROOT, 'harness-core', 'protocols', 'full-independent-testing.md'),
    'utf8'
  );
  const tester = fs.readFileSync(path.join(ROOT, 'harness-core', 'agents', 'tester.md'), 'utf8');
  const template = fs.readFileSync(
    path.join(ROOT, 'harness-core', 'templates', 'independent-full-test-brief.md'),
    'utf8'
  );
  for (const token of [
    '请进行全流程独立测试',
    'full_independent',
    '.sdd/test-briefs/full-test-<task-id>.md',
    'does not authorize Git commit/push/merge',
    'Developer evidence is an input, never proof of PASS',
    'Full Independent Testing Protocol v2',
    'retain_for_product_owner_retest',
    'ECC_TEST_DOMAIN:',
  ]) {
    assert.match(protocol, new RegExp(token.replace(/[.*+?^$()|[\]{}]/g, '\\$&')));
  }
  assert.match(tester, /real browser/);
  assert.match(tester, /must not be the agent that\s+implemented/);
  assert.match(template, /真实浏览器 UI/);
  assert.match(template, /PASS、FAIL 或 BLOCKED/);
  assert.match(template, /N\/A \+ 原因/);
  assert.match(template, /full-independent-test-domains-v2\.md/);
  assert.match(template, /external_real_chain/);
});

test('v2 task metadata is optional and centrally declared', () => {
  const schema = JSON.parse(fs.readFileSync(
    path.join(ROOT, 'harness-core', 'schemas', 'tasks.schema.json'),
    'utf8'
  ));
  const item = schema.properties.tasks.items;
  for (const field of [
    'verification_protocol_version', 'verification_scope', 'test_data_disposition',
  ]) {
    assert.ok(item.properties[field], 'missing optional v2 field ' + field);
    assert.ok(!item.required.includes(field), 'v2 field must remain optional: ' + field);
  }
  const domains = fs.readFileSync(
    path.join(ROOT, 'harness-core', 'protocols', 'references', 'full-independent-test-domains-v2.md'),
    'utf8'
  );
  assert.match(domains, /`ui`/);
  assert.match(domains, /`time_scheduled`/);
  assert.match(domains, /technology-neutral/);
});

test('strict workflow guard metadata is centrally declared', () => {
  const schema = JSON.parse(fs.readFileSync(
    path.join(ROOT, 'harness-core', 'schemas', 'tasks.schema.json'),
    'utf8'
  ));
  const item = schema.properties.tasks.items;
  for (const field of [
    'workflow_contract_version', 'workflow', 'change_size',
    'affectedAreas', 'compatibilityConstraints', 'migrationRollback',
    'development_readiness', 'business_acceptance',
  ]) {
    assert.ok(item.properties[field], 'missing workflow guard field ' + field);
  }
  const guard = fs.readFileSync(
    path.join(ROOT, 'scripts', 'lib', 'workflow-guard.js'),
    'utf8'
  );
  assert.match(guard, /ECC_TEST_INDEPENDENT/);
  assert.match(guard, /release gate must be reset/);
  const template = fs.readFileSync(
    path.join(ROOT, 'harness-core', 'templates', 'workflow-task-contract.md'),
    'utf8'
  );
  assert.match(template, /workflow_contract_version/);
  assert.match(template, /ECC_TEST_INDEPENDENT: true/);
  assert.match(template, /business_acceptance/);
});

test('platform adapters are thin references to one core Router', () => {
  const adapters = [
    '.claude/CLAUDE.md',
    '.codex/agents/planner.toml',
    '.cursor/rules/00-ecc-v2-router.mdc',
  ];
  for (const relative of adapters) {
    const text = fs.readFileSync(path.join(ROOT, relative), 'utf8');
    assert.match(text, /harness-core/);
    assert.ok(text.split(/\r?\n/).length < 40, relative + ' is not a thin adapter');
  }
});

test('only Windows runtime scripts remain', () => {
  const files = walk(ROOT);
  const unixScripts = files.filter(file => ['.sh', '.bash'].includes(path.extname(file)));
  assert.deepEqual(unixScripts, []);
  assert.ok(fs.existsSync(path.join(ROOT, 'install.ps1')));
  assert.ok(fs.existsSync(path.join(ROOT, 'ECC_V2.cmd')));
});

test('ECC library is curated and language packs are on demand', () => {
  const agents = fs.readdirSync(path.join(ROOT, 'harness-core', 'library', 'ecc-agents'))
    .filter(name => name.endsWith('.md'));
  const skills = fs.readdirSync(path.join(ROOT, 'harness-core', 'library', 'ecc-skills'));
  const packs = fs.readdirSync(path.join(ROOT, 'harness-core', 'language-packs'), { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);
  assert.equal(agents.length, 67);
  assert.ok(skills.length >= 25 && skills.length < 50);
  for (const pack of ['common', 'python', 'typescript', 'java', 'golang', 'rust', 'react', 'vue']) {
    assert.ok(packs.includes(pack), 'missing pack ' + pack);
  }
});
