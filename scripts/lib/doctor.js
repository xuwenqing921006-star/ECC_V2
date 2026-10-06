'use strict';

const fs = require('fs');
const path = require('path');
const { readJson } = require('./fs-safe');
const { loadRegistry, resolveProjectPath } = require('./registry');

const REQUIRED_FRAMEWORK_PATHS = [
  'VERSION',
  'AGENTS.md',
  'CLAUDE.md',
  'harness-core/router.md',
  'harness-core/workflows/new-product.md',
  'harness-core/workflows/existing-change.md',
  'harness-core/workflows/bugfix.md',
  'harness-core/workflows/refactor.md',
  'harness-core/gates/development.md',
  'harness-core/protocols/development-rules.md',
  'harness-core/protocols/experience.md',
  'harness-core/protocols/full-independent-testing.md',
  'harness-core/protocols/references/full-independent-test-domains-v2.md',
  'harness-core/templates/independent-full-test-brief.md',
  'harness-core/templates/workflow-task-contract.md',
  'scripts/lib/full-independent-testing.js',
  'scripts/lib/workflow-guard.js',
  'harness-core/schemas/project.schema.json',
  'templates/project/.sdd/project.json',
  'templates/project/.sdd/status.json',
  'templates/project/.sdd/tasks.json',
  'templates/project/.sdd/test-briefs/.gitkeep',
  'templates/project/docs/澄清文档/.gitkeep',
  'templates/project/docs/diagrams/User-Flow.md',
  'templates/project/docs/diagrams/State-Model.md',
  'templates/project/docs/diagrams/System-Context.md',
  '.claude/CLAUDE.md',
  '.codex/config.toml',
  '.cursor/rules/00-ecc-v2-router.mdc',
  'docs/zh-CN/getting-started.md',
  'docs/en-US/getting-started.md',
];

const PHASES = new Set([
  'initialized', 'R', 'A', 'B1', 'B2', 'C', 'development',
  'verification', 'release', 'operation', 'archived',
]);
const STATES = new Set([
  'draft', 'proposed', 'approved', 'in_progress', 'passed', 'failed', 'blocked',
]);
const GATE_RESULTS = new Set([
  'pending', 'passed', 'waived', 'not_applicable', 'failed', 'blocked',
]);
const REQUIRED_GATES = ['requirements', 'research', 'design', 'architecture', 'development', 'release'];
const VERIFICATION_MODES = new Set(['focused', 'full_independent']);
const VERIFICATION_PROTOCOL_VERSIONS = new Set(['2.0']);
const TEST_DATA_DISPOSITIONS = new Set([
  'retain_for_product_owner_retest', 'clean_created_data_only', 'not_applicable',
]);
const FULL_TEST_DOMAINS = [
  'requirements', 'environment_identity', 'build_static', 'unit_component',
  'api_integration', 'database_consistency', 'ui', 'permissions_security',
  'state_workflow', 'time_scheduled', 'concurrency_idempotency',
  'resilience_recovery', 'multi_client_cache', 'history_audit_logs',
  'external_real_chain', 'regression',
];
const FULL_TEST_DOMAIN_SET = new Set(FULL_TEST_DOMAINS);
const TASK_ID_PATTERN = /^T-[0-9]{3,}$/;
const TERMINAL_TASK_STATUSES = new Map([
  ['passed', 'PASS'],
  ['failed', 'FAIL'],
  ['blocked', 'BLOCKED'],
]);

function isInside(basePath, targetPath) {
  const relative = path.relative(path.resolve(basePath), path.resolve(targetPath));
  return relative !== '' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative);
}

function isRealPathInside(basePath, targetPath) {
  const realBase = fs.realpathSync.native(basePath);
  const realTarget = fs.realpathSync.native(targetPath);
  return isInside(realBase, realTarget);
}

function validateFullTestBrief(briefPath, taskId, protocolVersion, problems) {
  let content;
  try {
    content = fs.readFileSync(briefPath, 'utf8');
  } catch (error) {
    problems.push('Cannot read full independent task brief: ' + briefPath + ': ' + error.message);
    return;
  }
  if (!content.trim()) {
    problems.push('Full independent task brief is empty: ' + briefPath);
    return;
  }
  if (/\{\{[A-Z0-9_]+\}\}/.test(content)) {
    problems.push('Full independent task brief has unresolved placeholders: ' + briefPath);
  }
  for (const marker of [
    '# 独立 Tester 全流程测试任务书',
    '## 2. 项目、仓库和保护范围',
    '## 15. 最终报告合同',
    'full_independent',
    taskId,
  ]) {
    if (!content.includes(marker)) {
      problems.push('Full independent task brief missing required content ' + marker + ': ' + briefPath);
    }
  }
  if (protocolVersion === '2.0') {
    for (const marker of [
      '全局协议版本：`2.0`',
      'full-independent-test-domains-v2.md',
      'ECC_TEST_DOMAIN:',
      ...FULL_TEST_DOMAINS.map(domain => '`' + domain + '`'),
    ]) {
      if (!content.includes(marker)) {
        problems.push('Full independent v2 task brief missing required content ' + marker + ': ' + briefPath);
      }
    }
  }
}

function validateV2DomainReport(report, projectId, taskId, expectedVerdict, problems) {
  const matches = [...report.matchAll(
    /^ECC_TEST_DOMAIN:\s*([a-z_]+)\s+(PASS|FAIL|BLOCKED|N\/A)(?:\s*\|\s*(.*))?\s*$/gm
  )];
  const results = new Map();
  for (const match of matches) {
    const domain = match[1];
    const status = match[2];
    const detail = (match[3] || '').trim();
    if (!FULL_TEST_DOMAIN_SET.has(domain)) {
      problems.push('Full independent v2 report has unknown domain: ' + projectId + '/' + taskId + '/' + domain);
      continue;
    }
    if (results.has(domain)) {
      problems.push('Full independent v2 report has duplicate domain: ' + projectId + '/' + taskId + '/' + domain);
      continue;
    }
    if (!detail) {
      problems.push('Full independent v2 report domain has no evidence or reason: ' + projectId + '/' + taskId + '/' + domain);
    }
    results.set(domain, status);
  }
  for (const domain of FULL_TEST_DOMAINS) {
    if (!results.has(domain)) {
      problems.push('Full independent v2 report missing domain: ' + projectId + '/' + taskId + '/' + domain);
    }
  }
  const statuses = [...results.values()];
  const domainVerdict = statuses.includes('FAIL')
    ? 'FAIL'
    : statuses.includes('BLOCKED') ? 'BLOCKED' : 'PASS';
  if (results.size === FULL_TEST_DOMAINS.length && domainVerdict !== expectedVerdict) {
    problems.push('Full independent v2 domain results mismatch final verdict: ' + projectId + '/' + taskId);
  }
}

function validateTerminalEvidence(projectPath, projectId, task, problems) {
  const expectedVerdict = TERMINAL_TASK_STATUSES.get(task.status);
  if (!expectedVerdict) return;
  if (typeof task.evidence !== 'string' || !task.evidence.trim()) {
    problems.push('Terminal task has no evidence: ' + projectId + '/' + task.id);
    return;
  }
  const normalizedEvidence = task.evidence.replaceAll('\\', '/');
  if (!/^\.sdd\/(test-reports|evidence)\/.+/.test(normalizedEvidence)) {
    problems.push('Terminal task evidence is outside approved evidence roots: ' + projectId + '/' + task.id);
    return;
  }
  const evidencePath = path.resolve(projectPath, task.evidence);
  if (!isInside(projectPath, evidencePath)) {
    problems.push('Terminal task evidence escapes project: ' + projectId + '/' + task.id);
    return;
  }
  const approvedEvidenceRoot = normalizedEvidence.startsWith('.sdd/test-reports/')
    ? path.join(projectPath, '.sdd', 'test-reports')
    : path.join(projectPath, '.sdd', 'evidence');
  if (!isInside(approvedEvidenceRoot, evidencePath)) {
    problems.push('Terminal task evidence escapes approved evidence root: ' + projectId + '/' + task.id);
    return;
  }
  if (!fs.existsSync(evidencePath) || !fs.statSync(evidencePath).isFile()) {
    problems.push('Terminal task evidence missing: ' + evidencePath);
    return;
  }
  if (!isRealPathInside(projectPath, approvedEvidenceRoot)
      || !isRealPathInside(approvedEvidenceRoot, evidencePath)) {
    problems.push('Terminal task evidence resolves outside approved evidence root: ' + projectId + '/' + task.id);
    return;
  }
  if (task.verification_mode !== 'full_independent') return;

  const expectedEvidence = '.sdd/test-reports/test-' + task.id + '.md';
  if (normalizedEvidence !== expectedEvidence) {
    problems.push('Full independent task has invalid evidence path: ' + projectId + '/' + task.id);
    return;
  }
  const report = fs.readFileSync(evidencePath, 'utf8');
  const taskMarkers = [...report.matchAll(/^ECC_TEST_TASK:\s*(\S+)\s*$/gm)];
  const verdictMarkers = [...report.matchAll(/^ECC_TEST_VERDICT:\s*(PASS|FAIL|BLOCKED)\s*$/gm)];
  if (taskMarkers.length !== 1 || taskMarkers[0][1] !== task.id) {
    problems.push('Full independent report task marker missing or mismatched: ' + projectId + '/' + task.id);
  }
  if (verdictMarkers.length !== 1 || verdictMarkers[0][1] !== expectedVerdict) {
    problems.push('Full independent report verdict mismatches task status: ' + projectId + '/' + task.id);
  }
  if (task.verification_protocol_version === '2.0') {
    validateV2DomainReport(report, projectId, task.id, expectedVerdict, problems);
  }
}

function checkJson(filePath, problems) {
  try {
    return readJson(filePath);
  } catch (error) {
    problems.push('Invalid JSON ' + filePath + ': ' + error.message);
    return null;
  }
}

function checkProject(projectPath, expectedId, problems, warnings) {
  const sdd = path.join(projectPath, '.sdd');
  const projectFile = path.join(sdd, 'project.json');
  const statusFile = path.join(sdd, 'status.json');
  const tasksFile = path.join(sdd, 'tasks.json');
  for (const filePath of [projectFile, statusFile, tasksFile]) {
    if (!fs.existsSync(filePath)) {
      problems.push('Missing project state: ' + filePath);
    }
  }
  if (!fs.existsSync(projectFile) || !fs.existsSync(statusFile) || !fs.existsSync(tasksFile)) {
    return;
  }
  const project = checkJson(projectFile, problems);
  const status = checkJson(statusFile, problems);
  const tasks = checkJson(tasksFile, problems);
  if (!project || !status || !tasks) return;
  for (const field of ['schema_version', 'id', 'name', 'project_type', 'source', 'harness_version']) {
    if (project[field] === undefined || project[field] === null || project[field] === '') {
      problems.push('project.json missing required field ' + field + ' at ' + projectPath);
    }
  }
  if (project.id !== expectedId) {
    problems.push('Project id mismatch at ' + projectPath);
  }
  if (project.schema_version !== 2 || status.schema_version !== 2 || tasks.schema_version !== 2) {
    warnings.push('Legacy SDD state requires migration: ' + projectPath);
  }
  if (tasks.project_id && tasks.project_id !== project.id) {
    problems.push('tasks.json project_id mismatch at ' + projectPath);
  }
  if (!PHASES.has(status.phase)) {
    problems.push('Unsupported lifecycle phase at ' + projectPath + ': ' + status.phase);
  }
  if (!STATES.has(status.state)) {
    problems.push('Unsupported lifecycle state at ' + projectPath + ': ' + status.state);
  }
  if (typeof status.blocked !== 'boolean') {
    problems.push('status.json blocked must be boolean at ' + projectPath);
  }
  if (!status.gates || typeof status.gates !== 'object') {
    problems.push('status.json gates missing at ' + projectPath);
  } else {
    for (const gate of REQUIRED_GATES) {
      if (!GATE_RESULTS.has(status.gates[gate])) {
        problems.push('Invalid or missing gate ' + gate + ' at ' + projectPath);
      }
    }
  }
  if (!Array.isArray(tasks.tasks)) {
    problems.push('tasks.json tasks must be an array at ' + projectPath);
    return;
  }
  const taskIds = new Set();
  for (const task of tasks.tasks) {
    for (const field of ['id', 'title', 'type', 'description', 'acceptanceCriteria', 'technicalChecks', 'dependencies', 'status', 'user_gate']) {
      if (task[field] === undefined) {
        problems.push('Task ' + String(task.id || '?') + ' missing field ' + field + ' in ' + project.id);
      }
    }
    const taskIdValid = typeof task.id === 'string' && TASK_ID_PATTERN.test(task.id);
    if (!taskIdValid) {
      problems.push('Invalid task id: ' + project.id + '/' + String(task.id));
    }
    if (taskIds.has(task.id)) {
      problems.push('Duplicate task id: ' + project.id + '/' + task.id);
    }
    taskIds.add(task.id);
    if (!Array.isArray(task.acceptanceCriteria) || task.acceptanceCriteria.length === 0) {
      problems.push('Task acceptanceCriteria must be non-empty: ' + project.id + '/' + task.id);
    }
    if (!Array.isArray(task.technicalChecks) || !Array.isArray(task.dependencies)) {
      problems.push('Task technicalChecks/dependencies must be arrays: ' + project.id + '/' + task.id);
    }
    if (task.verification_mode !== undefined && !VERIFICATION_MODES.has(task.verification_mode)) {
      problems.push('Unsupported task verification_mode: ' + project.id + '/' + task.id);
    }
    if (task.verification_protocol_version !== undefined
        && !VERIFICATION_PROTOCOL_VERSIONS.has(task.verification_protocol_version)) {
      problems.push('Unsupported task verification_protocol_version: ' + project.id + '/' + task.id);
    }
    if (task.verification_protocol_version !== undefined
        && task.verification_mode !== 'full_independent') {
      problems.push('Task verification_protocol_version requires full_independent mode: ' + project.id + '/' + task.id);
    }
    if (task.test_data_disposition !== undefined
        && !TEST_DATA_DISPOSITIONS.has(task.test_data_disposition)) {
      problems.push('Unsupported task test_data_disposition: ' + project.id + '/' + task.id);
    }
    if (task.verification_scope !== undefined) {
      if (!task.verification_scope || typeof task.verification_scope !== 'object'
          || Array.isArray(task.verification_scope)
          || typeof task.verification_scope.summary !== 'string'
          || !task.verification_scope.summary.trim()
          || !Array.isArray(task.verification_scope.domains)
          || task.verification_scope.domains.length === 0
          || new Set(task.verification_scope.domains).size !== task.verification_scope.domains.length
          || task.verification_scope.domains.some(domain => !FULL_TEST_DOMAIN_SET.has(domain))) {
        problems.push('Invalid task verification_scope: ' + project.id + '/' + task.id);
      }
    }
    if (task.verification_mode === 'full_independent') {
      if (!task.test_brief) {
        problems.push('Full independent task has no test brief: ' + project.id + '/' + task.id);
      } else {
        const expectedBrief = taskIdValid ? '.sdd/test-briefs/full-test-' + task.id + '.md' : null;
        if (!expectedBrief || task.test_brief.replaceAll('\\', '/') !== expectedBrief) {
          problems.push('Full independent task has invalid test brief path: ' + project.id + '/' + task.id);
        } else {
          const briefPath = path.resolve(projectPath, task.test_brief);
          if (!isInside(projectPath, briefPath)) {
            problems.push('Full independent task brief escapes project: ' + project.id + '/' + task.id);
          } else if (!fs.existsSync(briefPath) || !fs.statSync(briefPath).isFile()) {
            problems.push('Full independent task brief missing: ' + briefPath);
          } else {
            const briefRoot = path.join(projectPath, '.sdd', 'test-briefs');
            if (!isRealPathInside(projectPath, briefRoot)
                || !isRealPathInside(briefRoot, briefPath)) {
              problems.push('Full independent task brief resolves outside approved brief root: ' + project.id + '/' + task.id);
            } else {
              validateFullTestBrief(
                briefPath,
                task.id,
                task.verification_protocol_version,
                problems
              );
            }
          }
        }
      }
    }
    validateTerminalEvidence(projectPath, project.id, task, problems);
  }
  for (const task of tasks.tasks) {
    for (const dependency of task.dependencies || []) {
      if (!taskIds.has(dependency)) {
        problems.push('Unknown task dependency: ' + project.id + '/' + task.id + ' -> ' + dependency);
      }
    }
  }
  if (status.current_task && !taskIds.has(status.current_task)) {
    problems.push('status.current_task does not exist: ' + project.id + '/' + status.current_task);
  }

  if (status.gates) {
    const requiredArtifacts = {
      requirements: ['docs/PRD.md'],
      design: ['docs/design/Design-Spec.md', 'docs/diagrams/User-Flow.md', 'docs/prototypes'],
      architecture: [
        'docs/architecture/Architecture.md',
        'docs/diagrams/System-Context.md',
        'docs/api-contracts.md',
      ],
      development: ['docs/PRD.md', 'docs/Plan.md', '.sdd/tasks.json'],
      release: ['docs/delivery/Release-Checklist.md'],
    };
    for (const pair of Object.entries(requiredArtifacts)) {
      const gate = pair[0];
      if (status.gates[gate] !== 'passed') continue;
      for (const relative of pair[1]) {
        if (!fs.existsSync(path.join(projectPath, relative))) {
          problems.push('Gate ' + gate + ' passed but artifact missing: ' + project.id + '/' + relative);
        }
      }
    }
    if (status.gates.development === 'passed' && tasks.tasks.length === 0) {
      problems.push('Development gate passed with no tasks: ' + project.id);
    }
    if (status.gates.release === 'passed' && tasks.tasks.some(task => task.status !== 'passed')) {
      problems.push('Release gate passed while tasks are not passed: ' + project.id);
    }
  }

  const auditFile = path.join(sdd, 'audit.jsonl');
  if (fs.existsSync(auditFile)) {
    const lines = fs.readFileSync(auditFile, 'utf8').split(/\r?\n/).filter(Boolean);
    for (let index = 0; index < lines.length; index += 1) {
      try {
        JSON.parse(lines[index]);
      } catch {
        problems.push('Invalid audit JSON line ' + String(index + 1) + ' at ' + auditFile);
      }
    }
  }
}

function runDoctor(root, options) {
  const problems = [];
  const warnings = [];
  for (const relative of REQUIRED_FRAMEWORK_PATHS) {
    if (!fs.existsSync(path.join(root, relative))) {
      problems.push('Missing required framework path: ' + relative);
    }
  }

  let registry;
  try {
    registry = loadRegistry(root);
  } catch (error) {
    problems.push(error.message);
    return { problems, warnings };
  }
  if (registry.schema_version !== 2) {
    problems.push('Registry schema_version must be 2');
  }
  if (!Array.isArray(registry.projects)) {
    problems.push('Registry projects must be an array');
    return { problems, warnings };
  }
  const ids = new Set();
  for (const project of registry.projects) {
    if (ids.has(project.id)) {
      problems.push('Duplicate project id: ' + project.id);
    }
    ids.add(project.id);
    if ((!options || !options.frameworkOnly) && !(options && options.projectPath)) {
      const projectPath = resolveProjectPath(root, project);
      if (!fs.existsSync(projectPath)) {
        problems.push('Registered project path missing: ' + projectPath);
        continue;
      }
      checkProject(projectPath, project.id, problems, warnings);
    }
  }
  if (registry.active_project_id && !ids.has(registry.active_project_id)) {
    problems.push('Active project is not registered: ' + registry.active_project_id);
  }

  if (options && options.projectPath && !options.frameworkOnly) {
    const projectPath = path.resolve(options.projectPath);
    const projectFile = path.join(projectPath, '.sdd', 'project.json');
    if (!fs.existsSync(projectFile)) {
      problems.push('Explicit project path has no .sdd/project.json: ' + projectPath);
    } else {
      const identity = checkJson(projectFile, problems);
      if (identity) {
        if (!ids.has(identity.id)) {
          problems.push('Explicit project is not registered: ' + identity.id);
        }
        checkProject(projectPath, identity.id, problems, warnings);
      }
    }
  }

  const zh = path.join(root, 'docs', 'zh-CN');
  const en = path.join(root, 'docs', 'en-US');
  if (fs.existsSync(zh) && fs.existsSync(en)) {
    const zhFiles = new Set(fs.readdirSync(zh).filter(name => name.endsWith('.md')));
    const enFiles = new Set(fs.readdirSync(en).filter(name => name.endsWith('.md')));
    for (const name of zhFiles) {
      if (!enFiles.has(name)) problems.push('Missing en-US doc peer: ' + name);
    }
    for (const name of enFiles) {
      if (!zhFiles.has(name)) problems.push('Missing zh-CN doc peer: ' + name);
    }
  }
  return { problems, warnings };
}

module.exports = { runDoctor };
