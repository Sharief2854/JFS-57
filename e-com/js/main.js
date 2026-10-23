/* ============================================================
   ShopEase — Global Utilities (main.js)
   ============================================================ */

/* ─── Shared HTML Partials ─── */
const ROOT = window.location.pathname.includes('/pages/') ? '..' : '.';
const NAVBAR_HTML = `
<nav class="navbar navbar-expand-lg sticky-top">
  <div class="container">
    <a class="navbar-brand" href="${ROOT}/index.html">Shop<span>Ease</span></a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navMenu">
      <form class="search-form d-flex mx-auto my-2 my-lg-0" style="width:340px" onsubmit="handleSearch(event)">
        <input class="form-control" type="search" id="globalSearch" placeholder="Search products…">
        <button class="btn btn-search" type="submit"><i class="fas fa-search"></i></button>
      </form>
      <ul class="navbar-nav ms-auto align-items-center gap-1">
        <li class="nav-item"><a class="nav-link" href="${ROOT}/index.html">Home</a></li>
        <li class="nav-item"><a class="nav-link" href="${ROOT}/pages/products.html">Products</a></li>
        <li class="nav-item">
          <a class="cart-icon position-relative nav-link" href="${ROOT}/pages/cart.html">
            <i class="fas fa-shopping-cart"></i>
            <span class="cart-badge" id="cartBadge">0</span>
          </a>
        </li>
        <li class="nav-item" id="authNavItem">
          <a class="btn-auth nav-link" href="${ROOT}/pages/login.html">Login</a>
        </li>
        <li class="nav-item dropdown d-none" id="userDropdown">
          <a class="nav-link dropdown-toggle d-flex align-items-center gap-1" href="#" data-bs-toggle="dropdown">
            <i class="fas fa-user-circle fs-5"></i>
            <span id="navUsername" class="fw-600 small"></span>
          </a>
          <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3">
            <li><a class="dropdown-item" href="${ROOT}/pages/profile.html"><i class="fas fa-user me-2"></i>My Profile</a></li>
            <li><a class="dropdown-item" href="${ROOT}/pages/profile.html#orders"><i class="fas fa-box me-2"></i>My Orders</a></li>
            <li><a class="dropdown-item" href="${ROOT}/pages/profile.html#wishlist"><i class="fas fa-heart me-2"></i>Wishlist</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item text-danger" href="#" onclick="logout()"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
          </ul>
        </li>
      </ul>
    </div>
  </div>
</nav>`;

const FOOTER_HTML = `
<footer class="footer mt-5">
  <div class="container">
    <div class="row g-4">
      <div class="col-lg-3 col-md-6">
        <h5>Shop<span style="color:var(--secondary)">Ease</span></h5>
        <p style="color:#aaa;font-size:.9rem;">Your one-stop destination for quality products at unbeatable prices. Shop smart, shop easy.</p>
        <div class="social-icons mt-3">
          <a href="#"><i class="fab fa-facebook-f"></i></a>
          <a href="#"><i class="fab fa-instagram"></i></a>
          <a href="#"><i class="fab fa-twitter"></i></a>
          <a href="#"><i class="fab fa-youtube"></i></a>
        </div>
      </div>
      <div class="col-lg-2 col-md-6">
        <h5>Quick Links</h5>
        <a href="${ROOT}/index.html">Home</a>
        <a href="${ROOT}/pages/products.html">All Products</a>
        <a href="${ROOT}/pages/cart.html">Cart</a>
        <a href="${ROOT}/pages/profile.html">My Account</a>
      </div>
      <div class="col-lg-2 col-md-6">
        <h5>Categories</h5>
        <a href="${ROOT}/pages/products.html?cat=Electronics">Electronics</a>
        <a href="${ROOT}/pages/products.html?cat=Clothing">Clothing</a>
        <a href="${ROOT}/pages/products.html?cat=Books">Books</a>
        <a href="${ROOT}/pages/products.html?cat=Home & Kitchen">Home & Kitchen</a>
        <a href="${ROOT}/pages/products.html?cat=Sports">Sports</a>
      </div>
      <div class="col-lg-2 col-md-6">
        <h5>Support</h5>
        <a href="#">FAQ</a>
        <a href="#">Shipping Policy</a>
        <a href="#">Return Policy</a>
        <a href="#">Privacy Policy</a>
        <a href="#">Contact Us</a>
      </div>
      <div class="col-lg-3 col-md-6">
        <h5>Newsletter</h5>
        <p style="color:#aaa;font-size:.85rem;">Subscribe for exclusive deals and offers.</p>
        <form class="newsletter-form d-flex" onsubmit="subscribeNewsletter(event)">
          <input class="form-control" type="email" placeholder="Enter email…">
          <button class="btn" type="submit"><i class="fas fa-paper-plane"></i></button>
        </form>
        <div class="mt-3" style="color:#aaa;font-size:.82rem;">
          <i class="fas fa-shield-alt me-1"></i> Secure Payments &nbsp;
          <i class="fas fa-truck me-1 ms-2"></i> Free Shipping ₹999+
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <p class="mb-0">&copy; ${new Date().getFullYear()} ShopEase. All rights reserved. Made with <span style="color:var(--secondary)">❤</span> in India.</p>
    </div>
  </div>
</footer>
<button id="backToTop" onclick="scrollToTop()" title="Back to top"><i class="fas fa-chevron-up"></i></button>
<!-- Toast Container -->
<div class="toast-container position-fixed bottom-0 end-0 p-3" id="toastContainer"></div>`;

/* ─── Init on DOM Ready ─── */
document.addEventListener('DOMContentLoaded', () => {
  injectNavbar();
  injectFooter();
  updateCartBadge();
  updateAuthNav();
  highlightActiveNav();
  initBackToTop();
});

/* ─── Navbar ─── */
function injectNavbar() {
  const el = document.getElementById('navbar-placeholder');
  if (el) el.innerHTML = NAVBAR_HTML;
}

/* ─── Footer ─── */
function injectFooter() {
  const el = document.getElementById('footer-placeholder');
  if (el) el.innerHTML = FOOTER_HTML;
}

/* ─── Highlight active nav link ─── */
function highlightActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href && path.includes(href.split('/').pop().split('?')[0]) && href !== '/index.html') {
      link.classList.add('active');
    }
    if ((path === '/' || path.endsWith('index.html')) && href === '/index.html') {
      link.classList.add('active');
    }
  });
}

/* ─── Cart Badge ─── */
function updateCartBadge() {
  const cart = getCart();
  const total = cart.reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll('#cartBadge').forEach(el => {
    el.textContent = total;
    el.style.display = total > 0 ? 'flex' : 'none';
  });
}

/* ─── Auth Nav ─── */
function updateAuthNav() {
  const user = getCurrentUser();
  const authItem = document.getElementById('authNavItem');
  const userDropdown = document.getElementById('userDropdown');
  const navUsername = document.getElementById('navUsername');
  if (user && authItem && userDropdown) {
    authItem.classList.add('d-none');
    userDropdown.classList.remove('d-none');
    if (navUsername) navUsername.textContent = user.name.split(' ')[0];
  }
}

/* ─── Toast Notification ─── */
function showToast(message, type = 'success', duration = 3000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const id = 'toast-' + Date.now();
  const icons = { success: 'fa-check-circle', danger: 'fa-times-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
  const html = `
    <div id="${id}" class="toast custom-toast align-items-center text-white bg-${type} border-0" role="alert" style="min-width:280px">
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center gap-2">
          <i class="fas ${icons[type] || icons.info}"></i>
          <span>${message}</span>
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>`;
  container.insertAdjacentHTML('beforeend', html);
  const toastEl = document.getElementById(id);
  const toast = new bootstrap.Toast(toastEl, { delay: duration });
  toast.show();
  toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

/* ─── Cart Helpers ─── */
function getCart() {
  return JSON.parse(localStorage.getItem('ecom_cart') || '[]');
}
function saveCart(cart) {
  localStorage.setItem('ecom_cart', JSON.stringify(cart));
  updateCartBadge();
}

/* ─── Auth Helpers ─── */
function getCurrentUser() {
  return JSON.parse(localStorage.getItem('ecom_user') || 'null');
}
function logout() {
  localStorage.removeItem('ecom_user');
  showToast('Logged out successfully', 'info');
  setTimeout(() => window.location.href = `${ROOT}/index.html`, 800);
}
function requireLogin() {
  if (!getCurrentUser()) {
    window.location.href = `${ROOT}/pages/login.html?redirect=` + encodeURIComponent(window.location.pathname);
    return false;
  }
  return true;
}

/* ─── Product Helpers ─── */
let _products = null;
async function loadProducts() {
  if (_products) return _products;
  // Resolve path relative to current page location
  const isInPages = window.location.pathname.includes('/pages/');
  const base = isInPages ? '../js/data/products.json' : 'js/data/products.json';
  const res = await fetch(base);
  _products = await res.json();
  return _products;
}

/* ─── Format Currency ─── */
function formatPrice(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN');
}

/* ─── Star Rating HTML ─── */
function renderStars(rating) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      html += '<i class="fas fa-star text-warning"></i>';
    } else if (i - rating < 1) {
      html += '<i class="fas fa-star-half-alt text-warning"></i>';
    } else {
      html += '<i class="far fa-star text-warning"></i>';
    }
  }
  return html;
}

/* ─── Wishlist ─── */
function getWishlist() {
  return JSON.parse(localStorage.getItem('ecom_wishlist') || '[]');
}
function toggleWishlist(productId) {
  const list = getWishlist();
  const idx = list.indexOf(productId);
  if (idx > -1) {
    list.splice(idx, 1);
    showToast('Removed from wishlist', 'info');
  } else {
    list.push(productId);
    showToast('Added to wishlist! ❤', 'danger');
  }
  localStorage.setItem('ecom_wishlist', JSON.stringify(list));
  return list.includes(productId);
}
function isWishlisted(productId) {
  return getWishlist().includes(productId);
}

/* ─── Search ─── */
function handleSearch(e) {
  e.preventDefault();
  const q = document.getElementById('globalSearch')?.value.trim();
  if (q) window.location.href = `${ROOT}/pages/products.html?search=${encodeURIComponent(q)}`;
}

/* ─── Newsletter ─── */
function subscribeNewsletter(e) {
  e.preventDefault();
  showToast('🎉 Subscribed! Check your email for a discount code.', 'success');
  e.target.reset();
}

/* ─── Back to Top ─── */
function initBackToTop() {
  window.addEventListener('scroll', () => {
    const btn = document.getElementById('backToTop');
    if (btn) btn.classList.toggle('show', window.scrollY > 400);
  });
}
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ─── URL Params Helper ─── */
function getParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

/* ─── Debounce ─── */
function debounce(fn, delay = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}
