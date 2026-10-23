/* ============================================================
   product-detail.js — Single Product Page Logic
   ============================================================ */

let currentProduct = null;
let selectedQty = 1;

document.addEventListener('DOMContentLoaded', async () => {
  if (!document.getElementById('productDetailPage')) return;

  const id = parseInt(getParam('id'));
  if (!id) { window.location.href = '/pages/products.html'; return; }

  const products = await loadProducts();
  currentProduct = products.find(p => p.id === id);

  if (!currentProduct) { window.location.href = '/pages/products.html'; return; }

  renderProductDetail(currentProduct);
  renderRelatedProducts(products, currentProduct);
  updateBreadcrumb(currentProduct);
});

/* ─── Render Detail ─── */
function renderProductDetail(p) {
  document.title = `${p.name} — ShopEase`;

  // Images
  const mainImg = document.getElementById('mainProductImage');
  if (mainImg) { mainImg.src = p.images[0]; mainImg.alt = p.name; }

  const thumbsContainer = document.getElementById('thumbImages');
  if (thumbsContainer) {
    thumbsContainer.innerHTML = p.images.map((img, i) => `
      <img src="${img}" alt="${p.name} ${i + 1}" class="${i === 0 ? 'active' : ''}"
        onclick="switchImage(this, '${img}')">`).join('');
  }

  // Info
  setEl('productName', p.name);
  setEl('productCategory', `<a href="/pages/products.html?cat=${encodeURIComponent(p.category)}" class="text-primary-custom">${p.category}</a>`);
  setEl('productRating', renderStars(p.rating));
  setEl('productReviewCount', `(${p.reviews} reviews)`);
  setEl('productPrice', formatPrice(p.price));
  setEl('productOriginalPrice', p.originalPrice ? formatPrice(p.originalPrice) : '');
  setEl('productDiscount', p.discount ? `-${p.discount}% OFF` : '');
  setEl('productDescription', p.description);

  // Stock
  const stockEl = document.getElementById('productStock');
  if (stockEl) {
    if (p.stock > 10) {
      stockEl.innerHTML = `<i class="fas fa-check-circle text-success me-1"></i> In Stock`;
    } else if (p.stock > 0) {
      stockEl.innerHTML = `<i class="fas fa-exclamation-circle text-warning me-1"></i> Only ${p.stock} left!`;
    } else {
      stockEl.innerHTML = `<i class="fas fa-times-circle text-danger me-1"></i> Out of Stock`;
    }
  }

  // Wishlist button
  const wishBtn = document.getElementById('wishlistBtn');
  if (wishBtn) {
    const wishlisted = isWishlisted(p.id);
    wishBtn.innerHTML = wishlisted
      ? `<i class="fas fa-heart text-danger me-1"></i> Wishlisted`
      : `<i class="far fa-heart me-1"></i> Add to Wishlist`;
    wishBtn.classList.toggle('btn-outline-danger', wishlisted);
    wishBtn.classList.toggle('btn-outline-secondary', !wishlisted);
  }

  // Tags
  const tagsEl = document.getElementById('productTags');
  if (tagsEl && p.tags) {
    tagsEl.innerHTML = p.tags.map(t => `<span class="badge bg-light text-secondary border me-1">${t}</span>`).join('');
  }

  // Delivery estimate
  const today = new Date();
  today.setDate(today.getDate() + 3);
  const deliveryDate = today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  setEl('deliveryDate', deliveryDate);

  // Reviews placeholder
  renderReviews(p);
}

/* ─── Image Switcher ─── */
function switchImage(thumb, src) {
  document.getElementById('mainProductImage').src = src;
  document.querySelectorAll('#thumbImages img').forEach(img => img.classList.remove('active'));
  thumb.classList.add('active');
}

/* ─── Quantity ─── */
function changeDetailQty(delta) {
  const max = currentProduct?.stock || 99;
  selectedQty = Math.min(Math.max(1, selectedQty + delta), max);
  const input = document.getElementById('qtyInput');
  if (input) input.value = selectedQty;
}

function qtyInputChange(val) {
  const max = currentProduct?.stock || 99;
  selectedQty = Math.min(Math.max(1, parseInt(val) || 1), max);
  document.getElementById('qtyInput').value = selectedQty;
}

/* ─── Add to Cart from Detail ─── */
function detailAddToCart() {
  if (!currentProduct) return;
  if (currentProduct.stock === 0) { showToast('Sorry, this product is out of stock', 'danger'); return; }
  addToCart(currentProduct, selectedQty);
}

/* ─── Buy Now ─── */
function buyNow() {
  if (!currentProduct) return;
  if (!requireLogin()) return;
  addToCart(currentProduct, selectedQty);
  window.location.href = '/pages/cart.html';
}

/* ─── Wishlist Toggle ─── */
function toggleDetailWishlist() {
  if (!currentProduct) return;
  const isNow = toggleWishlist(currentProduct.id);
  const btn = document.getElementById('wishlistBtn');
  if (btn) {
    btn.innerHTML = isNow
      ? `<i class="fas fa-heart text-danger me-1"></i> Wishlisted`
      : `<i class="far fa-heart me-1"></i> Add to Wishlist`;
    btn.classList.toggle('btn-outline-danger', isNow);
    btn.classList.toggle('btn-outline-secondary', !isNow);
  }
}

/* ─── Related Products ─── */
async function renderRelatedProducts(products, current) {
  const container = document.getElementById('relatedProducts');
  if (!container) return;
  const related = products
    .filter(p => p.category === current.category && p.id !== current.id)
    .slice(0, 4);

  if (related.length === 0) { container.closest('section')?.remove(); return; }

  container.innerHTML = related.map(p => buildProductCard(p)).join('');
}

/* ─── Breadcrumb ─── */
function updateBreadcrumb(p) {
  const bc = document.getElementById('productBreadcrumb');
  if (bc) {
    bc.innerHTML = `
      <li class="breadcrumb-item"><a href="/index.html">Home</a></li>
      <li class="breadcrumb-item"><a href="/pages/products.html">Products</a></li>
      <li class="breadcrumb-item"><a href="/pages/products.html?cat=${encodeURIComponent(p.category)}">${p.category}</a></li>
      <li class="breadcrumb-item active">${p.name.length > 30 ? p.name.substring(0, 30) + '…' : p.name}</li>`;
  }
}

/* ─── Reviews ─── */
function renderReviews(p) {
  const container = document.getElementById('reviewsList');
  if (!container) return;
  const demoReviews = [
    { name: 'Priya S.', rating: 5, comment: 'Excellent product! Exactly as described. Fast delivery too.', date: '2 days ago' },
    { name: 'Rahul M.', rating: 4, comment: 'Good quality for the price. Would recommend to others.', date: '1 week ago' },
    { name: 'Anjali K.', rating: 4, comment: 'Happy with the purchase. Packaging was secure.', date: '2 weeks ago' },
    { name: 'Vikram P.', rating: 5, comment: 'Outstanding! Exceeded my expectations. Will buy again.', date: '1 month ago' },
  ];
  container.innerHTML = demoReviews.map(r => `
    <div class="border-bottom pb-3 mb-3">
      <div class="d-flex justify-content-between align-items-start">
        <div class="d-flex align-items-center gap-2">
          <div class="rounded-circle d-flex align-items-center justify-content-center"
            style="width:38px;height:38px;background:var(--primary-light);color:var(--primary);font-weight:700;font-size:.9rem;">
            ${r.name.charAt(0)}
          </div>
          <div>
            <div class="fw-600">${r.name}</div>
            <div class="small text-muted">${r.date}</div>
          </div>
        </div>
        <div>${renderStars(r.rating)}</div>
      </div>
      <p class="mt-2 mb-0 text-secondary" style="font-size:.9rem;">${r.comment}</p>
    </div>`).join('');
}

function setEl(id, html) { const el = document.getElementById(id); if (el) el.innerHTML = html; }
