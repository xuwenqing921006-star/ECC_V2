#!/usr/bin/env node
'use strict';

const path = require('path');
const { runDoctor } = require('./lib/doctor');

const root = path.resolve(__dirname, '..');
const result = runDoctor(root, { frameworkOnly: true });
for (const warning of result.warnings) console.log('WARN: ' + warning);
if (result.problems.length) {
  for (const problem of result.problems) console.error('FAIL: ' + problem);
  process.exit(1);
}
console.log('PASS: framework structure and bilingual document parity are consistent');
