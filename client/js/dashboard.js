document.addEventListener('DOMContentLoaded', async () => {
  if (!app.init()) return;

  const statsContainer = document.getElementById('statsGrid');
  const overdueContainer = document.getElementById('overdueList');
  const breakdownBar = document.getElementById('statusBar');

  try {
    const data = await api.get('/dashboard/stats');
    renderStats(data.stats, statsContainer);
    renderStatusBar(data.stats, breakdownBar);
    renderOverdue(data.overdueTasks, overdueContainer);
  } catch (err) {
    app.toast(err.message, 'error');
  }
});

function renderStats(stats, container) {
  container.innerHTML = `
    <div class="stat-card total">
      <div class="label">Total Tasks</div>
      <div class="value">${stats.total}</div>
    </div>
    <div class="stat-card todo">
      <div class="label">To Do</div>
      <div class="value">${stats.todo}</div>
    </div>
    <div class="stat-card progress">
      <div class="label">In Progress</div>
      <div class="value">${stats['in-progress']}</div>
    </div>
    <div class="stat-card done">
      <div class="label">Completed</div>
      <div class="value">${stats.done}</div>
    </div>
    <div class="stat-card overdue">
      <div class="label">Overdue</div>
      <div class="value">${stats.overdue}</div>
    </div>
  `;
}

function renderStatusBar(stats, container) {
  if (stats.total === 0) {
    container.innerHTML = '<div class="status-bar"><div class="segment" style="width:100%;background:var(--bg-elevated)"></div></div>';
    return;
  }
  const todoPct = (stats.todo / stats.total * 100).toFixed(1);
  const progPct = (stats['in-progress'] / stats.total * 100).toFixed(1);
  const donePct = (stats.done / stats.total * 100).toFixed(1);

  container.innerHTML = `
    <div class="status-bar">
      <div class="segment seg-todo" style="width:${todoPct}%" title="To Do: ${stats.todo}"></div>
      <div class="segment seg-progress" style="width:${progPct}%" title="In Progress: ${stats['in-progress']}"></div>
      <div class="segment seg-done" style="width:${donePct}%" title="Done: ${stats.done}"></div>
    </div>
    <div style="display:flex;gap:16px;margin-top:8px;font-size:0.78rem;color:var(--text-muted)">
      <span><span style="color:var(--info)">●</span> To Do ${todoPct}%</span>
      <span><span style="color:var(--warning)">●</span> In Progress ${progPct}%</span>
      <span><span style="color:var(--success)">●</span> Done ${donePct}%</span>
    </div>
  `;
}

function renderOverdue(tasks, container) {
  if (!tasks || tasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No overdue tasks</h3>
        <p>You're all caught up!</p>
      </div>`;
    return;
  }

  container.innerHTML = `<div class="overdue-list">${tasks.map(t => `
    <div class="overdue-item">
      <div>
        <div class="task-name">${t.title}</div>
        <div style="font-size:0.75rem;color:var(--text-muted)">${t.project ? t.project.name : ''}</div>
      </div>
      <div class="due">Due ${app.formatDate(t.due_date)}</div>
    </div>
  `).join('')}</div>`;
}
