'use strict';

const fs = require('fs');
const path = require('path');
const {
  appendJsonLine,
  atomicWriteJson,
  copyTemplateTree,
  ensureInside,
  readJson,
} = require('./fs-safe');
const {
  getProject,
  loadRegistry,
  resolveProjectPath,
  saveRegistry,
} = require('./registry');

function validateId(id) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
    throw new Error('Project id must use lowercase letters, numbers, and hyphens: ' + id);
  }
}

function now() {
  return new Date().toISOString();
}

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

function isDirectoryEmpty(directory) {
  return !fs.existsSync(directory) || fs.readdirSync(directory).length === 0;
}

function initializeProject(root, options) {
  const id = options.id;
  validateId(id);
  const registry = loadRegistry(root);
  if (getProject(registry, id)) {
    throw new Error('Project already exists in registry: ' + id);
  }

  const mode = options.mode || 'managed';
  let projectPath;
  if (mode === 'managed') {
    const managedRoot = path.resolve(root, registry.projects_root || 'Projects_Repo');
    projectPath = ensureInside(managedRoot, path.join(managedRoot, id));
    if (!isDirectoryEmpty(projectPath)) {
      throw new Error('Managed project directory is not empty: ' + projectPath);
    }
  } else {
    if (!options.path) {
      throw new Error('External mode requires --path');
    }
    projectPath = path.resolve(options.path);
    if (options.source === 'imported' && !fs.existsSync(projectPath)) {
      throw new Error('External project path does not exist: ' + projectPath);
    }
    fs.mkdirSync(projectPath, { recursive: true });
  }

  const replacements = {
    '__PROJECT_ID__': id,
    '__PROJECT_NAME__': options.name || id,
    '__PROJECT_TYPE__': options.type || 'unknown',
    '__PROJECT_SOURCE__': options.source || 'new',
    '__NOW__': now(),
    '__HARNESS_ROOT__': root.replaceAll('\\\\', '/'),
  };
  copyTemplateTree(
    path.join(root, 'templates', 'project'),
    projectPath,
    replacements,
    false
  );

  const storedPath = mode === 'managed'
    ? path.relative(root, projectPath).replaceAll('\\\\', '/')
    : projectPath;
  const projectRecord = {
    id,
    name: options.name || id,
    path: storedPath,
    mode,
  };
  registry.projects.push(projectRecord);
  registry.active_project_id = id;
  saveRegistry(root, registry);
  appendJsonLine(path.join(projectPath, '.sdd', 'audit.jsonl'), {
    at: now(),
    event: options.source === 'imported' ? 'project_imported' : 'project_initialized',
    project_id: id,
    mode,
    harness_version: '0.1.0',
  });
  return { project: projectRecord, projectPath };
}

function useProject(root, id) {
  const registry = loadRegistry(root);
  const project = getProject(registry, id);
  if (!project) {
    throw new Error('Unknown project: ' + id);
  }
  registry.active_project_id = id;
  saveRegistry(root, registry);
  return { project, projectPath: resolveProjectPath(root, project) };
}

function updateStatus(projectPath, phase, state) {
  const filePath = path.join(projectPath, '.sdd', 'status.json');
  const status = readJson(filePath);
  if (phase && !PHASES.has(phase)) {
    throw new Error('Unsupported lifecycle phase: ' + phase);
  }
  if (state && !STATES.has(state)) {
    throw new Error('Unsupported lifecycle state: ' + state);
  }
  status.phase = phase || status.phase;
  status.state = state || status.state;
  status.updated_at = now();
  atomicWriteJson(filePath, status);
  appendJsonLine(path.join(projectPath, '.sdd', 'audit.jsonl'), {
    at: status.updated_at,
    event: 'status_updated',
    phase: status.phase,
    state: status.state,
  });
  return status;
}

function updateGate(projectPath, gate, result) {
  const filePath = path.join(projectPath, '.sdd', 'status.json');
  const status = readJson(filePath);
  if (!Object.hasOwn(status.gates || {}, gate)) {
    throw new Error('Unknown gate: ' + gate);
  }
  if (!GATE_RESULTS.has(result)) {
    throw new Error('Unsupported gate result: ' + result);
  }
  status.gates[gate] = result;
  status.updated_at = now();
  atomicWriteJson(filePath, status);
  appendJsonLine(path.join(projectPath, '.sdd', 'audit.jsonl'), {
    at: status.updated_at,
    event: 'gate_updated',
    gate,
    result,
  });
  return status;
}

module.exports = {
  initializeProject,
  updateGate,
  updateStatus,
  useProject,
  validateId,
};
