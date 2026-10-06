'use strict';

const fs = require('fs');
const path = require('path');
const { readJson } = require('./fs-safe');
const { getProject, loadRegistry, resolveProjectPath } = require('./registry');

const TERMINAL_STATUSES = new Set(['passed', 'failed', 'blocked']);

function isInsideOrEqual(basePath, targetPath) {
  const relative = path.relative(path.resolve(basePath), path.resolve(targetPath));
  return relative === '' || (!relative.startsWith('..' + path.sep) && !path.isAbsolute(relative));
}

function isFullIndependentTestingRequest(message) {
  const text = String(message || '').replace(/\s+/g, ' ').trim();
  if (!text) return false;
  if (/(?:不要|不用|无需|暂不|先别|取消|没有要求|并未要求|未要求).{0,16}(?:全流程|全量|完整)(?:的)?独立(?:测试|验收)/i.test(text)) {
    return false;
  }
  const withoutQuotedExamples = text
    .replace(/“[^”]*”/g, ' ')
    .replace(/"[^"]*"/g, ' ')
    .replace(/‘[^’]*’/g, ' ')
    .replace(/'[^']*'/g, ' ');
  if (/(?:这句话|该句话|触发词).{0,20}(?:能否|是否|会不会)?触发|(?:能否|是否|会不会).{0,20}触发/i.test(text)) {
    return false;
  }
  if (/(?:升级|实现|修改|创建|设计|编写).{0,40}(?:全流程独立测试|full_independent).{0,20}(?:能力|协议|规则|Skill|模板|Schema)/i.test(text)) {
    return false;
  }
  if (/\$ecc-v2-full-independent-testing\b/i.test(withoutQuotedExamples)) return true;
  return /(?:请|麻烦|现在|立即)?(?:对.{1,120})?(?:进行|开展|执行|启动)(?:一次)?(?:全流程|全量|完整)(?:的)?独立(?:测试|验收)/i.test(withoutQuotedExamples)
    || /交给.{0,40}独立\s*Tester.{0,30}(?:完整|全流程|全量)(?:测试|验收)/i.test(withoutQuotedExamples);
}

function resolveProject(root, options) {
  const registry = loadRegistry(root);
  if (options.projectPath) {
    const requestedPath = path.resolve(options.projectPath);
    if (!fs.existsSync(requestedPath)) {
      throw new Error('BLOCKED: explicit ECC V2 project path does not exist');
    }
    const requestedRealPath = fs.realpathSync.native(requestedPath);
    const matches = registry.projects.filter(project => {
      const candidatePath = resolveProjectPath(root, project);
      return fs.existsSync(candidatePath)
        && fs.realpathSync.native(candidatePath) === requestedRealPath;
    });
    if (matches.length !== 1) {
      throw new Error('BLOCKED: explicit project path does not identify one registered ECC V2 project');
    }
    if (options.projectId && matches[0].id !== options.projectId) {
      throw new Error('BLOCKED: explicit ECC V2 project id and path disagree');
    }
    return { project: matches[0], projectPath: resolveProjectPath(root, matches[0]) };
  }
  if (options.projectId) {
    const explicit = getProject(registry, options.projectId);
    if (!explicit) throw new Error('BLOCKED: unknown ECC V2 project ' + options.projectId);
    return { project: explicit, projectPath: resolveProjectPath(root, explicit) };
  }

  const cwd = path.resolve(options.cwd || root);
  const matching = registry.projects
    .map(project => ({ project, projectPath: resolveProjectPath(root, project) }))
    .filter(candidate => fs.existsSync(candidate.projectPath)
      && isInsideOrEqual(fs.realpathSync.native(candidate.projectPath), fs.realpathSync.native(cwd)));
  if (matching.length === 1) return matching[0];
  if (matching.length > 1) {
    matching.sort((left, right) => right.projectPath.length - left.projectPath.length);
    return matching[0];
  }
  if (!registry.active_project_id) {
    throw new Error('BLOCKED: no current ECC V2 project can be resolved');
  }
  const active = getProject(registry, registry.active_project_id);
  if (!active) throw new Error('BLOCKED: active ECC V2 project is not registered');
  return { project: active, projectPath: resolveProjectPath(root, active) };
}

function resolveTask(projectPath, taskId) {
  const status = readJson(path.join(projectPath, '.sdd', 'status.json'));
  const plan = readJson(path.join(projectPath, '.sdd', 'tasks.json'));
  const tasks = Array.isArray(plan.tasks) ? plan.tasks : [];
  const requestedId = taskId || status.current_task;
  if (requestedId) {
    const selected = tasks.find(task => task.id === requestedId);
    if (!selected) throw new Error('BLOCKED: current ECC V2 task does not exist: ' + requestedId);
    return selected;
  }
  const inProgress = tasks.filter(task => task.status === 'in_progress');
  if (inProgress.length === 1) return inProgress[0];
  const nonTerminal = tasks.filter(task => !TERMINAL_STATUSES.has(task.status));
  if (nonTerminal.length === 1) return nonTerminal[0];
  throw new Error('BLOCKED: current ECC V2 task is ambiguous');
}

function resolveFullIndependentContext(root, options = {}) {
  const resolved = resolveProject(path.resolve(root), options);
  if (!fs.existsSync(path.join(resolved.projectPath, '.sdd', 'project.json'))) {
    throw new Error('BLOCKED: resolved project is missing .sdd/project.json');
  }
  return {
    ...resolved,
    task: resolveTask(resolved.projectPath, options.taskId),
  };
}

module.exports = {
  isFullIndependentTestingRequest,
  resolveFullIndependentContext,
};
