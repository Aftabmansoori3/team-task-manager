document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = loginForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Signing in...';

      try {
        const data = await api.post('/auth/login', {
          email: document.getElementById('email').value.trim(),
          password: document.getElementById('password').value
        });

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/dashboard.html';
      } catch (err) {
        showAuthError(loginForm, err.message);
        btn.disabled = false;
        btn.textContent = 'Sign In';
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = signupForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Creating account...';

      const password = document.getElementById('password').value;
      const confirm = document.getElementById('confirmPassword').value;

      if (password !== confirm) {
        showAuthError(signupForm, 'Passwords do not match');
        btn.disabled = false;
        btn.textContent = 'Create Account';
        return;
      }

      try {
        const data = await api.post('/auth/register', {
          name: document.getElementById('name').value.trim(),
          email: document.getElementById('email').value.trim(),
          password,
          role: document.getElementById('role').value
        });

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/dashboard.html';
      } catch (err) {
        showAuthError(signupForm, err.message);
        btn.disabled = false;
        btn.textContent = 'Create Account';
      }
    });
  }
});

function showAuthError(form, msg) {
  let errDiv = form.querySelector('.auth-error');
  if (!errDiv) {
    errDiv = document.createElement('div');
    errDiv.className = 'auth-error';
    errDiv.style.cssText = 'color: var(--danger); font-size: 0.85rem; margin-bottom: 16px; padding: 10px; background: rgba(239,68,68,0.1); border-radius: 8px; text-align: center;';
    form.prepend(errDiv);
  }
  errDiv.textContent = msg;
}
