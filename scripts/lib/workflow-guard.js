'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { readJson } = require('./fs-safe');
const { runDoctor } = require('./doctor');
const { getActiveProject, loadRegistry, resolveProjectPath } = require('./registry');

const WORKFLOWS = new Set([
  'new-product', 'existing-change', 'bugfix', 'refactor',
  'product-design-only', 'research', 'release', 'archive-delete',
]);
const CHANGE_SIZES = new Set([
  'small', 'medium', 'large', 'bug', 'refactor', 'release', 'maintenance',
]);
const READY_GATE_RESULTS = new Set(['passed', 'waived', 'not_applicable']);

function findProjectFromCwd(startPath) {
  let current = path.resolve(startPath);
  while (true) {
    if (fs.existsSync(path.join(current, '.sdd', 'project.json'))) return current;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

function resolveGuardProject(root, requestedPath) {
  const explicit = requestedPath ? path.resolve(requestedPath) : findProjectFromCwd(process.cwd());
  if (explicit) return explicit;
  const active = getActiveProject(root);
  if (!active.projectPath) throw new Error('No project path was supplied and no active project exists');
  return active.projectPath;
}

function isInside(basePath, targetPath) {
  const relative = path.relative(path.resolve(basePath), path.resolve(targetPath));
  return relative !== '' && relative !== '..'
    && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative);
}

function validateProjectIdentity(projectPath, registeredPath, problems) {
  try {
    const actual = fs.realpathSync(projectPath);
    const registered = fs.realpathSync(registeredPath);
    if (path.relative(actual, registered) === '') return;
    const gitPath = (cwd, flag) => fs.realpathSync(execFileSync('git',
      ['-C', cwd, 'rev-parse', '--path-format=absolute', flag],
      { encoding: 'utf8', timeout: 10000, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }).trim());
    if (path.relative(actual, gitPath(actual, '--show-toplevel')) === ''
      && path.relative(registered, gitPath(registered, '--show-toplevel')) === ''
      && path.relative(gitPath(actual, '--git-common-dir'), gitPath(registered, '--git-common-dir')) === '') return;
  } catch (_) {
    // Missing paths, non-repositories and failed identity checks fail closed.
  }
  addProblem(problems, 'PROJECT_IDENTITY', 'Project path is neither the registered project nor its Git worktree');
}

function addProblem(problems, code, message) {
  problems.push({ code, message });
}

function requireString(task, field, problems) {
  if (typeof task[field] !== 'string' || !task[field].trim()) {
    addProblem(problems, 'TASK_CONTRACT', task.id + ' missing non-empty ' + field);
  }
}

function requireArray(task, field, problems) {
  if (!Array.isArray(task[field]) || task[field].length === 0
    || task[field].some(value => typeof value !== 'string' || !value.trim())) {
    addProblem(problems, 'TASK_CONTRACT', task.id + ' missing non-empty ' + field);
  }
}

function validateEvidenceFile(projectPath, relativePath, label, problems) {
  if (typeof relativePath !== 'string' || !relativePath.trim()) {
    addProblem(problems, 'MISSING_EVIDENCE', label + ' evidence path is missing');
    return null;
  }
  const target = path.resolve(projectPath, relativePath);
  if (!isInside(projectPath, target)) {
    addProblem(problems, 'UNSAFE_EVIDENCE', label + ' evidence escapes project: ' + relativePath);
    return null;
  }
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
    addProblem(problems, 'MISSING_EVIDENCE', label + ' evidence file is missing: ' + relativePath);
    return null;
  }
  if (!isInside(fs.realpathSync(projectPath), fs.realpathSync(target))) {
    addProblem(problems, 'UNSAFE_EVIDENCE', label + ' physical evidence path escapes project: ' + relativePath);
    return null;
  }
  if (!fs.readFileSync(target, 'utf8').trim()) {
    addProblem(problems, 'MISSING_EVIDENCE', label + ' evidence file is empty');
    return null;
  }
  return target;
}

function validateTaskContract(task, problems) {
  if (task.workflow_contract_version !== '1.0') {
    addProblem(problems, 'TASK_CONTRACT', task.id + ' workflow_contract_version must be 1.0');
  }
  if (!WORKFLOWS.has(task.workflow)) {
    addProblem(problems, 'TASK_CONTRACT', task.id + ' has invalid or missing workflow');
  }
  if (!CHANGE_SIZES.has(task.change_size)) {
    addProblem(problems, 'TASK_CONTRACT', task.id + ' has invalid or missing change_size');
  }
  requireArray(task, 'affectedAreas', problems);
  requireArray(task, 'compatibilityConstraints', problems);
  requireArray(task, 'acceptanceCriteria', problems);
  requireArray(task, 'technicalChecks', problems);
  if (typeof task.user_gate !== 'boolean') {
    addProblem(problems, 'TASK_CONTRACT', task.id + ' user_gate must be a boolean');
  }
  requireString(task, 'migrationRollback', problems);
  if (!['focused', 'full_independent'].includes(task.verification_mode)) {
    addProblem(problems, 'TASK_CONTRACT', task.id + ' must declare focused or full_independent verification_mode');
  }
}

function validateDevelopmentReadiness(projectPath, task, problems) {
  const readiness = task.development_readiness;
  if (!readiness || typeof readiness !== 'object' || Array.isArray(readiness)) {
    addProblem(problems, 'DEVELOPMENT_READINESS', task.id + ' has no task-bound development_readiness');
    return;
  }
  if (readiness.status !== 'passed') {
    addProblem(problems, 'DEVELOPMENT_READINESS', task.id + ' development_readiness is not passed');
  }
  for (const field of ['checked_at', 'baseline', 'authorization']) {
    if (typeof readiness[field] !== 'string' || !readiness[field].trim()) {
      addProblem(problems, 'DEVELOPMENT_READINESS', task.id + ' development_readiness missing ' + field);
    }
  }
  if (readiness.checked_at && Number.isNaN(Date.parse(readiness.checked_at))) {
    addProblem(problems, 'DEVELOPMENT_READINESS', task.id + ' development_readiness.checked_at is not a timestamp');
  }
  const evidencePath = validateEvidenceFile(
    projectPath,
    readiness.evidence,
    task.id + ' development readiness',
    problems
  );
  if (evidencePath) {
    const content = fs.readFileSync(evidencePath, 'utf8');
    if (!content.includes(task.id)) {
      addProblem(problems, 'DEVELOPMENT_READINESS', task.id + ' readiness evidence does not name the task');
    }
  }
}

function validateDevelopmentStage(projectPath, status, tasks, task, problems) {
  if (status.phase !== 'development' || status.state !== 'in_progress') {
    addProblem(problems, 'LIFECYCLE', 'development guard requires status phase=development and state=in_progress');
  }
  if (status.blocked || (Array.isArray(status.blockers) && status.blockers.length > 0)) {
    addProblem(problems, 'LIFECYCLE', 'development guard cannot pass while project status is blocked');
  }
  if (task.status !== 'in_progress') {
    addProblem(problems, 'TASK_STATE', task.id + ' must be in_progress before implementation');
  }
  if (task.evidence !== null && task.evidence !== undefined && task.evidence !== '') {
    addProblem(problems, 'TASK_STATE', task.id + ' must not carry terminal evidence before implementation');
  }
  for (const gate of ['requirements', 'research', 'design', 'architecture']) {
    if (!READY_GATE_RESULTS.has(status.gates && status.gates[gate])) {
      addProblem(problems, 'GATE', gate + ' gate is not resolved for ' + task.id);
    }
  }
  if (!status.gates || status.gates.development !== 'passed') {
    addProblem(problems, 'GATE', 'development gate is not passed for ' + task.id);
  }
  if (status.gates && status.gates.release === 'passed') {
    addProblem(problems, 'GATE', 'release gate must be reset for a new development task');
  }
  const taskById = new Map(tasks.map(candidate => [candidate.id, candidate]));
  for (const dependency of task.dependencies || []) {
    const target = taskById.get(dependency);
    if (!target || target.status !== 'passed') {
      addProblem(problems, 'DEPENDENCY', task.id + ' dependency is not passed: ' + dependency);
    }
  }
  validateDevelopmentReadiness(projectPath, task, problems);
}

function markerMatches(report, expression, expected) {
  const matches = [...report.matchAll(expression)];
  return matches.length === 1 && matches[0][1] === expected;
}

function validateCompletionStage(projectPath, status, task, problems) {
  const verdict = 'PASS';
  if (task.status !== 'passed') {
    addProblem(problems, 'TASK_STATE', task.id + ' must be passed to complete; FAIL/BLOCKED are recorded outcomes, not completion');
    return;
  }
  if (status.state !== task.status) {
    addProblem(problems, 'LIFECYCLE', 'status.state must match current task terminal status');
  }
  if (!['verification', 'release', 'operation'].includes(status.phase)) {
    addProblem(problems, 'LIFECYCLE', 'completion guard requires verification, release, or operation phase');
  }
  if (status.blocked !== false || !Array.isArray(status.blockers) || status.blockers.length > 0) {
    addProblem(problems, 'LIFECYCLE', 'completion requires blocked=false and no blockers');
  }
  for (const gate of ['requirements', 'research', 'design', 'architecture']) {
    if (!READY_GATE_RESULTS.has(status.gates && status.gates[gate])) {
      addProblem(problems, 'GATE', gate + ' gate is not resolved for ' + task.id);
    }
  }
  const docsOnly = task.workflow === 'product-design-only' && task.type === 'documentation';
  if (docsOnly) {
    const plan = validateEvidenceFile(projectPath, task.documentation_plan, task.id + ' documentation plan', problems);
    if (plan && !fs.readFileSync(plan, 'utf8').includes(task.id)) {
      addProblem(problems, 'TASK_CONTRACT', task.id + ' documentation plan does not name the task');
    }
    if (!status.gates || status.gates.development !== 'not_applicable') {
      addProblem(problems, 'GATE', 'documentation-only completion requires development=not_applicable');
    }
  } else {
    validateDevelopmentReadiness(projectPath, task, problems);
    if (!status.gates || status.gates.development !== 'passed') {
      addProblem(problems, 'GATE', 'development gate is not passed for ' + task.id);
    }
  }
  const expectedEvidence = '.sdd/test-reports/test-' + task.id + '.md';
  const normalizedEvidence = typeof task.evidence === 'string'
    ? task.evidence.replaceAll('\\', '/') : '';
  if (normalizedEvidence !== expectedEvidence) {
    addProblem(problems, 'TESTER_EVIDENCE', task.id + ' must use ' + expectedEvidence);
    return;
  }
  const reportPath = validateEvidenceFile(projectPath, task.evidence, task.id + ' Tester', problems);
  if (!reportPath) return;
  const report = fs.readFileSync(reportPath, 'utf8');
  if (!markerMatches(report, /^ECC_TEST_TASK:\s*(\S+)\s*$/gm, task.id)) {
    addProblem(problems, 'TESTER_EVIDENCE', task.id + ' report must contain one matching ECC_TEST_TASK marker');
  }
  if (!markerMatches(report, /^ECC_TEST_VERDICT:\s*(PASS|FAIL|BLOCKED)\s*$/gm, verdict)) {
    addProblem(problems, 'TESTER_EVIDENCE', task.id + ' report verdict does not match task status');
  }
  if (!markerMatches(report, /^ECC_TEST_INDEPENDENT:\s*(true|false)\s*$/gm, 'true')) {
    addProblem(problems, 'TESTER_EVIDENCE', task.id + ' report must declare ECC_TEST_INDEPENDENT: true');
  }
  if (task.status === 'passed' && task.user_gate === true) {
    const acceptance = task.business_acceptance;
    if (!acceptance || acceptance.status !== 'accepted') {
      addProblem(problems, 'BUSINESS_ACCEPTANCE', task.id + ' requires accepted Product Owner business acceptance');
    } else {
      validateEvidenceFile(projectPath, acceptance.evidence, task.id + ' business acceptance', problems);
    }
  }
}

function runWorkflowGuard(root, options = {}) {
  const problems = [];
  const warnings = [];
  const stage = options.stage;
  if (!['development', 'completion'].includes(stage)) {
    throw new Error('Guard stage must be development or completion');
  }
  const projectPath = resolveGuardProject(root, options.projectPath);
  const projectFile = path.join(projectPath, '.sdd', 'project.json');
  const statusFile = path.join(projectPath, '.sdd', 'status.json');
  const tasksFile = path.join(projectPath, '.sdd', 'tasks.json');
  for (const file of [projectFile, statusFile, tasksFile]) {
    if (!fs.existsSync(file)) addProblem(problems, 'PROJECT_STATE', 'Missing project state: ' + file);
  }
  if (problems.length) {
    return { passed: false, stage, projectPath, projectId: null, taskId: null, problems, warnings };
  }

  const project = readJson(projectFile);
  const status = readJson(statusFile);
  const taskDocument = readJson(tasksFile);
  const registry = loadRegistry(root);
  const registered = registry.projects.find(candidate => candidate.id === project.id);
  if (!registered) {
    addProblem(problems, 'PROJECT_IDENTITY', 'Project is not registered in ECC V2: ' + project.id);
  } else {
    validateProjectIdentity(projectPath, resolveProjectPath(root, registered), problems);
  }
  const taskId = options.taskId || status.current_task;
  const tasks = Array.isArray(taskDocument.tasks) ? taskDocument.tasks : [];
  const task = tasks.find(candidate => candidate.id === taskId);
  if (!taskId) {
    addProblem(problems, 'CURRENT_TASK', 'No task was supplied and status.current_task is empty');
  } else if (!task) {
    addProblem(problems, 'CURRENT_TASK', 'Task does not exist in tasks.json: ' + taskId);
  }
  if (taskId && status.current_task !== taskId) {
    addProblem(problems, 'CURRENT_TASK', 'status.current_task does not match requested task: ' + taskId);
  }

  const doctor = runDoctor(root, { projectPath });
  for (const problem of doctor.problems) addProblem(problems, 'DOCTOR', problem);
  warnings.push(...doctor.warnings);

  if (task) {
    validateTaskContract(task, problems);
    if (stage === 'development') validateDevelopmentStage(projectPath, status, tasks, task, problems);
    else validateCompletionStage(projectPath, status, task, problems);
  }

  return {
    passed: problems.length === 0,
    stage,
    projectPath,
    projectId: project.id,
    taskId: taskId || null,
    problems,
    warnings,
    registeredPath: registered ? resolveProjectPath(root, registered) : null,
  };
}

module.exports = { runWorkflowGuard };
