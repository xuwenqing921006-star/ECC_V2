'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { spawnSync } = require('node:child_process');
const { runWorkflowGuard } = require('../scripts/lib/workflow-guard');

const ROOT = path.resolve(__dirname, '..');
function put(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ecc-independent-guard-'));
  const links = [];
  t.after(() => {
    for (const link of links) if (fs.existsSync(link)) fs.unlinkSync(link);
    assert.equal(path.dirname(root), os.tmpdir());
    assert.ok(path.basename(root).startsWith('ecc-independent-guard-'));
    fs.rmSync(root, { recursive: true, force: true });
  });
  // Copy only exact required files; never recurse through the host framework.
  const doctorSource = fs.readFileSync(path.join(ROOT, 'scripts/lib/doctor.js'), 'utf8');
  const requiredBlock = doctorSource.match(/const REQUIRED_FRAMEWORK_PATHS = \[([\s\S]*?)\];/)[1];
  const required = [...requiredBlock.matchAll(/'([^']+)'/g)].map(match => match[1]);
  for (const relative of [...required, 'scripts/ecc-v2.js', 'scripts/lib/doctor.js', 'scripts/lib/fs-safe.js', 'scripts/lib/registry.js', 'scripts/lib/project.js']) {
    put(path.join(root, relative), fs.readFileSync(path.join(ROOT, relative)));
  }
  const projectPath = path.join(root, 'project');
  const task = {
    id: 'T-001', title: 'Independent fixture', type: 'feature', description: 'Bounded change',
    acceptanceCriteria: ['Expected behavior'], technicalChecks: ['Focused verification'], dependencies: [],
    affectedAreas: ['module'], compatibilityConstraints: ['Keep existing behavior'], migrationRollback: 'Revert change; no migration',
    status: 'in_progress', user_gate: false, evidence: null, verification_mode: 'focused',
    workflow_contract_version: '1.0', workflow: 'existing-change', change_size: 'small',
    development_readiness: {
      status: 'passed', checked_at: '2026-09-09T01:00:00.000Z', baseline: 'fixture baseline',
      authorization: 'User requested start', evidence: '.sdd/evidence/T-001-development-readiness.md',
    },
  };
  const status = {
    schema_version: 2, phase: 'development', state: 'in_progress', current_task: 'T-001', blocked: false, blockers: [],
    gates: { requirements: 'passed', research: 'not_applicable', design: 'waived', architecture: 'waived', development: 'passed', release: 'pending' },
  };
  put(path.join(root, 'project-registry.json'), JSON.stringify({ schema_version: 2, projects: [{ id: 'guarded', path: projectPath }], active_project_id: 'guarded' }));
  put(path.join(projectPath, '.sdd/project.json'), JSON.stringify({ schema_version: 2, id: 'guarded', name: 'Guarded', project_type: 'web', source: 'new', harness_version: '0.1.0' }));
  put(path.join(projectPath, task.development_readiness.evidence), '# T-001 readiness\nRecorded approved task baseline and checks.\n');
  put(path.join(projectPath, 'docs/PRD.md'), '# Requirements');
  put(path.join(projectPath, 'docs/Plan.md'), '# Plan');
  const save = () => {
    put(path.join(projectPath, '.sdd/tasks.json'), JSON.stringify({ schema_version: 2, project_id: 'guarded', tasks: [task] }));
    put(path.join(projectPath, '.sdd/status.json'), JSON.stringify(status));
  };
  const complete = (verdict = 'PASS') => {
    task.status = { PASS: 'passed', FAIL: 'failed', BLOCKED: 'blocked' }[verdict];
    status.phase = 'verification'; status.state = task.status; status.blocked = verdict === 'BLOCKED';
    task.evidence = '.sdd/test-reports/test-T-001.md';
    put(path.join(projectPath, task.evidence), `ECC_TEST_TASK: T-001\nECC_TEST_VERDICT: ${verdict}\nECC_TEST_INDEPENDENT: true\n`);
    save();
  };
  const guard = (stage = 'development') => { save(); return runWorkflowGuard(root, { stage, projectPath, taskId: 'T-001' }); };
  save();
  return { root, projectPath, task, status, save, guard, complete, links };
}

test('independent positive controls accept valid development and completion', t => {
  const f = fixture(t);
  assert.deepEqual(f.guard().problems, []);
  f.complete();
  assert.deepEqual(f.guard('completion').problems, []);
});

for (const verdict of ['FAIL', 'BLOCKED']) test(`completion must not approve ${verdict} as completed`, t => {
  const f = fixture(t); f.complete(verdict);
  assert.equal(f.guard('completion').passed, false);
});

test('completion rejects omitted development readiness', t => {
  const f = fixture(t); f.complete(); delete f.task.development_readiness;
  assert.equal(f.guard('completion').passed, false);
});

test('non-boolean user_gate cannot bypass business acceptance', t => {
  const f = fixture(t); f.complete(); f.task.user_gate = 'true';
  assert.equal(f.guard('completion').passed, false);
});

test('development rejects evidence through an outside junction', t => {
  const f = fixture(t);
  const outside = path.join(f.root, 'outside');
  put(path.join(outside, 'readiness.md'), '# T-001 readiness');
  const link = path.join(f.projectPath, '.sdd/external-evidence');
  fs.symlinkSync(outside, link, 'junction'); f.links.push(link);
  f.task.development_readiness.evidence = '.sdd/external-evidence/readiness.md';
  assert.equal(f.guard().passed, false);
});

test('completion rejects acceptance through an outside junction', t => {
  const f = fixture(t); f.complete(); f.task.user_gate = true;
  const outside = path.join(f.root, 'outside');
  put(path.join(outside, 'acceptance.md'), '# Accepted T-001');
  const link = path.join(f.projectPath, '.sdd/external-acceptance');
  fs.symlinkSync(outside, link, 'junction'); f.links.push(link);
  f.task.business_acceptance = { status: 'accepted', evidence: '.sdd/external-acceptance/acceptance.md' };
  assert.equal(f.guard('completion').passed, false);
});

test('guard rejects copied project identity outside registered project', t => {
  const f = fixture(t);
  const fake = path.join(f.root, 'unrelated-copy');
  fs.cpSync(f.projectPath, fake, { recursive: true });
  assert.equal(runWorkflowGuard(f.root, { stage: 'development', projectPath: fake, taskId: 'T-001' }).passed, false);
});

test('CLI rejects misspelled scope flag instead of silently using active project', t => {
  const f = fixture(t);
  const result = spawnSync(process.execPath, [path.join(f.root, 'scripts/ecc-v2.js'), 'guard', 'development', '--projectpath', path.join(f.root, 'missing'), '--task', 'T-001'], { cwd: f.root, encoding: 'utf8' });
  assert.notEqual(result.status, 0, result.stdout + result.stderr);
});

test('guard rejects blank and non-string contract array entries', t => {
  const f = fixture(t); f.task.affectedAreas = ['']; f.task.compatibilityConstraints = [false];
  assert.equal(f.guard().passed, false);
});

test('completion rejects unresolved requirements gate', t => {
  const f = fixture(t); f.complete(); f.status.gates.requirements = 'pending';
  assert.equal(f.guard('completion').passed, false);
});

test('completion rejects stale nonempty blockers even when blocked flag is false', t => {
  const f = fixture(t); f.complete(); f.status.blockers = ['Acceptance environment unavailable'];
  assert.equal(f.guard('completion').passed, false);
});

test('CLI rejects duplicate scope flags', t => {
  const f = fixture(t);
  const result = spawnSync(process.execPath, [path.join(f.root, 'scripts/ecc-v2.js'), 'guard', 'development', '--project-path', path.join(f.root, 'missing'), '--project-path', f.projectPath, '--task', 'T-001'], { cwd: f.root, encoding: 'utf8' });
  assert.notEqual(result.status, 0, result.stdout + result.stderr);
});

test('CLI rejects missing task flag value and invalid stage', t => {
  const f = fixture(t);
  for (const args of [['guard', 'development', '--project-path', f.projectPath, '--task'], ['guard', 'unknown', '--project-path', f.projectPath, '--task', 'T-001']]) {
    const result = spawnSync(process.execPath, [path.join(f.root, 'scripts/ecc-v2.js'), ...args], { cwd: f.root, encoding: 'utf8' });
    assert.notEqual(result.status, 0, result.stdout + result.stderr);
  }
});

test('a real Git worktree of the registered project is accepted', t => {
  const f = fixture(t);
  const git = args => {
    const result = spawnSync('git', ['-C', f.projectPath, ...args], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stdout + result.stderr);
  };
  git(['init']); git(['add', '.']);
  git(['-c', 'user.name=ECC Independent Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'Test fixture']);
  const worktree = path.join(f.root, 'real-worktree');
  git(['worktree', 'add', '--detach', worktree, 'HEAD']);
  const result = runWorkflowGuard(f.root, { stage: 'development', projectPath: worktree, taskId: 'T-001' });
  assert.equal(result.passed, true, JSON.stringify(result.problems));
});

function documentationFixture(t) {
  const f = fixture(t); f.complete();
  f.task.type = 'documentation'; f.task.workflow = 'product-design-only';
  delete f.task.development_readiness;
  f.status.gates.development = 'not_applicable';
  f.task.documentation_plan = 'docs/T-001-maintenance-plan.md';
  put(path.join(f.projectPath, f.task.documentation_plan), '# T-001 documentation maintenance\nOnly task evidence indexes and docs; no source/configuration/migration changes.');
  return f;
}

test('documentation-only completion accepts a task-bound maintenance plan', t => {
  const f = documentationFixture(t);
  const result = f.guard('completion');
  assert.equal(result.passed, true, JSON.stringify(result.problems));
});

test('documentation-only completion rejects missing and empty plan', t => {
  const f = documentationFixture(t);
  const plan = f.task.documentation_plan;
  delete f.task.documentation_plan;
  assert.equal(f.guard('completion').passed, false);
  f.task.documentation_plan = plan;
  put(path.join(f.projectPath, plan), ' \n');
  assert.equal(f.guard('completion').passed, false);
});

test('documentation-only completion rejects plan naming another task', t => {
  const f = documentationFixture(t);
  put(path.join(f.projectPath, f.task.documentation_plan), '# T-002 unrelated maintenance');
  assert.equal(f.guard('completion').passed, false);
});

test('feature type cannot use the documentation completion exception', t => {
  const f = documentationFixture(t); f.task.type = 'feature';
  const result = f.guard('completion');
  assert.equal(result.passed, false);
  assert.ok(result.problems.some(problem => problem.code === 'DEVELOPMENT_READINESS'));
});

test('documentation-only completion requires explicit nonapplicable development gate', t => {
  const f = documentationFixture(t); f.status.gates.development = 'passed';
  assert.equal(f.guard('completion').passed, false);
});

test('Doctor CLI rejects unknown conflicting missing-value and duplicate scope arguments', t => {
  const f = fixture(t);
  const cases = [
    ['--projectpath', f.projectPath],
    ['--project-path'],
    ['--framework-only', '--project-path', f.projectPath],
    ['--framework-only', 'false'],
    ['--project-path', f.projectPath, '--project-path', f.projectPath],
    ['unexpected'],
  ];
  for (const args of cases) {
    const result = spawnSync(process.execPath, [path.join(f.root, 'scripts/ecc-v2.js'), 'doctor', ...args], { cwd: f.root, encoding: 'utf8' });
    assert.notEqual(result.status, 0, JSON.stringify(args) + result.stdout + result.stderr);
  }
  const valid = spawnSync(process.execPath, [path.join(f.root, 'scripts/ecc-v2.js'), 'doctor', '--project-path', f.projectPath], { cwd: f.root, encoding: 'utf8' });
  assert.equal(valid.status, 0, valid.stdout + valid.stderr);
});
