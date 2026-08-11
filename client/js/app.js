// shared utils across pages

const app = {
  user: null,

  init() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') document.body.classList.add('dark-theme');

    const stored = localStorage.getItem('user');
    if (stored) {
      try { this.user = JSON.parse(stored); } catch (e) { /* corrupted */ }
    }

    if (!this.user && !window.location.pathname.includes('login') && !window.location.pathname.includes('signup')) {
      window.location.href = '/login.html';
      return false;
    }

    this.renderSidebar();
    this.setupMobileNav();

    document.addEventListener("mousemove", e => {
      document.querySelectorAll(".card, .project-card, .stat-card").forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty("--mouse-x", `${x}px`);
        card.style.setProperty("--mouse-y", `${y}px`);
      });
    });

    return true;
  },

  isAdmin() {
    return this.user && this.user.role === 'admin';
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
  },

  renderSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';

    sidebar.innerHTML = `
      <div class="sidebar-logo">
        <h2>TaskFlow</h2>
        <span>Team Task Manager</span>
      </div>
      <nav class="sidebar-nav">
        <a href="/dashboard.html" class="nav-item ${currentPage === 'dashboard.html' ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          Dashboard
        </a>
        <a href="/projects.html" class="nav-item ${currentPage === 'projects.html' || currentPage === 'project-detail.html' ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
          Projects
        </a>
        ${this.isAdmin() ? `
        <a href="/team.html" class="nav-item ${currentPage === 'team.html' ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          Team
        </a>
        ` : ''}
      </nav>
      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">${this.user ? this.user.name.charAt(0).toUpperCase() : '?'}</div>
          <div class="user-details">
            <div class="name">${this.user ? this.user.name : 'Unknown'}</div>
            <div class="role">${this.user ? this.user.role : ''}</div>
          </div>
        </div>
        <button class="btn btn-secondary btn-sm btn-block mt-16" onclick="app.toggleTheme()" id="themeToggleBtn">
          ${document.body.classList.contains('dark-theme') ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
        <button class="btn btn-secondary btn-sm btn-block mt-16" onclick="app.logout()" id="logoutBtn">Sign Out</button>
      </div>
    `;
  },

  toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    const btn = document.getElementById('themeToggleBtn');
    if (btn) btn.innerHTML = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
  },

  setupMobileNav() {
    const toggle = document.querySelector('.mobile-toggle');
    const sidebar = document.getElementById('sidebar');
    if (toggle && sidebar) {
      toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
      document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
          sidebar.classList.remove('open');
        }
      });
    }
  },

  toast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
  },

  showLoader(target) {
    target.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  },

  formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },

  isOverdue(dateStr) {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dateStr) < today;
  },

  statusLabel(status) {
    const map = { 'todo': 'To Do', 'in-progress': 'In Progress', 'done': 'Done' };
    return map[status] || status;
  },

  statusBadgeClass(status) {
    const map = { 'todo': 'badge-todo', 'in-progress': 'badge-progress', 'done': 'badge-done' };
    return map[status] || '';
  },

  priorityBadgeClass(priority) {
    const map = { 'low': 'badge-low', 'medium': 'badge-medium', 'high': 'badge-high' };
    return map[priority] || '';
  }
};
