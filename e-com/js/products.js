/* ============================================================
   products.js — Product Listing, Filters, Sort, Pagination
   ============================================================ */

const PRODUCTS_PER_PAGE = 8;
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let activeCategory = '';
let activeSort = 'default';
let priceRange = [0, 50000];
let minRating = 0;
let searchQuery = '';

document.addEventListener('DOMContentLoaded', async () => {
  if (!document.getElementById('productGrid')) return;

  showLoader();
  allProducts = await loadProducts();

  // Pre-apply URL params
  searchQuery = getParam('search') || '';
  activeCategory = getParam('cat') || '';

  if (searchQuery) {
    document.getElementById('searchDisplay')?.removeAttribute('style');
    setTextEl('searchTerm', searchQuery);
    const gs = document.getElementById('globalSearch');
    if (gs) gs.value = searchQuery;
  }
  if (activeCategory) {
    const chip = document.querySelector(`.filter-chip[data-cat="${activeCategory}"]`);
    if (chip) chip.classList.add('active');
  }

  applyFilters();
  hideLoader();
  setupEventListeners();
  renderActiveFilters();
});

/* ─── Filter & Sort Logic ─── */
function applyFilters() {
  filteredProducts = allProducts.filter(p => {
    const matchCat = !activeCategory || p.category === activeCategory;
    const matchPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
    const matchRating = p.rating >= minRating;
    const matchSearch = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.tags || []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchPrice && matchRating && matchSearch;
  });

  // Sort
  switch (activeSort) {
    case 'price-asc': filteredProducts.sort((a, b) => a.price - b.price); break;
    case 'price-desc': filteredProducts.sort((a, b) => b.price - a.price); break;
    case 'rating': filteredProducts.sort((a, b) => b.rating - a.rating); break;
    case 'newest': filteredProducts.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)); break;
    case 'discount': filteredProducts.sort((a, b) => b.discount - a.discount); break;
    default: break;
  }

  currentPage = 1;
  renderProducts();
  renderPagination();
  setTextEl('resultCount', `${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''} found`);
}

/* ─── Render Product Grid ─── */
function renderProducts() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;
  const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const page = filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);

  if (page.length === 0) {
    grid.innerHTML = `
      <div class="col-12">
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h4>No products found</h4>
          <p>Try adjusting your filters or search term.</p>
          <button class="btn-primary-custom btn mt-2" onclick="clearAllFilters()">Clear Filters</button>
        </div>
      </div>`;
    return;
  }

  grid.innerHTML = page.map(p => buildProductCard(p)).join('');
}

/* ─── Build Product Card HTML ─── */
function buildProductCard(p) {
  const wishlisted = isWishlisted(p.id);
  return `
    <div class="col-6 col-md-4 col-lg-3 mb-4">
      <div class="product-card h-100">
        <div class="card-img-wrapper">
          <a href="/pages/product-detail.html?id=${p.id}">
            <img src="${p.images[0]}" alt="${p.name}" loading="lazy">
          </a>
          ${p.discount ? `<span class="badge-discount">-${p.discount}%</span>` : ''}
          ${p.isNew ? `<span class="badge-new">NEW</span>` : ''}
          <button class="wishlist-btn ${wishlisted ? 'active' : ''}" onclick="handleWishlist(event, ${p.id})" title="Wishlist">
            <i class="${wishlisted ? 'fas' : 'far'} fa-heart"></i>
          </button>
        </div>
        <div class="card-body d-flex flex-column">
          <div class="card-category">${p.category}</div>
          <a href="/pages/product-detail.html?id=${p.id}" class="text-decoration-none">
            <div class="card-title">${p.name}</div>
          </a>
          <div class="rating">${renderStars(p.rating)} <span>(${p.reviews})</span></div>
          <div class="price-section mt-auto">
            <span class="price-current">${formatPrice(p.price)}</span>
            ${p.originalPrice ? `<span class="price-original">${formatPrice(p.originalPrice)}</span>` : ''}
          </div>
          <button class="btn-cart mt-2" onclick='handleAddToCart(${JSON.stringify(p)})'>
            <i class="fas fa-cart-plus me-1"></i> Add to Cart
          </button>
        </div>
      </div>
    </div>`;
}

function handleAddToCart(product) {
  addToCart(product, 1);
}

function handleWishlist(e, productId) {
  e.preventDefault();
  e.stopPropagation();
  const btn = e.currentTarget;
  const isNowWishlisted = toggleWishlist(productId);
  btn.classList.toggle('active', isNowWishlisted);
  btn.querySelector('i').className = isNowWishlisted ? 'fas fa-heart' : 'far fa-heart';
}

/* ─── Pagination ─── */
function renderPagination() {
  const container = document.getElementById('pagination');
  if (!container) return;
  const total = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  if (total <= 1) { container.innerHTML = ''; return; }

  let html = `<ul class="pagination justify-content-center flex-wrap gap-1">`;
  html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
    <button class="page-link" onclick="goToPage(${currentPage - 1})"><i class="fas fa-chevron-left"></i></button></li>`;
  for (let i = 1; i <= total; i++) {
    html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
      <button class="page-link" onclick="goToPage(${i})">${i}</button></li>`;
  }
  html += `<li class="page-item ${currentPage === total ? 'disabled' : ''}">
    <button class="page-link" onclick="goToPage(${currentPage + 1})"><i class="fas fa-chevron-right"></i></button></li>`;
  html += `</ul>`;
  container.innerHTML = html;
}

function goToPage(page) {
  const total = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  if (page < 1 || page > total) return;
  currentPage = page;
  renderProducts();
  renderPagination();
  window.scrollTo({ top: document.getElementById('productGrid')?.offsetTop - 80, behavior: 'smooth' });
}

/* ─── Event Listeners ─── */
function setupEventListeners() {
  // Category chips
  document.querySelectorAll('.filter-chip[data-cat]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip[data-cat]').forEach(c => c.classList.remove('active'));
      if (activeCategory === chip.dataset.cat) {
        activeCategory = '';
      } else {
        activeCategory = chip.dataset.cat;
        chip.classList.add('active');
      }
      applyFilters();
      renderActiveFilters();
    });
  });

  // Rating chips
  document.querySelectorAll('.filter-chip[data-rating]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip[data-rating]').forEach(c => c.classList.remove('active'));
      const val = parseFloat(chip.dataset.rating);
      if (minRating === val) { minRating = 0; } else { minRating = val; chip.classList.add('active'); }
      applyFilters();
    });
  });

  // Price range
  const priceSlider = document.getElementById('priceRange');
  if (priceSlider) {
    priceSlider.addEventListener('input', debounce(() => {
      priceRange[1] = parseInt(priceSlider.value);
      document.getElementById('priceDisplay').textContent = formatPrice(priceRange[1]);
      applyFilters();
    }, 200));
  }

  // Sort
  const sortEl = document.getElementById('sortSelect');
  if (sortEl) {
    sortEl.addEventListener('change', () => { activeSort = sortEl.value; applyFilters(); });
  }

  // Inline search
  const inlineSearch = document.getElementById('inlineSearch');
  if (inlineSearch) {
    inlineSearch.addEventListener('input', debounce(() => {
      searchQuery = inlineSearch.value.trim();
      applyFilters();
    }, 300));
    inlineSearch.value = searchQuery;
  }
}

/* ─── Active Filters Chips ─── */
function renderActiveFilters() {
  const container = document.getElementById('activeFilters');
  if (!container) return;
  let chips = '';
  if (activeCategory) chips += `<span class="badge bg-primary me-1 py-2 px-3">${activeCategory} <i class="fas fa-times ms-1 cursor-pointer" onclick="removeFilter('cat')"></i></span>`;
  if (searchQuery) chips += `<span class="badge bg-secondary me-1 py-2 px-3">"${searchQuery}" <i class="fas fa-times ms-1 cursor-pointer" onclick="removeFilter('search')"></i></span>`;
  container.innerHTML = chips ? `Active: ${chips} <button class="btn btn-link btn-sm text-danger p-0 ms-2" onclick="clearAllFilters()">Clear all</button>` : '';
}

function removeFilter(type) {
  if (type === 'cat') { activeCategory = ''; document.querySelectorAll('.filter-chip[data-cat]').forEach(c => c.classList.remove('active')); }
  if (type === 'search') { searchQuery = ''; document.getElementById('inlineSearch').value = ''; }
  applyFilters();
  renderActiveFilters();
}

function clearAllFilters() {
  activeCategory = ''; activeSort = 'default'; priceRange = [0, 50000]; minRating = 0; searchQuery = '';
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  const sortEl = document.getElementById('sortSelect');
  if (sortEl) sortEl.value = 'default';
  const priceSlider = document.getElementById('priceRange');
  if (priceSlider) { priceSlider.value = 50000; document.getElementById('priceDisplay').textContent = '₹50,000'; }
  const inlineSearch = document.getElementById('inlineSearch');
  if (inlineSearch) inlineSearch.value = '';
  applyFilters();
  renderActiveFilters();
}

/* ─── Loader ─── */
function showLoader() {
  document.getElementById('productGrid').innerHTML = Array(8).fill(`
    <div class="col-6 col-md-4 col-lg-3 mb-4">
      <div class="product-card h-100 p-0">
        <div class="card-img-wrapper bg-light shimmer" style="height:220px"></div>
        <div class="card-body"><div class="bg-light shimmer rounded mb-2" style="height:14px;width:60%"></div>
        <div class="bg-light shimmer rounded mb-2" style="height:18px;width:90%"></div>
        <div class="bg-light shimmer rounded" style="height:14px;width:40%"></div></div>
      </div>
    </div>`).join('');
}
function hideLoader() {}
function setTextEl(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
