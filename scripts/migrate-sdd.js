#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { atomicWriteJson, readJson } = require('./lib/fs-safe');

function inferGates(projectPath) {
  const exists = relative => fs.existsSync(path.join(projectPath, relative));
  return {
    requirements: exists('docs/PRD.md') ? 'passed' : 'pending',
    research: exists('docs/research') ? 'passed' : 'pending',
    design: exists('docs/prototypes') ? 'passed' : 'pending',
    architecture: exists('docs/architecture/Architecture.md') || exists('docs/api-contracts.md')
      ? 'passed'
      : 'pending',
    development: exists('docs/Plan.md') && exists('.sdd/tasks.json') ? 'passed' : 'pending',
    release: 'pending',
  };
}

function planMigration(projectPath) {
  const sdd = path.join(projectPath, '.sdd');
  const projectFile = path.join(sdd, 'project.json');
  const statusFile = path.join(sdd, 'status.json');
  const tasksFile = path.join(sdd, 'tasks.json');
  if (!fs.existsSync(projectFile)) {
    throw new Error('Not an SDD project: missing ' + projectFile);
  }
  const project = readJson(projectFile);
  const legacyStatus = fs.existsSync(statusFile) ? readJson(statusFile) : {};
  const legacyTasks = fs.existsSync(tasksFile) ? readJson(tasksFile) : { tasks: [] };
  const now = new Date().toISOString();

  const nextProject = Object.assign({}, project, {
    schema_version: 2,
    locale: project.locale || 'zh-CN',
    harness_version: '0.1.0',
  });
  delete nextProject.last_active;

  const knownPhases = new Set(['initialized', 'R', 'A', 'B1', 'B2', 'C', 'development', 'verification', 'release', 'operation', 'archived']);
  const legacyPhase = legacyStatus.phase || legacyStatus.stage || 'initialized';
  const nextStatus = {
    schema_version: 2,
    phase: knownPhases.has(legacyPhase) ? legacyPhase : 'initialized',
    state: legacyStatus.blocked ? 'blocked' : (legacyStatus.state || 'draft'),
    current_task: legacyStatus.current_task || null,
    blocked: Boolean(legacyStatus.blocked),
    blockers: Array.isArray(legacyStatus.blockers) ? legacyStatus.blockers : [],
    gates: legacyStatus.gates || inferGates(projectPath),
    updated_at: now,
  };

  const tasks = Array.isArray(legacyTasks.tasks) ? legacyTasks.tasks.map(task => {
    const evidenceCandidate = path.join('.sdd', 'test-reports', 'test-' + task.id + '.md').replaceAll('\\\\', '/');
    const hasEvidence = fs.existsSync(path.join(projectPath, evidenceCandidate));
    return Object.assign({
      type: 'implementation',
      description: '',
      acceptanceCriteria: [],
      technicalChecks: [],
      dependencies: [],
      status: 'pending',
      user_gate: false,
    }, task, {
      evidence: task.evidence || (hasEvidence ? evidenceCandidate : null),
    });
  }) : [];
  const nextTasks = {
    schema_version: 2,
    project_id: nextProject.id,
    tasks,
  };
  return {
    files: [
      { path: projectFile, before: project, after: nextProject },
      { path: statusFile, before: legacyStatus, after: nextStatus },
      { path: tasksFile, before: legacyTasks, after: nextTasks },
    ],
  };
}

function main() {
  const input = process.argv[2];
  const apply = process.argv.includes('--apply');
  if (!input) {
    throw new Error('Usage: migrate-sdd.js <project-path> [--apply]');
  }
  const projectPath = path.resolve(input);
  const migration = planMigration(projectPath);
  console.log((apply ? 'APPLY' : 'DRY RUN') + ': SDD -> ECC V2');
  for (const item of migration.files) {
    console.log('- ' + item.path + ' schema ' + String(item.before.schema_version || 1) + ' -> 2');
  }
  const passedWithoutEvidence = migration.files[2].after.tasks.filter(task => task.status === 'passed' && !task.evidence);
  if (passedWithoutEvidence.length) {
    console.log('WARN: passed tasks without evidence will make Doctor fail: ' + passedWithoutEvidence.map(task => task.id).join(', '));
  }
  if (!apply) {
    console.log('No files changed. Re-run with --apply after review.');
    return;
  }
  const stamp = new Date().toISOString().replaceAll(':', '-');
  for (const item of migration.files) {
    if (fs.existsSync(item.path)) {
      fs.copyFileSync(item.path, item.path + '.pre-ecc-v2-' + stamp + '.bak');
    }
    atomicWriteJson(item.path, item.after);
  }
  console.log('Migration applied. Backups were saved beside the original state files.');
}

try {
  main();
} catch (error) {
  console.error('ERROR: ' + error.message);
  process.exitCode = 1;
}
