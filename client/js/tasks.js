let currentProject = null;
let projectMembers = [];
let allUsers = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (!app.init()) return;

  const params = new URLSearchParams(window.location.search);
  const projectId = params.get('id');
  if (!projectId) {
    window.location.href = '/projects.html';
    return;
  }

  try {
    const [projData, usersData] = await Promise.all([
      api.get(`/projects/${projectId}`),
      api.get('/auth/users')
    ]);
    currentProject = projData.project;
    allUsers = usersData.users;
    projectMembers = currentProject.members || [];

    renderProjectHeader();
    await loadTasks();
  } catch (err) {
    app.toast(err.message, 'error');
  }
});

function renderProjectHeader() {
  const header = document.getElementById('projectHeader');
  const isOwner = currentProject.owner_id === app.user.id || app.isAdmin();

  header.innerHTML = `
    <div>
      <h1>${escHtml(currentProject.name)}</h1>
      <p style="color:var(--text-muted);margin-top:4px">${escHtml(currentProject.description || '')}</p>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      ${isOwner ? `<button class="btn btn-secondary btn-sm" onclick="openMembersModal()">👥 Members (${projectMembers.length})</button>` : `<span class="badge badge-member" style="padding:8px 14px">👥 ${projectMembers.length} members</span>`}
      <button class="btn btn-primary btn-sm" onclick="openTaskModal()">+ Add Task</button>
    </div>`;
}

async function loadTasks() {
  const container = document.getElementById('taskColumns');
  app.showLoader(container);

  try {
    const data = await api.get(`/tasks/project/${currentProject.id}`);
    renderTaskColumns(data.tasks, container);
  } catch (err) {
    app.toast(err.message, 'error');
  }
}

function renderTaskColumns(tasks, container) {
  const groups = { 'todo': [], 'in-progress': [], 'done': [] };
  tasks.forEach(t => {
    if (groups[t.status]) groups[t.status].push(t);
  });

  container.innerHTML = Object.entries(groups).map(([status, items]) => `
    <div class="task-column">
      <div class="task-column-header">
        <h3><span class="badge ${app.statusBadgeClass(status)}">${app.statusLabel(status)}</span></h3>
        <span class="column-count">${items.length}</span>
      </div>
      ${items.length === 0 ? '<div class="empty-state"><p>No tasks</p></div>' :
        items.map(t => renderTaskCard(t)).join('')}
    </div>
  `).join('');
}

function renderTaskCard(task) {
  const overdue = task.status !== 'done' && app.isOverdue(task.due_date);
  return `
    <div class="task-card" onclick="openTaskDetail(${task.id})">
      <div class="task-title">${escHtml(task.title)}</div>
      <div class="task-meta">
        <span class="badge ${app.priorityBadgeClass(task.priority)}">${task.priority}</span>
        ${task.due_date ? `<span style="font-size:0.75rem;color:${overdue ? 'var(--danger)' : 'var(--text-muted)'}">${overdue ? '⚠ ' : ''}${app.formatDate(task.due_date)}</span>` : ''}
      </div>
      ${task.assignee ? `<div style="margin-top:8px;font-size:0.78rem;color:var(--text-muted)">→ ${task.assignee.name}</div>` : ''}
    </div>`;
}

// --- Task Modal ---
function openTaskModal(existing) {
  let overlay = document.getElementById('taskModal');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'taskModal';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <h2 id="taskModalTitle">New Task</h2>
        <form id="taskForm">
          <input type="hidden" id="taskId">
          <div class="form-group">
            <label for="taskTitle">Title</label>
            <input type="text" id="taskTitle" placeholder="What needs to be done?" required>
          </div>
          <div class="form-group">
            <label for="taskDesc">Description</label>
            <textarea id="taskDesc" placeholder="Details..."></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="taskStatus">Status</label>
              <select id="taskStatus">
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div class="form-group">
              <label for="taskPriority">Priority</label>
              <select id="taskPriority">
                <option value="low">Low</option>
                <option value="medium" selected>Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="taskAssignee">Assign To</label>
              <select id="taskAssignee">
                <option value="">Unassigned</option>
              </select>
            </div>
            <div class="form-group">
              <label for="taskDue">Due Date</label>
              <input type="date" id="taskDue">
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-danger btn-sm" id="deleteTaskBtn" style="display:none;margin-right:auto" onclick="deleteCurrentTask()">Delete</button>
            <button type="button" class="btn btn-secondary" onclick="closeTaskModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" id="taskSubmitBtn">Create Task</button>
          </div>
        </form>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeTaskModal(); });

    document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);
  }

  // populate assignee dropdown with project members
  const assigneeSelect = document.getElementById('taskAssignee');
  assigneeSelect.innerHTML = '<option value="">Unassigned</option>';
  projectMembers.forEach(m => {
    assigneeSelect.innerHTML += `<option value="${m.id}">${m.name}</option>`;
  });

  // fill form if editing
  if (existing) {
    document.getElementById('taskModalTitle').textContent = 'Edit Task';
    document.getElementById('taskSubmitBtn').textContent = 'Save Changes';
    document.getElementById('deleteTaskBtn').style.display = 'inline-flex';
    document.getElementById('taskId').value = existing.id;
    document.getElementById('taskTitle').value = existing.title;
    document.getElementById('taskDesc').value = existing.description || '';
    document.getElementById('taskStatus').value = existing.status;
    document.getElementById('taskPriority').value = existing.priority;
    document.getElementById('taskAssignee').value = existing.assigned_to || '';
    document.getElementById('taskDue').value = existing.due_date || '';
  } else {
    document.getElementById('taskModalTitle').textContent = 'New Task';
    document.getElementById('taskSubmitBtn').textContent = 'Create Task';
    document.getElementById('deleteTaskBtn').style.display = 'none';
    document.getElementById('taskId').value = '';
    document.getElementById('taskForm').reset();
  }

  setTimeout(() => overlay.classList.add('active'), 10);
}

function closeTaskModal() {
  const overlay = document.getElementById('taskModal');
  if (overlay) overlay.classList.remove('active');
}

async function handleTaskSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('taskSubmitBtn');
  btn.disabled = true;

  const taskId = document.getElementById('taskId').value;
  const payload = {
    title: document.getElementById('taskTitle').value.trim(),
    description: document.getElementById('taskDesc').value.trim(),
    status: document.getElementById('taskStatus').value,
    priority: document.getElementById('taskPriority').value,
    assignedTo: document.getElementById('taskAssignee').value || null,
    dueDate: document.getElementById('taskDue').value || null,
    projectId: currentProject.id
  };

  try {
    if (taskId) {
      await api.put(`/tasks/${taskId}`, payload);
      app.toast('Task updated', 'success');
    } else {
      await api.post('/tasks', payload);
      app.toast('Task created', 'success');
    }
    closeTaskModal();
    await loadTasks();
  } catch (err) {
    app.toast(err.message, 'error');
  }
  btn.disabled = false;
}

async function openTaskDetail(taskId) {
  try {
    const data = await api.get(`/tasks/${taskId}`);
    openTaskModal(data.task);
  } catch (err) {
    app.toast(err.message, 'error');
  }
}

async function deleteCurrentTask() {
  const taskId = document.getElementById('taskId').value;
  if (!taskId || !confirm('Delete this task?')) return;

  try {
    await api.delete(`/tasks/${taskId}`);
    app.toast('Task deleted', 'success');
    closeTaskModal();
    await loadTasks();
  } catch (err) {
    app.toast(err.message, 'error');
  }
}

// --- Members Modal ---
function openMembersModal() {
  let overlay = document.getElementById('membersModal');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'membersModal';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <h2>Team Members</h2>
        <div class="form-group" style="margin-bottom:20px">
          <label for="addMemberSelect">Add Member</label>
          <div style="display:flex;gap:8px">
            <select id="addMemberSelect" style="flex:1"></select>
            <button class="btn btn-primary btn-sm" onclick="addMember()">Add</button>
          </div>
        </div>
        <div id="membersList" class="member-list"></div>
        <div class="modal-actions">
          <button class="btn btn-secondary" onclick="closeMembersModal()">Close</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeMembersModal(); });
  }

  // populate add dropdown (exclude existing members)
  const memberIds = new Set(projectMembers.map(m => m.id));
  const addSelect = document.getElementById('addMemberSelect');
  addSelect.innerHTML = '<option value="">Select user...</option>';
  allUsers.filter(u => !memberIds.has(u.id)).forEach(u => {
    addSelect.innerHTML += `<option value="${u.id}">${u.name} (${u.email})</option>`;
  });

  renderMembersList();
  setTimeout(() => overlay.classList.add('active'), 10);
}

function closeMembersModal() {
  const overlay = document.getElementById('membersModal');
  if (overlay) overlay.classList.remove('active');
}

function renderMembersList() {
  const list = document.getElementById('membersList');
  list.innerHTML = projectMembers.map(m => `
    <div class="member-item">
      <div class="member-info">
        <div class="member-avatar">${m.name.charAt(0).toUpperCase()}</div>
        <div>
          <div style="font-size:0.9rem;font-weight:500">${m.name}</div>
          <div style="font-size:0.75rem;color:var(--text-muted)">${m.email}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="badge badge-${m.role || 'member'}">${m.role || 'member'}</span>
        ${m.id !== currentProject.owner_id ? `<button class="btn btn-danger btn-sm" onclick="removeMember(${m.id})" title="Remove">✕</button>` : '<span class="badge badge-admin">Owner</span>'}
      </div>
    </div>
  `).join('');
}

async function addMember() {
  const select = document.getElementById('addMemberSelect');
  const userId = select.value;
  if (!userId) return;

  try {
    const data = await api.post(`/projects/${currentProject.id}/members`, { userId: parseInt(userId) });
    projectMembers = data.members;
    renderMembersList();
    renderProjectHeader();
    openMembersModal(); // refresh dropdown
    app.toast('Member added', 'success');
  } catch (err) {
    app.toast(err.message, 'error');
  }
}

async function removeMember(userId) {
  if (!confirm('Remove this member?')) return;
  try {
    await api.delete(`/projects/${currentProject.id}/members/${userId}`);
    projectMembers = projectMembers.filter(m => m.id !== userId);
    renderMembersList();
    renderProjectHeader();
    openMembersModal();
    app.toast('Member removed', 'success');
  } catch (err) {
    app.toast(err.message, 'error');
  }
}

function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
