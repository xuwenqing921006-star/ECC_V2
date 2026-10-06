'use strict';

const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');
const { execFileSync } = require('node:child_process');
const { atomicWriteJson, readJson } = require('../scripts/lib/fs-safe');
const { initializeProject } = require('../scripts/lib/project');
const { runWorkflowGuard } = require('../scripts/lib/workflow-guard');

const ROOT = path.resolve(__dirname, '..');
function copyFrameworkSandbox(destination) {
  const source = fs.readFileSync(path.join(ROOT, 'scripts/lib/doctor.js'), 'utf8');
  const required = source.match(/const REQUIRED_FRAMEWORK_PATHS = \[([\s\S]*?)\];/)[1];
  for (const match of required.matchAll(/'([^']+)'/g)) {
    const target = path.join(destination, match[1]);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(ROOT, match[1]), target);
  }
  fs.cpSync(path.join(ROOT, 'templates/project'), path.join(destination, 'templates/project'), { recursive: true });
  atomicWriteJson(path.join(destination, 'project-registry.json'), {
    schema_version: 2,
    projects_root: 'Projects_Repo',
    active_project_id: null,
    projects: [],
  });
}

function createGuardFixture(t) {
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'ecc-v2-workflow-guard-'));
  t.after(() => fs.rmSync(sandbox, { recursive: true, force: true }));
  copyFrameworkSandbox(sandbox);
  const created = initializeProject(sandbox, {
    id: 'guarded',
    name: 'Guarded',
    type: 'web',
    mode: 'managed',
    source: 'new',
  });
  const readinessRelative = '.sdd/evidence/T-001-development-readiness.md';
  fs.writeFileSync(
    path.join(created.projectPath, readinessRelative),
    '# T-001 development readiness\n\nBaseline and approval recorded.\n'
  );
  const tasksPath = path.join(created.projectPath, '.sdd', 'tasks.json');
  const tasks = readJson(tasksPath);
  tasks.tasks.push({
    id: 'T-001',
    title: 'Guarded change',
    type: 'feature',
    description: 'A bounded change',
    acceptanceCriteria: ['user-visible behavior is verified'],
    technicalChecks: ['focused tests'],
    dependencies: [],
    affectedAreas: ['application'],
    compatibilityConstraints: ['preserve current behavior'],
    migrationRollback: 'No migration; revert the scoped change.',
    status: 'in_progress',
    user_gate: true,
    evidence: null,
    verification_mode: 'focused',
    workflow_contract_version: '1.0',
    workflow: 'existing-change',
    change_size: 'small',
    development_readiness: {
      status: 'passed',
      checked_at: '2026-09-09T01:00:00.000Z',
      baseline: 'HEAD fixture',
      authorization: 'Product Owner said start',
      evidence: readinessRelative,
    },
  });
  atomicWriteJson(tasksPath, tasks);
  const statusPath = path.join(created.projectPath, '.sdd', 'status.json');
  const status = readJson(statusPath);
  status.phase = 'development';
  status.state = 'in_progress';
  status.current_task = 'T-001';
  status.blocked = false;
  status.blockers = [];
  status.gates = {
    requirements: 'passed',
    research: 'not_applicable',
    design: 'waived',
    architecture: 'passed',
    development: 'passed',
    release: 'pending',
  };
  status.updated_at = '2026-09-09T01:00:00.000Z';
  atomicWriteJson(statusPath, status);
  return { sandbox, projectPath: created.projectPath, tasksPath, statusPath };
}

test('development guard accepts a task-bound ready contract', t => {
  const fixture = createGuardFixture(t);
  const result = runWorkflowGuard(fixture.sandbox, {
    stage: 'development',
    projectPath: fixture.projectPath,
    taskId: 'T-001',
  });
  assert.deepEqual(result.problems, []);
  assert.equal(result.passed, true);
});

test('development guard rejects inherited gates and post-hoc coding state', t => {
  const fixture = createGuardFixture(t);
  const tasks = readJson(fixture.tasksPath);
  delete tasks.tasks[0].development_readiness;
  atomicWriteJson(fixture.tasksPath, tasks);
  const status = readJson(fixture.statusPath);
  status.gates.release = 'passed';
  atomicWriteJson(fixture.statusPath, status);

  const result = runWorkflowGuard(fixture.sandbox, {
    stage: 'development',
    projectPath: fixture.projectPath,
    taskId: 'T-001',
  });
  assert.equal(result.passed, false);
  assert.ok(result.problems.some(problem => problem.code === 'DEVELOPMENT_READINESS'));
  assert.ok(result.problems.some(problem => problem.message.includes('release gate must be reset')));
});

test('completion guard requires independent Tester markers and business acceptance', t => {
  const fixture = createGuardFixture(t);
  const reportRelative = '.sdd/test-reports/test-T-001.md';
  const acceptanceRelative = '.sdd/evidence/T-001-business-acceptance.md';
  fs.writeFileSync(path.join(fixture.projectPath, reportRelative), [
    '# Tester report',
    'ECC_TEST_TASK: T-001',
    'ECC_TEST_VERDICT: PASS',
    'ECC_TEST_INDEPENDENT: true',
    '',
  ].join('\n'));
  fs.writeFileSync(path.join(fixture.projectPath, acceptanceRelative), '# Accepted by Product Owner\n');
  const tasks = readJson(fixture.tasksPath);
  tasks.tasks[0].status = 'passed';
  tasks.tasks[0].evidence = reportRelative;
  tasks.tasks[0].business_acceptance = {
    status: 'accepted',
    evidence: acceptanceRelative,
  };
  atomicWriteJson(fixture.tasksPath, tasks);
  const status = readJson(fixture.statusPath);
  status.phase = 'verification';
  status.state = 'passed';
  atomicWriteJson(fixture.statusPath, status);

  let result = runWorkflowGuard(fixture.sandbox, {
    stage: 'completion',
    projectPath: fixture.projectPath,
    taskId: 'T-001',
  });
  assert.deepEqual(result.problems, []);

  fs.writeFileSync(path.join(fixture.projectPath, reportRelative), [
    'ECC_TEST_TASK: T-001',
    'ECC_TEST_VERDICT: PASS',
    'ECC_TEST_INDEPENDENT: false',
    '',
  ].join('\n'));
  result = runWorkflowGuard(fixture.sandbox, {
    stage: 'completion',
    projectPath: fixture.projectPath,
    taskId: 'T-001',
  });
  assert.ok(result.problems.some(problem => problem.message.includes('ECC_TEST_INDEPENDENT: true')));
});

test('scoped guard validates a real Git worktree, not a copied project identity', t => {
  const fixture = createGuardFixture(t);
  const sibling = path.join(fixture.sandbox, 'worktree-copy');
  const git = args => execFileSync('git', ['-C', fixture.projectPath, ...args], {
    encoding: 'utf8', windowsHide: true, timeout: 10000,
  });
  git(['init']);
  git(['add', '.']);
  git(['-c', 'user.name=Guard fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'Fixture']);
  git(['worktree', 'add', '--detach', sibling, 'HEAD']);
  const result = runWorkflowGuard(fixture.sandbox, {
    stage: 'development',
    projectPath: sibling,
    taskId: 'T-001',
  });
  assert.deepEqual(result.problems, []);
  assert.equal(result.registeredPath, fixture.projectPath);
});
