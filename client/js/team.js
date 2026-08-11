document.addEventListener('DOMContentLoaded', () => {
  if (!app.init()) return;

  if (!app.isAdmin()) {
    app.toast('Access denied', 'error');
    window.location.href = '/dashboard.html';
    return;
  }

  loadTeamStats();
});

async function loadTeamStats() {
  const teamList = document.getElementById('teamList');
  if (!teamList) return;

  try {
    const data = await api.get('/auth/team-stats');
    const users = data.teamStats;

    if (users.length === 0) {
      teamList.innerHTML = '<div class="empty-state">No team members found</div>';
      return;
    }

    teamList.innerHTML = users.map(user => {
      const { total, completed, inProgress, todo } = user.stats;
      const progressPercent = total === 0 ? 0 : Math.round((completed / total) * 100);
      const initial = user.name.charAt(0).toUpperCase();
      
      const badgeClass = user.role === 'admin' ? 'badge-high' : 'badge-progress';
      
      return `
        <div class="team-card premium-hover">
          <div class="team-card-header">
            <div class="team-avatar-wrapper">
              <div class="team-avatar gradient-bg">${initial}</div>
            </div>
            <div class="team-user-details">
              <h3>${user.name}</h3>
              <span class="user-email">${user.email}</span>
            </div>
            <div class="team-role-badge badge ${badgeClass}">${user.role.toUpperCase()}</div>
          </div>
          
          <div class="team-stats-container">
            <div class="stat-box">
              <span class="stat-label">Total</span>
              <span class="stat-value text-muted">${total}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Done</span>
              <span class="stat-value text-success">${completed}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Active</span>
              <span class="stat-value text-primary">${inProgress}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Todo</span>
              <span class="stat-value text-warning">${todo}</span>
            </div>
          </div>
          
          <div class="team-progress-section">
            <div class="progress-header">
              <span class="progress-title">Completion Rate</span>
              <span class="progress-percent">${progressPercent}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill glow-effect" style="width: ${progressPercent}%"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
  } catch (err) {
    console.error(err);
    teamList.innerHTML = '<div class="empty-state">Failed to load team data</div>';
    app.toast(err.message, 'error');
  }
}
