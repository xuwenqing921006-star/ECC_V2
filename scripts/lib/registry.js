'use strict';

const fs = require('fs');
const path = require('path');
const { atomicWriteJson, readJson } = require('./fs-safe');

function registryPath(root) {
  return path.join(root, 'project-registry.json');
}

function loadRegistry(root) {
  const filePath = registryPath(root);
  if (!fs.existsSync(filePath)) {
    throw new Error('Missing project-registry.json');
  }
  return readJson(filePath);
}

function saveRegistry(root, registry) {
  atomicWriteJson(registryPath(root), registry);
}

function resolveProjectPath(root, project) {
  return path.isAbsolute(project.path)
    ? path.resolve(project.path)
    : path.resolve(root, project.path);
}

function getProject(registry, id) {
  return registry.projects.find(project => project.id === id) || null;
}

function getActiveProject(root) {
  const registry = loadRegistry(root);
  if (!registry.active_project_id) {
    return { registry, project: null, projectPath: null };
  }
  const project = getProject(registry, registry.active_project_id);
  if (!project) {
    throw new Error('Active project is not present in registry: ' + registry.active_project_id);
  }
  return { registry, project, projectPath: resolveProjectPath(root, project) };
}

module.exports = {
  getActiveProject,
  getProject,
  loadRegistry,
  resolveProjectPath,
  saveRegistry,
};
