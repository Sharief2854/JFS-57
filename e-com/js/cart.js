/* ============================================================
   cart.js — Cart CRUD, totals, render
   ============================================================ */

const SHIPPING_THRESHOLD = 999;
const SHIPPING_COST = 99;

/* ─── Read / Write ─── */
function getCart() {
  return JSON.parse(localStorage.getItem('ecom_cart') || '[]');
}
function saveCart(cart) {
  localStorage.setItem('ecom_cart', JSON.stringify(cart));
  updateCartBadge();
}

/* ─── Add to Cart ─── */
function addToCart(product, qty = 1) {
  const cart = getCart();
  const existing = cart.find(i => i.id === product.id);
  if (existing) {
    existing.qty = Math.min(existing.qty + qty, product.stock || 99);
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      stock: product.stock,
      category: product.category,
      qty: qty
    });
  }
  saveCart(cart);
  showToast(`"${product.name}" added to cart 🛒`, 'success');
  updateCartBadge();
}

/* ─── Remove ─── */
function removeFromCart(productId) {
  const cart = getCart().filter(i => i.id !== productId);
  saveCart(cart);
}

/* ─── Update Qty ─── */
function updateCartQty(productId, qty) {
  const cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (item) {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    item.qty = Math.min(qty, item.stock || 99);
    saveCart(cart);
  }
}

/* ─── Clear Cart ─── */
function clearCart() {
  localStorage.removeItem('ecom_cart');
  updateCartBadge();
}

/* ─── Totals ─── */
function getCartSubtotal() {
  return getCart().reduce((s, i) => s + i.price * i.qty, 0);
}
function getShipping(subtotal) {
  return subtotal >= SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_COST;
}
function getDiscount(subtotal, coupon) {
  const coupons = { 'SAVE10': 0.10, 'SAVE20': 0.20, 'FIRST50': 0.50, 'SHOPEASE': 0.15 };
  const rate = coupons[coupon?.toUpperCase()];
  return rate ? Math.round(subtotal * rate) : 0;
}
function getCartTotal(subtotal, discount, shipping) {
  return subtotal - discount + shipping;
}

/* ─── Cart Page Render ─── */
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('cartItemsTable')) return;
  renderCart();

  // Coupon
  document.getElementById('applyCoupon')?.addEventListener('click', applyCoupon);
  document.getElementById('couponInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') applyCoupon();
  });
});

let appliedCoupon = '';

function renderCart() {
  const cart = getCart();
  const tbody = document.getElementById('cartItemsBody');
  const emptyState = document.getElementById('cartEmpty');
  const cartSection = document.getElementById('cartSection');

  if (cart.length === 0) {
    if (emptyState) emptyState.classList.remove('d-none');
    if (cartSection) cartSection.classList.add('d-none');
    return;
  }

  if (emptyState) emptyState.classList.add('d-none');
  if (cartSection) cartSection.classList.remove('d-none');

  tbody.innerHTML = cart.map(item => `
    <tr id="cart-row-${item.id}">
      <td>
        <div class="d-flex align-items-center gap-3">
          <img src="${item.image}" alt="${item.name}" style="width:70px;height:70px;object-fit:cover;border-radius:8px;">
          <div>
            <div class="fw-600">${item.name}</div>
            <small class="text-muted">${item.category}</small>
          </div>
        </div>
      </td>
      <td class="fw-600">${formatPrice(item.price)}</td>
      <td>
        <div class="qty-control">
          <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
          <input class="qty-input form-control" type="number" value="${item.qty}" min="1" max="${item.stock}"
            onchange="changeQtyInput(${item.id}, this.value)" style="width:50px;padding:.3rem .2rem;">
          <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
        </div>
      </td>
      <td class="fw-700 text-primary-custom">${formatPrice(item.price * item.qty)}</td>
      <td>
        <button class="btn btn-sm btn-outline-danger rounded-circle" onclick="deleteCartItem(${item.id})" title="Remove">
          <i class="fas fa-trash-alt"></i>
        </button>
      </td>
    </tr>`).join('');

  updateSummary();
}

function changeQty(id, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;
  const newQty = item.qty + delta;
  if (newQty <= 0) { deleteCartItem(id); return; }
  updateCartQty(id, newQty);
  renderCart();
}

function changeQtyInput(id, val) {
  updateCartQty(id, parseInt(val) || 1);
  renderCart();
}

function deleteCartItem(id) {
  removeFromCart(id);
  showToast('Item removed from cart', 'warning');
  renderCart();
}

function applyCoupon() {
  const code = document.getElementById('couponInput')?.value.trim();
  const subtotal = getCartSubtotal();
  const discount = getDiscount(subtotal, code);
  if (discount > 0) {
    appliedCoupon = code;
    showToast(`Coupon "${code}" applied! You save ${formatPrice(discount)} 🎉`, 'success');
  } else {
    appliedCoupon = '';
    showToast('Invalid coupon code', 'danger');
  }
  updateSummary();
}

function updateSummary() {
  const subtotal = getCartSubtotal();
  const discount = getDiscount(subtotal, appliedCoupon);
  const shipping = getShipping(subtotal - discount);
  const total = getCartTotal(subtotal, discount, shipping);
  const itemCount = getCart().reduce((s, i) => s + i.qty, 0);

  setEl('summarySubtotal', formatPrice(subtotal));
  setEl('summaryDiscount', discount > 0 ? `−${formatPrice(discount)}` : '₹0');
  setEl('summaryShipping', shipping === 0 ? '<span class="text-success fw-600">FREE</span>' : formatPrice(shipping));
  setEl('summaryTotal', formatPrice(total));
  setEl('summaryItemCount', `${itemCount} item${itemCount !== 1 ? 's' : ''}`);

  if (shipping === 0 && subtotal > 0) {
    setEl('freeShippingMsg', '<i class="fas fa-truck text-success me-1"></i>You qualify for <strong>free shipping!</strong>');
  } else if (subtotal > 0) {
    const needed = SHIPPING_THRESHOLD - subtotal + discount;
    setEl('freeShippingMsg', `Add ${formatPrice(Math.max(0, needed))} more for free shipping`);
  }

  // Store for checkout
  localStorage.setItem('ecom_checkout_data', JSON.stringify({ subtotal, discount, shipping, total, coupon: appliedCoupon }));
}

function setEl(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}
