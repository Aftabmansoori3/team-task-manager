document.addEventListener('DOMContentLoaded', async () => {
  if (!app.init()) return;

  const grid = document.getElementById('projectsGrid');
  const createBtn = document.getElementById('createProjectBtn');

  // only admins can create projects
  if (createBtn && !app.isAdmin()) {
    createBtn.style.display = 'none';
  }

  if (createBtn) {
    createBtn.addEventListener('click', () => openProjectModal());
  }

  await loadProjects(grid);
});

async function loadProjects(grid) {
  app.showLoader(grid);
  try {
    const data = await api.get('/projects');
    renderProjects(data.projects, grid);
  } catch (err) {
    app.toast(err.message, 'error');
    grid.innerHTML = '<div class="empty-state"><h3>Failed to load projects</h3></div>';
  }
}

function renderProjects(projects, grid) {
  if (!projects || projects.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <h3>No projects yet</h3>
        <p>${app.isAdmin() ? 'Create your first project to get started.' : 'Ask an admin to add you to a project.'}</p>
      </div>`;
    return;
  }

  grid.innerHTML = projects.map(p => {
    const memberCount = p.members ? p.members.length : 0;
    const taskCounts = { todo: 0, 'in-progress': 0, done: 0 };
    if (p.tasks) p.tasks.forEach(t => taskCounts[t.status]++);
    const totalTasks = p.tasks ? p.tasks.length : 0;

    return `
      <div class="project-card" onclick="window.location.href='/project-detail.html?id=${p.id}'">
        <h3>${escHtml(p.name)}</h3>
        <p class="desc">${escHtml(p.description || 'No description')}</p>
        ${totalTasks > 0 ? `
          <div class="status-bar">
            <div class="segment seg-todo" style="width:${taskCounts.todo/totalTasks*100}%"></div>
            <div class="segment seg-progress" style="width:${taskCounts['in-progress']/totalTasks*100}%"></div>
            <div class="segment seg-done" style="width:${taskCounts.done/totalTasks*100}%"></div>
          </div>
        ` : ''}
        <div class="project-meta">
          <span>👥 ${memberCount} member${memberCount !== 1 ? 's' : ''}</span>
          <span>📋 ${totalTasks} task${totalTasks !== 1 ? 's' : ''}</span>
          <span>by ${p.owner ? p.owner.name : 'Unknown'}</span>
        </div>
      </div>`;
  }).join('');
}

function openProjectModal() {
  let overlay = document.getElementById('projectModal');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'projectModal';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <h2>New Project</h2>
        <form id="projectForm">
          <div class="form-group">
            <label for="projectName">Project Name</label>
            <input type="text" id="projectName" placeholder="e.g. Website Redesign" required>
          </div>
          <div class="form-group">
            <label for="projectDesc">Description</label>
            <textarea id="projectDesc" placeholder="Brief description..."></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" onclick="closeProjectModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Create Project</button>
          </div>
        </form>
      </div>`;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeProjectModal();
    });

    document.getElementById('projectForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector('[type="submit"]');
      btn.disabled = true;

      try {
        await api.post('/projects', {
          name: document.getElementById('projectName').value.trim(),
          description: document.getElementById('projectDesc').value.trim()
        });
        app.toast('Project created!', 'success');
        closeProjectModal();
        await loadProjects(document.getElementById('projectsGrid'));
      } catch (err) {
        app.toast(err.message, 'error');
      }
      btn.disabled = false;
    });
  }

  document.getElementById('projectName').value = '';
  document.getElementById('projectDesc').value = '';
  setTimeout(() => overlay.classList.add('active'), 10);
}

function closeProjectModal() {
  const overlay = document.getElementById('projectModal');
  if (overlay) overlay.classList.remove('active');
}

function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
