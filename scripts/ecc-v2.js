#!/usr/bin/env node
'use strict';

const nodeMajor = Number(process.versions.node.split('.')[0]);
if (!Number.isInteger(nodeMajor) || nodeMajor < 20) {
  console.error('ERROR: ECC V2 requires Node.js 20 or later; current=' + process.versions.node);
  process.exit(1);
}

const path = require('path');
const { spawn } = require('child_process');
const { runDoctor } = require('./lib/doctor');
const { runWorkflowGuard } = require('./lib/workflow-guard');
const { getActiveProject, loadRegistry, resolveProjectPath } = require('./lib/registry');
const { initializeProject, updateGate, updateStatus, useProject } = require('./lib/project');

const ROOT = path.resolve(__dirname, '..');

function parseArgs(values) {
  const positionals = [];
  const flags = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith('--')) {
      positionals.push(value);
      continue;
    }
    const key = value.slice(2);
    if (Object.prototype.hasOwnProperty.call(flags, key)) throw new Error('Duplicate option: --' + key);
    const next = values[index + 1];
    if (!next || next.startsWith('--')) {
      flags[key] = true;
    } else {
      flags[key] = next;
      index += 1;
    }
  }
  return { positionals, flags };
}

function validateCheckArgs(command, parsed) {
  const allowed = command === 'guard' ? ['project-path', 'task'] : ['project-path', 'framework-only'];
  for (const [key, value] of Object.entries(parsed.flags)) {
    if (!allowed.includes(key)) throw new Error('Unknown ' + command + ' option: --' + key);
    if (key === 'framework-only') {
      if (value !== true) throw new Error('--framework-only does not accept a value');
    } else if (typeof value !== 'string' || !value.trim()) {
      throw new Error('--' + key + ' requires a non-empty value');
    }
  }
  if (parsed.positionals.length !== (command === 'guard' ? 1 : 0)) {
    throw new Error('Invalid positional arguments for ' + command);
  }
  if (parsed.flags['framework-only'] && parsed.flags['project-path']) {
    throw new Error('--framework-only and --project-path are mutually exclusive');
  }
}

function usage() {
  console.log([
    'ECC V2 — Windows Product-to-Code SDD',
    '',
    'Commands:',
    '  init <id> --name <name> [--type <type>]',
    '  import <path> --id <id> --name <name> [--type <type>]',
    '  list',
    '  current',
    '  use <id>',
    '  status',
    '  set-status <phase> <state>',
    '  set-gate <gate> <result>',
    '  doctor [--framework-only | --project-path <path>]',
    '  guard <development|completion> [--project-path <path>] [--task <T-id>]',
    '  migrate <project-path> [--apply]',
    '  dashboard [--port 4317] [--no-open]',
    '',
    'Managed projects are created under Projects_Repo. Imported projects remain',
    'at their existing paths. Destructive actions are never implicit.',
  ].join('\n'));
}

function printProject(project, projectPath, marker) {
  console.log((marker || ' ') + ' ' + project.id + '  ' + project.name);
  console.log('    ' + project.mode + '  ' + projectPath);
}

function main() {
  const command = process.argv[2] || 'help';
  const parsed = parseArgs(process.argv.slice(3));
  if (command === 'help' || command === '--help' || command === '-h') {
    usage();
    return;
  }
  if (command === 'init') {
    const id = parsed.positionals[0];
    if (!id) throw new Error('init requires <id>');
    const result = initializeProject(ROOT, {
      id,
      name: parsed.flags.name || id,
      type: parsed.flags.type || 'unknown',
      mode: 'managed',
      source: 'new',
    });
    console.log('项目已创建 / Project created');
    printProject(result.project, result.projectPath, '*');
    return;
  }
  if (command === 'import') {
    const projectPath = parsed.positionals[0];
    if (!projectPath || !parsed.flags.id) {
      throw new Error('import requires <path> --id <id>');
    }
    const result = initializeProject(ROOT, {
      id: parsed.flags.id,
      name: parsed.flags.name || parsed.flags.id,
      type: parsed.flags.type || 'unknown',
      mode: 'external',
      source: 'imported',
      path: projectPath,
    });
    console.log('项目已导入 / Project imported');
    printProject(result.project, result.projectPath, '*');
    return;
  }
  if (command === 'list') {
    const registry = loadRegistry(ROOT);
    if (registry.projects.length === 0) {
      console.log('暂无项目 / No projects registered');
      return;
    }
    for (const project of registry.projects) {
      printProject(
        project,
        resolveProjectPath(ROOT, project),
        project.id === registry.active_project_id ? '*' : ' '
      );
    }
    return;
  }
  if (command === 'current') {
    const active = getActiveProject(ROOT);
    if (!active.project) {
      console.log('当前没有活动项目 / No active project');
      return;
    }
    printProject(active.project, active.projectPath, '*');
    return;
  }
  if (command === 'use') {
    const id = parsed.positionals[0];
    if (!id) throw new Error('use requires <id>');
    const result = useProject(ROOT, id);
    console.log('已切换活动项目 / Active project changed');
    printProject(result.project, result.projectPath, '*');
    return;
  }
  if (command === 'status') {
    const active = getActiveProject(ROOT);
    if (!active.project) {
      console.log('当前没有活动项目 / No active project');
      return;
    }
    const status = require('./lib/fs-safe').readJson(path.join(active.projectPath, '.sdd', 'status.json'));
    printProject(active.project, active.projectPath, '*');
    console.log('    phase=' + status.phase + ' state=' + status.state + ' blocked=' + status.blocked);
    console.log('    gates=' + JSON.stringify(status.gates));
    return;
  }
  if (command === 'set-status') {
    const active = getActiveProject(ROOT);
    if (!active.project) throw new Error('No active project');
    const phase = parsed.positionals[0];
    const state = parsed.positionals[1];
    if (!phase || !state) throw new Error('set-status requires <phase> <state>');
    const status = updateStatus(active.projectPath, phase, state);
    console.log('状态已更新 / Status updated: ' + status.phase + ' ' + status.state);
    return;
  }
  if (command === 'set-gate') {
    const active = getActiveProject(ROOT);
    if (!active.project) throw new Error('No active project');
    const gate = parsed.positionals[0];
    const result = parsed.positionals[1];
    if (!gate || !result) throw new Error('set-gate requires <gate> <result>');
    updateGate(active.projectPath, gate, result);
    console.log('门禁已更新 / Gate updated: ' + gate + ' ' + result);
    return;
  }
  if (command === 'doctor') {
    validateCheckArgs(command, parsed);
    const result = runDoctor(ROOT, {
      frameworkOnly: Boolean(parsed.flags['framework-only']),
      projectPath: parsed.flags['project-path'],
    });
    for (const warning of result.warnings) console.log('WARN: ' + warning);
    if (result.problems.length) {
      for (const problem of result.problems) console.error('FAIL: ' + problem);
      process.exitCode = 1;
      return;
    }
    console.log('PASS: ECC V2 doctor found no inconsistencies');
    return;
  }
  if (command === 'guard') {
    validateCheckArgs(command, parsed);
    const stage = parsed.positionals[0];
    const result = runWorkflowGuard(ROOT, {
      stage,
      projectPath: parsed.flags['project-path'],
      taskId: parsed.flags.task,
    });
    for (const warning of result.warnings) console.log('WARN: ' + warning);
    if (!result.passed) {
      for (const problem of result.problems) {
        console.error('FAIL [' + problem.code + ']: ' + problem.message);
      }
      process.exitCode = 2;
      return;
    }
    console.log('PASS: ECC V2 ' + stage + ' guard passed for '
      + result.projectId + '/' + result.taskId);
    return;
  }
  if (command === 'migrate') {
    const migration = path.join(__dirname, 'migrate-sdd.js');
    const args = [migration].concat(parsed.positionals);
    if (parsed.flags.apply) args.push('--apply');
    const child = spawn(process.execPath, args, { stdio: 'inherit' });
    child.on('exit', code => { process.exitCode = code || 0; });
    return;
  }
  if (command === 'dashboard') {
    const server = path.join(__dirname, 'dashboard.js');
    const args = [server];
    if (parsed.flags.port) args.push('--port', String(parsed.flags.port));
    if (parsed.flags['no-open']) args.push('--no-open');
    const child = spawn(process.execPath, args, { stdio: 'inherit' });
    child.on('exit', code => { process.exitCode = code || 0; });
    return;
  }
  throw new Error('Unknown command: ' + command);
}

try {
  main();
} catch (error) {
  console.error('ERROR: ' + error.message);
  process.exitCode = 1;
}
