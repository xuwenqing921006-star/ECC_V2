#!/usr/bin/env node
'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');
const { loadRegistry, resolveProjectPath } = require('./lib/registry');
const { readJson } = require('./lib/fs-safe');

const ROOT = path.resolve(__dirname, '..');
const STATIC = path.join(ROOT, 'dashboard');

function overview() {
  const registry = loadRegistry(ROOT);
  return {
    version: fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim(),
    active_project_id: registry.active_project_id,
    projects: registry.projects.map(project => {
      const projectPath = resolveProjectPath(ROOT, project);
      let status = null;
      let tasks = { tasks: [] };
      try {
        status = readJson(path.join(projectPath, '.sdd', 'status.json'));
        tasks = readJson(path.join(projectPath, '.sdd', 'tasks.json'));
      } catch {
        status = { phase: 'unavailable', state: 'blocked', gates: {} };
      }
      const counts = {};
      for (const task of tasks.tasks || []) {
        counts[task.status] = (counts[task.status] || 0) + 1;
      }
      return {
        id: project.id,
        name: project.name,
        mode: project.mode,
        path: projectPath,
        active: project.id === registry.active_project_id,
        status,
        task_counts: counts,
      };
    }),
  };
}

function contentType(filePath) {
  const extension = path.extname(filePath);
  return {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.svg': 'image/svg+xml',
  }[extension] || 'application/octet-stream';
}

function main() {
  const portIndex = process.argv.indexOf('--port');
  const port = portIndex >= 0 ? Number(process.argv[portIndex + 1]) : 4317;
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new Error('Port must be an integer between 1024 and 65535');
  }
  const server = http.createServer((request, response) => {
    if (request.url === '/api/overview') {
      try {
        response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
        response.end(JSON.stringify(overview()));
      } catch (error) {
        response.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify({ error: error.message }));
      }
      return;
    }
    const requested = request.url === '/' ? 'index.html' : request.url.split('?')[0].replace(/^\/+/, '');
    const filePath = path.resolve(STATIC, requested);
    const relative = path.relative(STATIC, filePath);
    if (relative.startsWith('..') || path.isAbsolute(relative) || !fs.existsSync(filePath)) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }
    response.writeHead(200, { 'Content-Type': contentType(filePath) });
    response.end(fs.readFileSync(filePath));
  });
  server.listen(port, '127.0.0.1', () => {
    const url = 'http://127.0.0.1:' + String(port);
    console.log('ECC V2 Dashboard: ' + url);
    console.log('Press Ctrl+C to stop.');
    if (!process.argv.includes('--no-open')) {
      const child = spawn('cmd.exe', ['/c', 'start', '', url], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      });
      child.unref();
    }
  });
}

try {
  main();
} catch (error) {
  console.error('ERROR: ' + error.message);
  process.exitCode = 1;
}
