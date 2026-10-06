'use strict';

const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');
const { atomicWriteJson, readJson } = require('../scripts/lib/fs-safe');
const { runDoctor } = require('../scripts/lib/doctor');
const { initializeProject } = require('../scripts/lib/project');

const ROOT = path.resolve(__dirname, '..');
const SANDBOX_EXCLUDES = new Set([
  '.build', '.codex-tmp', '.git', '.local-run', '.local-tools', '.tmp',
  '.tmp-docx', '.worktrees', '.wt', 'Projects_Repo', 'Release_Artifacts',
  'Release_Worktrees', 'node_modules', 'outputs', 'tmp',
]);

function copyFrameworkSandbox(destination) {
  fs.cpSync(ROOT, destination, {
    recursive: true,
    filter: source => {
      const relative = path.relative(ROOT, source);
      if (!relative) return true;
      return !SANDBOX_EXCLUDES.has(relative.split(path.sep)[0]);
    },
  });
  atomicWriteJson(path.join(destination, 'project-registry.json'), {
    schema_version: 2,
    projects_root: 'Projects_Repo',
    active_project_id: null,
    projects: [],
  });
}

function fullTestBrief(taskId) {
  return [
    '# 独立 Tester 全流程测试任务书',
    '',
    '- 任务编号：`' + taskId + '`',
    '- 测试模式：`full_independent`',
    '',
    '## 2. 项目、仓库和保护范围',
    '',
    '已按任务实际信息渲染。',
    '',
    '## 15. 最终报告合同',
    '',
    'Tester 写入独立测试报告。',
    '',
  ].join('\n');
}

const FULL_TEST_DOMAINS = [
  'requirements', 'environment_identity', 'build_static', 'unit_component',
  'api_integration', 'database_consistency', 'ui', 'permissions_security',
  'state_workflow', 'time_scheduled', 'concurrency_idempotency',
  'resilience_recovery', 'multi_client_cache', 'history_audit_logs',
  'external_real_chain', 'regression',
];

function fullTestBriefV2(taskId) {
  return fs.readFileSync(
    path.join(ROOT, 'harness-core', 'templates', 'independent-full-test-brief.md'),
    'utf8'
  ).replaceAll('{{TASK_ID}}', taskId).replace(/\{\{[A-Z0-9_]+\}\}/g, '已核验');
}

function fullTestReportV2(taskId, options = {}) {
  const statuses = options.statuses || {};
  const lines = FULL_TEST_DOMAINS.map(domain => {
    const status = statuses[domain] || 'PASS';
    const detail = status === 'N/A' ? '该项目无此入口或链路' : 'fixture evidence';
    return 'ECC_TEST_DOMAIN: ' + domain + ' ' + status + ' | ' + detail;
  });
  return [
    '# Full independent v2 report',
    '',
    ...lines,
    '',
    'ECC_TEST_TASK: ' + taskId,
    'ECC_TEST_VERDICT: ' + (options.verdict || 'PASS'),
    '',
  ].join('\n');
}

test('Doctor rejects passed task without evidence and accepts real evidence', t => {
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'ecc-v2-doctor-'));
  t.after(() => fs.rmSync(sandbox, { recursive: true, force: true }));
  copyFrameworkSandbox(sandbox);
  const project = initializeProject(sandbox, {
    id: 'evidence',
    name: 'Evidence',
    type: 'web',
    mode: 'managed',
    source: 'new',
  });
  const tasksPath = path.join(project.projectPath, '.sdd', 'tasks.json');
  const tasks = readJson(tasksPath);
  tasks.tasks.push({
    id: 'T-001',
    title: 'Verified task',
    type: 'frontend',
    description: 'test',
    acceptanceCriteria: ['visible behavior works'],
    technicalChecks: ['tests pass'],
    dependencies: [],
    status: 'passed',
    user_gate: false,
    evidence: null,
  });
  atomicWriteJson(tasksPath, tasks);
  let result = runDoctor(sandbox, {});
  assert.ok(result.problems.some(problem => problem.includes('Terminal task has no evidence')));

  const reportRelative = '.sdd/test-reports/test-T-001.md';
  fs.writeFileSync(path.join(project.projectPath, reportRelative), '# PASS\n');
  tasks.tasks[0].evidence = reportRelative;
  atomicWriteJson(tasksPath, tasks);
  result = runDoctor(sandbox, {});
  assert.deepEqual(result.problems, []);
});

test('Doctor requires a real brief for full independent verification', t => {
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'ecc-v2-full-test-'));
  t.after(() => fs.rmSync(sandbox, { recursive: true, force: true }));
  copyFrameworkSandbox(sandbox);
  const project = initializeProject(sandbox, {
    id: 'full-test',
    name: 'Full Test',
    type: 'web',
    mode: 'managed',
    source: 'new',
  });
  const tasksPath = path.join(project.projectPath, '.sdd', 'tasks.json');
  const tasks = readJson(tasksPath);
  tasks.tasks.push({
    id: 'T-001',
    title: 'Independent verification',
    type: 'test',
    description: 'test',
    acceptanceCriteria: ['behavior is independently verified'],
    technicalChecks: ['full matrix'],
    dependencies: [],
    status: 'pending',
    user_gate: true,
    evidence: null,
    verification_mode: 'full_independent',
    test_brief: '.sdd/test-briefs/full-test-T-001.md',
  });
  atomicWriteJson(tasksPath, tasks);

  let result = runDoctor(sandbox, {});
  assert.ok(result.problems.some(problem => problem.includes('Full independent task brief missing')));

  const briefPath = path.join(project.projectPath, '.sdd', 'test-briefs', 'full-test-T-001.md');
  fs.writeFileSync(briefPath, '');
  result = runDoctor(sandbox, {});
  assert.ok(result.problems.some(problem => problem.includes('task brief is empty')));

  fs.writeFileSync(briefPath, '# 独立 Tester 全流程测试任务书\n{{PROJECT_NAME}}\n');
  result = runDoctor(sandbox, {});
  assert.ok(result.problems.some(problem => problem.includes('unresolved placeholders')));
  assert.ok(result.problems.some(problem => problem.includes('missing required content')));

  fs.writeFileSync(briefPath, fullTestBrief('T-001'));
  result = runDoctor(sandbox, {});
  assert.deepEqual(result.problems, []);
});

test('Doctor rejects task-id traversal and unsafe full-test paths', t => {
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'ecc-v2-traversal-'));
  t.after(() => fs.rmSync(sandbox, { recursive: true, force: true }));
  copyFrameworkSandbox(sandbox);
  const project = initializeProject(sandbox, {
    id: 'traversal',
    name: 'Traversal',
    type: 'web',
    mode: 'managed',
    source: 'new',
  });
  const tasksPath = path.join(project.projectPath, '.sdd', 'tasks.json');
  const tasks = readJson(tasksPath);
  tasks.tasks.push({
    id: 'T-001/x/../../../../../../escaped-full-test-brief',
    title: 'Traversal attempt',
    type: 'test',
    description: 'test',
    acceptanceCriteria: ['must stay inside project'],
    technicalChecks: [],
    dependencies: [],
    status: 'pending',
    user_gate: false,
    evidence: null,
    verification_mode: 'full_independent',
    test_brief: '.sdd/test-briefs/full-test-T-001/x/../../../../../../escaped-full-test-brief.md',
  });
  atomicWriteJson(tasksPath, tasks);

  const result = runDoctor(sandbox, {});
  assert.ok(result.problems.some(problem => problem.includes('Invalid task id')));
  assert.ok(result.problems.some(problem => problem.includes('invalid test brief path')));
});

test('Doctor binds full-independent terminal state to its exact report verdict', t => {
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'ecc-v2-verdict-'));
  t.after(() => fs.rmSync(sandbox, { recursive: true, force: true }));
  copyFrameworkSandbox(sandbox);
  const project = initializeProject(sandbox, {
    id: 'verdict',
    name: 'Verdict',
    type: 'web',
    mode: 'managed',
    source: 'new',
  });
  const tasksPath = path.join(project.projectPath, '.sdd', 'tasks.json');
  const tasks = readJson(tasksPath);
  tasks.tasks.push({
    id: 'T-001',
    title: 'Verdict evidence',
    type: 'test',
    description: 'test',
    acceptanceCriteria: ['verdict is traceable'],
    technicalChecks: [],
    dependencies: [],
    status: 'passed',
    user_gate: false,
    evidence: 'README.md',
    verification_mode: 'full_independent',
    test_brief: '.sdd/test-briefs/full-test-T-001.md',
  });
  fs.writeFileSync(
    path.join(project.projectPath, '.sdd', 'test-briefs', 'full-test-T-001.md'),
    fullTestBrief('T-001')
  );
  atomicWriteJson(tasksPath, tasks);

  let result = runDoctor(sandbox, {});
  assert.ok(result.problems.some(problem => problem.includes('outside approved evidence roots')));

  const reportRelative = '.sdd/test-reports/test-T-001.md';
  const reportPath = path.join(project.projectPath, reportRelative);
  tasks.tasks[0].evidence = reportRelative;
  fs.writeFileSync(reportPath, 'ECC_TEST_TASK: T-001\nECC_TEST_VERDICT: FAIL\n');
  atomicWriteJson(tasksPath, tasks);
  result = runDoctor(sandbox, {});
  assert.ok(result.problems.some(problem => problem.includes('verdict mismatches task status')));

  fs.writeFileSync(
    reportPath,
    'ECC_TEST_TASK: T-001\nECC_TEST_VERDICT: PASS\nECC_TEST_VERDICT: FAIL\n'
  );
  result = runDoctor(sandbox, {});
  assert.ok(result.problems.some(problem => problem.includes('verdict mismatches task status')));

  fs.writeFileSync(reportPath, 'ECC_TEST_TASK: T-001\nECC_TEST_VERDICT: PASS\n');
  result = runDoctor(sandbox, {});
  assert.deepEqual(result.problems, []);

  tasks.tasks.push({
    id: 'T-002',
    title: 'Approved-root traversal',
    type: 'test',
    description: 'test',
    acceptanceCriteria: ['evidence stays under its approved root'],
    technicalChecks: [],
    dependencies: [],
    status: 'passed',
    user_gate: false,
    evidence: '.sdd/evidence/../tasks.json',
  });
  atomicWriteJson(tasksPath, tasks);
  result = runDoctor(sandbox, {});
  assert.ok(result.problems.some(problem => problem.includes('escapes approved evidence root')));
  tasks.tasks.pop();

  tasks.tasks[0].status = 'failed';
  tasks.tasks[0].evidence = null;
  atomicWriteJson(tasksPath, tasks);
  result = runDoctor(sandbox, {});
  assert.ok(result.problems.some(problem => problem.includes('Terminal task has no evidence')));
});

test('framework-only Doctor ignores unavailable business project paths', t => {
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'ecc-v2-framework-only-'));
  t.after(() => fs.rmSync(sandbox, { recursive: true, force: true }));
  copyFrameworkSandbox(sandbox);
  atomicWriteJson(path.join(sandbox, 'project-registry.json'), {
    schema_version: 2,
    projects_root: 'Projects_Repo',
    active_project_id: 'missing-business',
    projects: [{
      id: 'missing-business',
      name: 'Missing Business',
      path: 'Projects_Repo/missing-business',
      mode: 'managed',
    }],
  });

  const frameworkResult = runDoctor(sandbox, { frameworkOnly: true });
  assert.deepEqual(frameworkResult.problems, []);
  const fullResult = runDoctor(sandbox, {});
  assert.ok(fullResult.problems.some(problem => problem.includes('Registered project path missing')));
});

test('Doctor rejects junctions that resolve evidence or briefs outside the project', t => {
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'ecc-v2-junction-'));
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'ecc-v2-outside-'));
  t.after(() => fs.rmSync(sandbox, { recursive: true, force: true }));
  t.after(() => fs.rmSync(outside, { recursive: true, force: true }));
  copyFrameworkSandbox(sandbox);
  const project = initializeProject(sandbox, {
    id: 'junction',
    name: 'Junction',
    type: 'web',
    mode: 'managed',
    source: 'new',
  });

  fs.writeFileSync(path.join(outside, 'report.md'), '# external evidence\n');
  fs.writeFileSync(path.join(outside, 'full-test-T-002.md'), fullTestBrief('T-002'));
  const linkType = process.platform === 'win32' ? 'junction' : 'dir';
  fs.symlinkSync(outside, path.join(project.projectPath, '.sdd', 'evidence', 'external'), linkType);
  const briefRoot = path.join(project.projectPath, '.sdd', 'test-briefs');
  fs.rmSync(briefRoot, { recursive: true, force: true });
  fs.symlinkSync(outside, briefRoot, linkType);

  const tasksPath = path.join(project.projectPath, '.sdd', 'tasks.json');
  const tasks = readJson(tasksPath);
  tasks.tasks.push({
    id: 'T-001',
    title: 'External evidence junction',
    type: 'test',
    description: 'test',
    acceptanceCriteria: ['evidence is physically inside project'],
    technicalChecks: [],
    dependencies: [],
    status: 'passed',
    user_gate: false,
    evidence: '.sdd/evidence/external/report.md',
  });
  tasks.tasks.push({
    id: 'T-002',
    title: 'External brief junction',
    type: 'test',
    description: 'test',
    acceptanceCriteria: ['brief is physically inside project'],
    technicalChecks: [],
    dependencies: [],
    status: 'pending',
    user_gate: false,
    evidence: null,
    verification_mode: 'full_independent',
    test_brief: '.sdd/test-briefs/full-test-T-002.md',
  });
  atomicWriteJson(tasksPath, tasks);

  const result = runDoctor(sandbox, {});
  assert.ok(result.problems.some(problem => problem.includes('evidence resolves outside approved evidence root')));
  assert.ok(result.problems.some(problem => problem.includes('task brief resolves outside approved brief root')));
});

test('v2 Doctor accepts three technology-neutral project shapes with justified N/A', t => {
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'ecc-v2-v2-fixtures-'));
  t.after(() => fs.rmSync(sandbox, { recursive: true, force: true }));
  copyFrameworkSandbox(sandbox);
  const fixtures = [
    { id: 'ui-api-data', type: 'full-stack', na: [] },
    { id: 'frontend-backend', type: 'frontend-backend', na: ['external_real_chain'] },
    {
      id: 'task-data-no-ui',
      type: 'scheduled-data-task',
      na: ['ui', 'multi_client_cache', 'external_real_chain'],
    },
  ];
  for (let index = 0; index < fixtures.length; index += 1) {
    const fixture = fixtures[index];
    const created = initializeProject(sandbox, {
      id: fixture.id,
      name: fixture.id,
      type: fixture.type,
      mode: 'managed',
      source: 'new',
    });
    const taskId = 'T-' + String(index + 1).padStart(3, '0');
    const tasksPath = path.join(created.projectPath, '.sdd', 'tasks.json');
    const tasks = readJson(tasksPath);
    tasks.tasks.push({
      id: taskId,
      title: 'Generic independent verification',
      type: 'test',
      description: 'technology-neutral fixture',
      acceptanceCriteria: ['all applicable domains have evidence'],
      technicalChecks: ['Doctor'],
      dependencies: [],
      status: 'passed',
      user_gate: true,
      evidence: '.sdd/test-reports/test-' + taskId + '.md',
      verification_mode: 'full_independent',
      verification_protocol_version: '2.0',
      verification_scope: {
        summary: 'fixture ' + fixture.type,
        domains: FULL_TEST_DOMAINS.filter(domain => !fixture.na.includes(domain)),
      },
      test_data_disposition: fixture.id === 'task-data-no-ui'
        ? 'not_applicable' : 'retain_for_product_owner_retest',
      test_brief: '.sdd/test-briefs/full-test-' + taskId + '.md',
    });
    atomicWriteJson(tasksPath, tasks);
    fs.writeFileSync(
      path.join(created.projectPath, '.sdd', 'test-briefs', 'full-test-' + taskId + '.md'),
      fullTestBriefV2(taskId)
    );
    const statuses = Object.fromEntries(fixture.na.map(domain => [domain, 'N/A']));
    fs.writeFileSync(
      path.join(created.projectPath, '.sdd', 'test-reports', 'test-' + taskId + '.md'),
      fullTestReportV2(taskId, { statuses })
    );
  }
  assert.deepEqual(runDoctor(sandbox, {}).problems, []);
});

test('v2 Doctor rejects missing domains and domain verdict conflicts', t => {
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'ecc-v2-v2-domain-contract-'));
  t.after(() => fs.rmSync(sandbox, { recursive: true, force: true }));
  copyFrameworkSandbox(sandbox);
  const created = initializeProject(sandbox, {
    id: 'domain-contract',
    name: 'Domain Contract',
    type: 'unknown',
    mode: 'managed',
    source: 'new',
  });
  const tasksPath = path.join(created.projectPath, '.sdd', 'tasks.json');
  const tasks = readJson(tasksPath);
  tasks.tasks.push({
    id: 'T-001', title: 'Domain contract', type: 'test', description: 'test',
    acceptanceCriteria: ['complete matrix'], technicalChecks: [], dependencies: [],
    status: 'passed', user_gate: false,
    evidence: '.sdd/test-reports/test-T-001.md',
    verification_mode: 'full_independent', verification_protocol_version: '2.0',
    test_brief: '.sdd/test-briefs/full-test-T-001.md',
  });
  atomicWriteJson(tasksPath, tasks);
  fs.writeFileSync(
    path.join(created.projectPath, '.sdd', 'test-briefs', 'full-test-T-001.md'),
    fullTestBriefV2('T-001')
  );
  const reportPath = path.join(created.projectPath, '.sdd', 'test-reports', 'test-T-001.md');
  fs.writeFileSync(reportPath, 'ECC_TEST_TASK: T-001\nECC_TEST_VERDICT: PASS\n');
  let result = runDoctor(sandbox, {});
  assert.ok(result.problems.some(problem => problem.includes('missing domain')));

  fs.writeFileSync(reportPath, fullTestReportV2('T-001', {
    statuses: { concurrency_idempotency: 'BLOCKED' },
    verdict: 'PASS',
  }));
  result = runDoctor(sandbox, {});
  assert.ok(result.problems.some(problem => problem.includes('domain results mismatch final verdict')));

  const bareDomainLines = FULL_TEST_DOMAINS.map(domain => (
    'ECC_TEST_DOMAIN: ' + domain + ' PASS'
  ));
  fs.writeFileSync(reportPath, [
    ...bareDomainLines,
    'ECC_TEST_TASK: T-001',
    'ECC_TEST_TASK: T-001',
    'ECC_TEST_VERDICT: PASS',
  ].join('\n'));
  result = runDoctor(sandbox, {});
  assert.ok(result.problems.some(problem => problem.includes('task marker missing or mismatched')));
  assert.ok(result.problems.some(problem => problem.includes('domain has no evidence or reason')));
});
