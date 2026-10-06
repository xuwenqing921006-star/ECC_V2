'use strict';

const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');
const { atomicWriteJson, readJson } = require('../scripts/lib/fs-safe');
const { initializeProject } = require('../scripts/lib/project');
const {
  isFullIndependentTestingRequest,
  resolveFullIndependentContext,
} = require('../scripts/lib/full-independent-testing');

const ROOT = path.resolve(__dirname, '..');

function fixtureRoot(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ecc-v2-full-independent-context-'));
  fs.mkdirSync(path.join(root, 'Projects_Repo'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'templates'), path.join(root, 'templates'), { recursive: true });
  atomicWriteJson(path.join(root, 'project-registry.json'), {
    schema_version: 2, projects_root: 'Projects_Repo', active_project_id: null, projects: [],
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

test('full-independent trigger is exact and ordinary tests do not activate it', () => {
  for (const prompt of [
    '请进行全流程独立测试',
    '请对当前任务开展一次全量独立验收',
    '交给独立 Tester 做完整验收',
    '$ecc-v2-full-independent-testing 请验收当前任务',
  ]) assert.equal(isFullIndependentTestingRequest(prompt), true, prompt);

  for (const prompt of [
    '测试一下', '跑测试', '做个冒烟测试', '局部回归即可',
    '不要进行全流程独立测试',
    '$ecc-v2-full-independent-testing 不要进行全流程独立测试',
    '文档示例写着“请进行全流程独立测试”，现在只检查文档',
    '我没有要求进行全流程独立测试',
    '请测试一下“请进行全流程独立测试”这句话能否触发',
    '请升级全流程独立测试能力和 Schema',
    '解释一下 full_independent 协议',
  ]) assert.equal(isFullIndependentTestingRequest(prompt), false, prompt);
});

test('context resolver prefers the containing project and resolves one current task', t => {
  const root = fixtureRoot(t);
  const first = initializeProject(root, {
    id: 'first-project', name: 'First', type: 'web', mode: 'managed', source: 'new',
  });
  initializeProject(root, {
    id: 'active-project', name: 'Active', type: 'api', mode: 'managed', source: 'new',
  });
  const tasksPath = path.join(first.projectPath, '.sdd', 'tasks.json');
  const tasks = readJson(tasksPath);
  tasks.tasks.push({
    id: 'T-001', title: 'Current', type: 'test', description: 'test',
    acceptanceCriteria: ['resolved'], technicalChecks: [], dependencies: [],
    status: 'in_progress', user_gate: false, evidence: null,
  });
  atomicWriteJson(tasksPath, tasks);
  const nested = path.join(first.projectPath, 'src', 'module');
  fs.mkdirSync(nested, { recursive: true });
  const resolved = resolveFullIndependentContext(root, { cwd: nested });
  assert.equal(resolved.project.id, 'first-project');
  assert.equal(resolved.task.id, 'T-001');
});

test('context resolver blocks ambiguous tasks instead of guessing', t => {
  const root = fixtureRoot(t);
  const created = initializeProject(root, {
    id: 'ambiguous', name: 'Ambiguous', type: 'data', mode: 'managed', source: 'new',
  });
  const tasksPath = path.join(created.projectPath, '.sdd', 'tasks.json');
  const tasks = readJson(tasksPath);
  for (const id of ['T-001', 'T-002']) tasks.tasks.push({
    id, title: id, type: 'test', description: 'test',
    acceptanceCriteria: ['resolved'], technicalChecks: [], dependencies: [],
    status: 'pending', user_gate: false, evidence: null,
  });
  atomicWriteJson(tasksPath, tasks);
  assert.throws(
    () => resolveFullIndependentContext(root, { cwd: created.projectPath }),
    /BLOCKED: current ECC V2 task is ambiguous/
  );
});

test('context resolver honors an explicit registered project path before active project', t => {
  const root = fixtureRoot(t);
  const first = initializeProject(root, {
    id: 'path-first', name: 'Path First', type: 'web', mode: 'managed', source: 'new',
  });
  initializeProject(root, {
    id: 'active-second', name: 'Active Second', type: 'api', mode: 'managed', source: 'new',
  });
  const tasksPath = path.join(first.projectPath, '.sdd', 'tasks.json');
  const tasks = readJson(tasksPath);
  tasks.tasks.push({
    id: 'T-001', title: 'Explicit path', type: 'test', description: 'test',
    acceptanceCriteria: ['resolved'], technicalChecks: [], dependencies: [],
    status: 'pending', user_gate: false, evidence: null,
  });
  atomicWriteJson(tasksPath, tasks);
  const resolved = resolveFullIndependentContext(root, {
    cwd: root,
    projectPath: first.projectPath,
  });
  assert.equal(resolved.project.id, 'path-first');
});
