document.addEventListener('DOMContentLoaded', async () => {
  if (!app.init()) return;

  const statsContainer = document.getElementById('statsGrid');
  const overdueContainer = document.getElementById('overdueList');
  const breakdownBar = document.getElementById('statusBar');

  try {
    const data = await api.get('/dashboard/stats');
    renderStats(data.stats, statsContainer);
    if (window.Chart) {
      renderCharts(data.stats, data.priorities);
    }
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

function renderCharts(stats, priorities) {
  const statusCtx = document.getElementById('statusChart').getContext('2d');
  const priorityCtx = document.getElementById('priorityChart').getContext('2d');

  const textColor = document.body.classList.contains('dark-theme') ? '#e2e8f0' : '#475569';
  Chart.defaults.color = textColor;
  Chart.defaults.font.family = 'inherit';

  new Chart(statusCtx, {
    type: 'doughnut',
    data: {
      labels: ['To Do', 'In Progress', 'Done'],
      datasets: [{
        data: [stats.todo, stats['in-progress'], stats.done],
        backgroundColor: ['#3b82f6', '#f59e0b', '#10b981'],
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      plugins: {
        title: { display: true, text: 'Tasks by Status' }
      }
    }
  });

  new Chart(priorityCtx, {
    type: 'bar',
    data: {
      labels: ['Low', 'Medium', 'High'],
      datasets: [{
        label: 'Task Count',
        data: [priorities?.low || 0, priorities?.medium || 0, priorities?.high || 0],
        backgroundColor: ['#94a3b8', '#f59e0b', '#ef4444'],
        borderRadius: 4
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: true },
        x: { }
      },
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Tasks by Priority' }
      }
    }
  });
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
