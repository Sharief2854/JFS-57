/* ============================================================
   auth.js — Login, Register, Session Management
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  // Register form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) registerForm.addEventListener('submit', handleRegister);

  // Redirect if already logged in
  if ((loginForm || registerForm) && getCurrentUser()) {
    const redirect = getParam('redirect') || '/index.html';
    window.location.href = redirect;
  }

  // Password toggle
  document.querySelectorAll('.toggle-pass').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.querySelector(btn.dataset.target);
      if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
        btn.querySelector('i').classList.toggle('fa-eye');
        btn.querySelector('i').classList.toggle('fa-eye-slash');
      }
    });
  });
});

/* ─── Login ─── */
function handleLogin(e) {
  e.preventDefault();
  clearErrors();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  let valid = true;

  if (!validateEmail(email)) {
    showFieldError('loginEmail', 'Enter a valid email address');
    valid = false;
  }
  if (password.length < 6) {
    showFieldError('loginPassword', 'Password must be at least 6 characters');
    valid = false;
  }
  if (!valid) return;

  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === hashSimple(password));

  if (!user) {
    showToast('Invalid email or password', 'danger');
    return;
  }

  const sessionUser = { id: user.id, name: user.name, email: user.email };
  localStorage.setItem('ecom_user', JSON.stringify(sessionUser));
  showToast(`Welcome back, ${user.name.split(' ')[0]}! 👋`, 'success');

  setTimeout(() => {
    const redirect = getParam('redirect') || '/index.html';
    window.location.href = redirect;
  }, 800);
}

/* ─── Register ─── */
function handleRegister(e) {
  e.preventDefault();
  clearErrors();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regConfirm').value;
  let valid = true;

  if (name.length < 2) {
    showFieldError('regName', 'Name must be at least 2 characters');
    valid = false;
  }
  if (!validateEmail(email)) {
    showFieldError('regEmail', 'Enter a valid email address');
    valid = false;
  }
  if (password.length < 6) {
    showFieldError('regPassword', 'Password must be at least 6 characters');
    valid = false;
  }
  if (password !== confirm) {
    showFieldError('regConfirm', 'Passwords do not match');
    valid = false;
  }
  if (!valid) return;

  const users = getUsers();
  if (users.find(u => u.email === email)) {
    showFieldError('regEmail', 'Email already registered. Try logging in.');
    return;
  }

  const newUser = {
    id: Date.now(),
    name,
    email,
    password: hashSimple(password),
    createdAt: new Date().toISOString(),
    orders: [],
    wishlist: []
  };
  users.push(newUser);
  localStorage.setItem('ecom_users', JSON.stringify(users));

  const sessionUser = { id: newUser.id, name: newUser.name, email: newUser.email };
  localStorage.setItem('ecom_user', JSON.stringify(sessionUser));
  showToast(`Account created! Welcome, ${name.split(' ')[0]}! 🎉`, 'success');

  setTimeout(() => {
    window.location.href = '/index.html';
  }, 800);
}

/* ─── Profile Page ─── */
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('profilePage')) return;
  const user = getCurrentUser();
  if (!user) { window.location.href = '/pages/login.html'; return; }
  renderProfile(user);
  renderOrders();
  renderWishlistPage();

  // Handle tab from URL hash
  const hash = window.location.hash;
  if (hash) {
    const tab = document.querySelector(`[data-bs-target="${hash}-tab-pane"], [href="${hash}"]`);
    if (tab) tab.click();
  }

  // Profile update form
  document.getElementById('updateProfileForm')?.addEventListener('submit', updateProfile);
});

function renderProfile(user) {
  setTextEl('profileName', user.name);
  setTextEl('profileEmail', user.email);
  setValEl('editName', user.name);
  setValEl('editEmail', user.email);
  const avatar = document.getElementById('profileAvatar');
  if (avatar) avatar.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=6c63ff&fontFamily=Poppins`;
}

function renderOrders() {
  const container = document.getElementById('ordersContainer');
  if (!container) return;
  const orders = JSON.parse(localStorage.getItem('ecom_orders') || '[]')
    .filter(o => o.userId === getCurrentUser()?.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (orders.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">📦</div><h4>No orders yet</h4><p>When you place an order, it will appear here.</p><a href="/pages/products.html" class="btn-primary-custom btn mt-2">Start Shopping</a></div>`;
    return;
  }

  container.innerHTML = orders.map(order => `
    <div class="order-card">
      <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
        <div>
          <div class="fw-700">Order #${order.id}</div>
          <div class="text-muted small">${new Date(order.date).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}</div>
        </div>
        <span class="order-status status-${order.status.toLowerCase()}">${order.status}</span>
      </div>
      <hr class="my-2">
      <div class="d-flex justify-content-between align-items-center">
        <div class="small text-muted">${order.items.length} item${order.items.length !== 1 ? 's' : ''}: ${order.items.map(i => i.name).join(', ').substring(0, 60)}…</div>
        <div class="fw-700 text-primary-custom">${formatPrice(order.total)}</div>
      </div>
    </div>`).join('');
}

async function renderWishlistPage() {
  const container = document.getElementById('wishlistContainer');
  if (!container) return;
  const ids = getWishlist();
  if (ids.length === 0) {
    container.innerHTML = `<div class="empty-state col-12"><div class="empty-icon">❤️</div><h4>Your wishlist is empty</h4><p>Save products you love by clicking the heart icon.</p><a href="/pages/products.html" class="btn-primary-custom btn mt-2">Explore Products</a></div>`;
    return;
  }
  const allProducts = await loadProducts();
  const products = allProducts.filter(p => ids.includes(p.id));
  container.innerHTML = products.map(p => buildProductCard(p)).join('');
}

function updateProfile(e) {
  e.preventDefault();
  const user = getCurrentUser();
  const name = document.getElementById('editName').value.trim();
  if (!user || !name) return;
  user.name = name;
  localStorage.setItem('ecom_user', JSON.stringify(user));
  // Update in users array too
  const users = getUsers();
  const idx = users.findIndex(u => u.id === user.id);
  if (idx > -1) { users[idx].name = name; localStorage.setItem('ecom_users', JSON.stringify(users)); }
  renderProfile(user);
  showToast('Profile updated successfully!', 'success');
}

/* ─── Helpers ─── */
function getUsers() {
  return JSON.parse(localStorage.getItem('ecom_users') || '[]');
}

function hashSimple(str) {
  // Simple non-cryptographic hash for demo purposes
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showFieldError(fieldId, msg) {
  const field = document.getElementById(fieldId);
  if (field) {
    field.classList.add('is-invalid');
    const fb = field.nextElementSibling;
    if (fb && fb.classList.contains('invalid-feedback')) fb.textContent = msg;
  }
}

function clearErrors() {
  document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
}

function setTextEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function setValEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}
