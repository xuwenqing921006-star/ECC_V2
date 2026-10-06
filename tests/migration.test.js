'use strict';

const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');

test('legacy SDD migration is dry-run by default and creates backups on apply', t => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'ecc-v2-migrate-'));
  t.after(() => fs.rmSync(project, { recursive: true, force: true }));
  const sdd = path.join(project, '.sdd');
  fs.mkdirSync(path.join(sdd, 'test-reports'), { recursive: true });
  fs.writeFileSync(path.join(sdd, 'project.json'), JSON.stringify({
    id: 'legacy',
    name: 'Legacy',
    project_type: 'web',
    source: 'new',
    harness_version: 'V7.1',
  }));
  fs.writeFileSync(path.join(sdd, 'status.json'), JSON.stringify({
    stage: 'initialized',
    blocked: false,
  }));
  fs.writeFileSync(path.join(sdd, 'tasks.json'), JSON.stringify({
    tasks: [{ id: 'T-001', title: 'Old task', status: 'passed', acceptanceCriteria: ['works'], technicalChecks: [] }],
  }));

  const script = path.join(ROOT, 'scripts', 'migrate-sdd.js');
  const dry = spawnSync(process.execPath, [script, project], { encoding: 'utf8' });
  assert.equal(dry.status, 0, dry.stderr);
  assert.match(dry.stdout, /DRY RUN/);
  assert.equal(JSON.parse(fs.readFileSync(path.join(sdd, 'project.json'))).schema_version, undefined);

  const applied = spawnSync(process.execPath, [script, project, '--apply'], { encoding: 'utf8' });
  assert.equal(applied.status, 0, applied.stderr);
  assert.equal(JSON.parse(fs.readFileSync(path.join(sdd, 'project.json'))).schema_version, 2);
  assert.equal(JSON.parse(fs.readFileSync(path.join(sdd, 'tasks.json'))).project_id, 'legacy');
  assert.ok(fs.readdirSync(sdd).some(name => name.includes('.pre-ecc-v2-') && name.endsWith('.bak')));
});
