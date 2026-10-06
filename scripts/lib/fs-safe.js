'use strict';

const fs = require('fs');
const path = require('path');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function atomicWriteJson(filePath, value) {
  const directory = path.dirname(filePath);
  fs.mkdirSync(directory, { recursive: true });
  const stamp = String(process.pid) + '-' + String(Date.now());
  const temporary = filePath + '.tmp-' + stamp;
  const backup = filePath + '.bak-' + stamp;
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2) + '\n', 'utf8');

  let movedOriginal = false;
  try {
    if (fs.existsSync(filePath)) {
      fs.renameSync(filePath, backup);
      movedOriginal = true;
    }
    fs.renameSync(temporary, filePath);
    if (movedOriginal && fs.existsSync(backup)) {
      fs.unlinkSync(backup);
    }
  } catch (error) {
    if (fs.existsSync(temporary)) {
      fs.unlinkSync(temporary);
    }
    if (movedOriginal && fs.existsSync(backup) && !fs.existsSync(filePath)) {
      fs.renameSync(backup, filePath);
    }
    throw error;
  }
}

function ensureInside(parentPath, candidatePath) {
  const parent = path.resolve(parentPath);
  const candidate = path.resolve(candidatePath);
  const relative = path.relative(parent, candidate);
  if (relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative))) {
    return candidate;
  }
  throw new Error('Path escapes trusted root: ' + candidate);
}

function replaceText(text, replacements) {
  let output = text;
  for (const pair of Object.entries(replacements)) {
    output = output.split(pair[0]).join(pair[1]);
  }
  return output;
}

function copyTemplateTree(source, destination, replacements, overwrite) {
  const entries = fs.readdirSync(source, { withFileTypes: true });
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      copyTemplateTree(sourcePath, destinationPath, replacements, overwrite);
      continue;
    }
    if (!entry.isFile() || (!overwrite && fs.existsSync(destinationPath))) {
      continue;
    }
    const buffer = fs.readFileSync(sourcePath);
    let content;
    try {
      content = replaceText(buffer.toString('utf8'), replacements);
    } catch {
      content = null;
    }
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    if (content === null || content.includes('\\uFFFD')) {
      fs.writeFileSync(destinationPath, buffer);
    } else {
      fs.writeFileSync(destinationPath, content, 'utf8');
    }
  }
}

function appendJsonLine(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, JSON.stringify(value) + '\n', 'utf8');
}

module.exports = {
  appendJsonLine,
  atomicWriteJson,
  copyTemplateTree,
  ensureInside,
  readJson,
};
