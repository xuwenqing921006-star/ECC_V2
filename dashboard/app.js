'use strict';

const phaseOrder = ['R', 'A', 'B1', 'B2', 'C', 'development', 'verification', 'release', 'operation'];
const gateNames = {
  requirements: '需求',
  research: '调研',
  design: '设计',
  architecture: '架构',
  development: '开发',
  release: '发布',
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function projectCard(project) {
  const currentIndex = phaseOrder.indexOf(project.status.phase);
  const bars = phaseOrder.slice(0, 5).map((phase, index) =>
    '<span class="phase ' + (currentIndex >= index ? 'done' : '') + '" title="' + phase + '"></span>'
  ).join('');
  const stats = Object.entries(project.task_counts || {}).map(pair =>
    '<span class="stat">' + escapeHtml(pair[0]) + ' ' + escapeHtml(pair[1]) + '</span>'
  ).join('') || '<span class="stat">暂无任务</span>';
  const gates = Object.entries(project.status.gates || {}).map(pair =>
    '<div class="gate"><span>' + escapeHtml(gateNames[pair[0]] || pair[0]) +
    '</span><span>' + escapeHtml(pair[1]) + '</span></div>'
  ).join('');
  return [
    '<article class="project ' + (project.active ? 'active' : '') + '">',
    '<div class="project-head"><div><h3>' + escapeHtml(project.name) + '</h3>',
    '<p class="meta">' + escapeHtml(project.id) + ' · ' + escapeHtml(project.mode) + '</p></div>',
    '<span class="badge">' + escapeHtml(project.status.phase) + ' / ' + escapeHtml(project.status.state) + '</span></div>',
    '<p class="meta">' + escapeHtml(project.path) + '</p>',
    '<div class="lifecycle">' + bars + '</div>',
    '<div class="stats">' + stats + '</div>',
    '<div class="gates">' + gates + '</div>',
    '</article>',
  ].join('');
}

async function refresh() {
  const response = await fetch('/api/overview', { cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Unable to load status');
  document.getElementById('version').textContent = 'v' + data.version;
  document.getElementById('project-count').textContent = data.projects.length;
  document.getElementById('active-project').textContent = data.active_project_id || '未选择';
  const projects = document.getElementById('projects');
  projects.innerHTML = data.projects.map(projectCard).join('');
  document.getElementById('empty').hidden = data.projects.length !== 0;
}

document.getElementById('refresh').addEventListener('click', () => {
  refresh().catch(error => window.alert(error.message));
});
refresh().catch(error => window.alert(error.message));
