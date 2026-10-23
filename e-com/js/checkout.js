/* ============================================================
   checkout.js — Checkout Form Validation & Order Placement
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('checkoutPage')) return;

  const cart = getCart();
  if (cart.length === 0) { window.location.href = '/pages/cart.html'; return; }

  renderCheckoutSummary();
  setupFormValidation();
  setupPaymentToggle();
});

/* ─── Render Order Summary ─── */
function renderCheckoutSummary() {
  const cart = getCart();
  const summaryData = JSON.parse(localStorage.getItem('ecom_checkout_data') || 'null');
  const subtotal = summaryData?.subtotal ?? cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = summaryData?.discount ?? 0;
  const shipping = summaryData?.shipping ?? (subtotal >= 999 ? 0 : 99);
  const total = summaryData?.total ?? (subtotal - discount + shipping);

  const itemsList = document.getElementById('checkoutItems');
  if (itemsList) {
    itemsList.innerHTML = cart.map(item => `
      <div class="d-flex align-items-center gap-3 py-2 border-bottom">
        <div class="position-relative">
          <img src="${item.image}" alt="${item.name}" style="width:56px;height:56px;object-fit:cover;border-radius:8px;">
          <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-secondary" style="font-size:.65rem;">${item.qty}</span>
        </div>
        <div class="flex-grow-1">
          <div class="fw-600 small">${item.name}</div>
          <div class="text-muted" style="font-size:.78rem;">${item.category}</div>
        </div>
        <div class="fw-700 small">${formatPrice(item.price * item.qty)}</div>
      </div>`).join('');
  }

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerHTML = val; };
  set('coSubtotal', formatPrice(subtotal));
  set('coDiscount', discount > 0 ? `-${formatPrice(discount)}` : '₹0');
  set('coShipping', shipping === 0 ? '<span class="text-success">FREE</span>' : formatPrice(shipping));
  set('coTotal', formatPrice(total));
  set('coItemCount', cart.reduce((s, i) => s + i.qty, 0) + ' items');
}

/* ─── Form Validation ─── */
function setupFormValidation() {
  const form = document.getElementById('checkoutForm');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    e.stopPropagation();

    clearErrors();
    let valid = true;

    // Validate fields
    const validators = [
      ['firstName', v => v.trim().length >= 2, 'First name must be at least 2 characters'],
      ['lastName',  v => v.trim().length >= 2, 'Last name must be at least 2 characters'],
      ['email',     v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Enter a valid email'],
      ['phone',     v => /^[6-9]\d{9}$/.test(v.replace(/\s/g, '')), 'Enter a valid 10-digit mobile number'],
      ['address',   v => v.trim().length >= 10, 'Enter full address (at least 10 characters)'],
      ['city',      v => v.trim().length >= 2, 'Enter city name'],
      ['state',     v => v !== '', 'Select a state'],
      ['pincode',   v => /^\d{6}$/.test(v), 'Enter a valid 6-digit PIN code'],
    ];

    validators.forEach(([id, fn, msg]) => {
      const el = document.getElementById(id);
      if (el && !fn(el.value)) {
        markInvalid(el, msg);
        valid = false;
      }
    });

    // Payment validation
    const payMethod = document.querySelector('input[name="paymentMethod"]:checked');
    if (!payMethod) {
      showToast('Please select a payment method', 'warning');
      valid = false;
    }

    if (payMethod?.value === 'card') {
      const cardValidators = [
        ['cardNumber', v => v.replace(/\s/g, '').length === 16, 'Enter a valid 16-digit card number'],
        ['cardName',   v => v.trim().length >= 3, 'Enter cardholder name'],
        ['cardExpiry', v => /^\d{2}\/\d{2}$/.test(v), 'Enter expiry in MM/YY format'],
        ['cardCVV',    v => /^\d{3,4}$/.test(v), 'Enter valid CVV'],
      ];
      cardValidators.forEach(([id, fn, msg]) => {
        const el = document.getElementById(id);
        if (el && !fn(el.value)) { markInvalid(el, msg); valid = false; }
      });
    }

    if (!valid) {
      form.querySelectorAll('.is-invalid')[0]?.focus();
      showToast('Please fix the errors above', 'danger');
      return;
    }

    placeOrder(payMethod.value);
  });
}

/* ─── Payment Method Toggle ─── */
function setupPaymentToggle() {
  document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
    radio.addEventListener('change', () => {
      document.getElementById('cardDetails')?.classList.toggle('d-none', radio.value !== 'card');
      document.getElementById('upiDetails')?.classList.toggle('d-none', radio.value !== 'upi');
    });
  });

  // Card number formatter
  const cardNum = document.getElementById('cardNumber');
  if (cardNum) {
    cardNum.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g, '').substring(0, 16);
      e.target.value = v.match(/.{1,4}/g)?.join(' ') || v;
    });
  }

  // Expiry formatter
  const expiry = document.getElementById('cardExpiry');
  if (expiry) {
    expiry.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g, '').substring(0, 4);
      if (v.length > 2) v = v.substring(0, 2) + '/' + v.substring(2);
      e.target.value = v;
    });
  }
}

/* ─── Place Order ─── */
function placeOrder(paymentMethod) {
  const btn = document.getElementById('placeOrderBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing…'; }

  setTimeout(() => {
    const cart = getCart();
    const summaryData = JSON.parse(localStorage.getItem('ecom_checkout_data') || '{}');
    const user = getCurrentUser();

    const order = {
      id: 'ORD' + Date.now(),
      userId: user?.id || 'guest',
      date: new Date().toISOString(),
      status: 'Processing',
      paymentMethod,
      items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, image: i.image })),
      subtotal: summaryData.subtotal || 0,
      discount: summaryData.discount || 0,
      shipping: summaryData.shipping || 0,
      total: summaryData.total || 0,
      address: {
        name: `${document.getElementById('firstName').value} ${document.getElementById('lastName').value}`,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        pincode: document.getElementById('pincode').value,
      }
    };

    // Save order
    const orders = JSON.parse(localStorage.getItem('ecom_orders') || '[]');
    orders.push(order);
    localStorage.setItem('ecom_orders', JSON.stringify(orders));

    // Clear cart
    clearCart();
    localStorage.removeItem('ecom_checkout_data');

    // Store current order for success page
    localStorage.setItem('ecom_last_order', JSON.stringify(order));

    window.location.href = '/pages/order-success.html';
  }, 1800);
}

/* ─── Helpers ─── */
function markInvalid(el, msg) {
  el.classList.add('is-invalid');
  const fb = el.nextElementSibling;
  if (fb?.classList.contains('invalid-feedback')) fb.textContent = msg;
  el.addEventListener('input', () => el.classList.remove('is-invalid'), { once: true });
}
function clearErrors() {
  document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
}
