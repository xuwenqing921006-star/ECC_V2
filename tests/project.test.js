'use strict';

const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');
const { readJson } = require('../scripts/lib/fs-safe');
const { initializeProject, updateGate, updateStatus, useProject } = require('../scripts/lib/project');

const ROOT = path.resolve(__dirname, '..');

function fixtureRoot(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ecc-v2-project-'));
  fs.mkdirSync(path.join(root, 'Projects_Repo'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'templates'), path.join(root, 'templates'), { recursive: true });
  fs.writeFileSync(path.join(root, 'project-registry.json'), JSON.stringify({
    schema_version: 2,
    projects_root: 'Projects_Repo',
    active_project_id: null,
    projects: [],
  }, null, 2));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

test('managed project initialization creates SDD state and all three tool entries', t => {
  const root = fixtureRoot(t);
  const result = initializeProject(root, {
    id: 'inventory',
    name: '库存系统',
    type: 'web',
    mode: 'managed',
    source: 'new',
  });
  assert.equal(result.project.mode, 'managed');
  assert.ok(fs.existsSync(path.join(result.projectPath, '.sdd', 'project.json')));
  assert.ok(fs.existsSync(path.join(result.projectPath, 'AGENTS.md')));
  assert.ok(fs.existsSync(path.join(result.projectPath, 'CLAUDE.md')));
  assert.ok(fs.existsSync(path.join(result.projectPath, '.cursor', 'rules', '00-ecc-v2-project.mdc')));
  const project = readJson(path.join(result.projectPath, '.sdd', 'project.json'));
  const status = readJson(path.join(result.projectPath, '.sdd', 'status.json'));
  assert.equal(project.schema_version, 2);
  assert.equal(project.id, 'inventory');
  assert.equal(status.phase, 'initialized');
  assert.equal(status.gates.development, 'pending');
  const entry = fs.readFileSync(path.join(result.projectPath, 'AGENTS.md'), 'utf8');
  assert.ok(!entry.includes('__HARNESS_ROOT__'));
  assert.match(entry, /请进行全流程独立测试/);
  assert.match(entry, /never copy the full-independent protocol/);
});

test('external import preserves existing business files', t => {
  const root = fixtureRoot(t);
  const external = fs.mkdtempSync(path.join(os.tmpdir(), 'ecc-v2-external-'));
  t.after(() => fs.rmSync(external, { recursive: true, force: true }));
  fs.writeFileSync(path.join(external, 'README.md'), 'existing business readme\n');
  const result = initializeProject(root, {
    id: 'legacy',
    name: 'Legacy',
    type: 'unknown',
    mode: 'external',
    source: 'imported',
    path: external,
  });
  assert.equal(fs.readFileSync(path.join(external, 'README.md'), 'utf8'), 'existing business readme\n');
  assert.ok(fs.existsSync(path.join(external, '.sdd', 'project.json')));
  assert.equal(result.project.mode, 'external');
});

test('status updates are persisted and project switching is registry-only', t => {
  const root = fixtureRoot(t);
  const first = initializeProject(root, {
    id: 'first',
    name: 'First',
    type: 'web',
    mode: 'managed',
    source: 'new',
  });
  initializeProject(root, {
    id: 'second',
    name: 'Second',
    type: 'api',
    mode: 'managed',
    source: 'new',
  });
  const selected = useProject(root, 'first');
  assert.equal(selected.project.id, 'first');
  const status = updateStatus(first.projectPath, 'R', 'in_progress');
  assert.equal(status.phase, 'R');
  assert.equal(readJson(path.join(first.projectPath, '.sdd', 'status.json')).state, 'in_progress');
});

test('gate updates accept only declared gates and results and write audit evidence', t => {
  const root = fixtureRoot(t);
  const created = initializeProject(root, {
    id: 'gated',
    name: 'Gated',
    type: 'web',
    mode: 'managed',
    source: 'new',
  });
  const status = updateGate(created.projectPath, 'requirements', 'passed');
  assert.equal(status.gates.requirements, 'passed');
  assert.throws(() => updateGate(created.projectPath, 'unknown', 'passed'), /Unknown gate/);
  assert.throws(() => updateGate(created.projectPath, 'requirements', 'maybe'), /Unsupported gate result/);
  const audit = fs.readFileSync(path.join(created.projectPath, '.sdd', 'audit.jsonl'), 'utf8');
  assert.match(audit, /"event":"gate_updated"/);
});
