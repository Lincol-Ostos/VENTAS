/* ════════════════════════════════════════════════════════════
   StreamVault — script.js
   ════════════════════════════════════════════════════════════ */

/* ── Configuración ───────────────────────────────────────── */
const WA_NUMBER = '943621317';   // ← cambia por tu número real (sin +)

/* ── Estado: carrito de compras ──────────────────────────── */
// Cada item: { id, name, price }
let carrito = [];

/* ── Referencias DOM ─────────────────────────────────────── */
const productCards  = document.querySelectorAll('.product-card');
const summaryCard    = document.getElementById('summaryCard');
const summaryList    = document.getElementById('summaryList');
const summaryTotalEl = document.getElementById('summaryTotal');

const btnToggle   = document.getElementById('btnTogglePay');
const qrPanel     = document.getElementById('qrPanel');
const fileInput   = document.getElementById('fileInput');
const fileDrop    = document.getElementById('fileDrop');
const fileNameEl  = document.getElementById('fileName');
const inputNombre = document.getElementById('inputNombre');
const inputPin    = document.getElementById('inputPin');
const btnEnviar   = document.getElementById('btnEnviar');
const toast       = document.getElementById('toast');

const errNombre  = document.getElementById('errorNombre');
const errPin     = document.getElementById('errorPin');
const errFile    = document.getElementById('errorFile');
const errCarrito = document.getElementById('errorCarrito');

/* ── Catálogo: selección de productos (carrito) ──────────── */
productCards.forEach(card => {
  card.addEventListener('click', () => toggleProducto(card));
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleProducto(card);
    }
  });
});

function toggleProducto(card) {
  const id    = card.dataset.id;
  const name  = card.dataset.name;
  const price = parseFloat(card.dataset.price);

  const idx = carrito.findIndex(item => item.id === id);

  if (idx === -1) {
    // Añadir al carrito
    carrito.push({ id, name, price });
    card.classList.add('selected');
    card.setAttribute('aria-pressed', 'true');
  } else {
    // Remover del carrito
    carrito.splice(idx, 1);
    card.classList.remove('selected');
    card.setAttribute('aria-pressed', 'false');
  }

  hideError(errCarrito);
  renderSummary();
}

/* ── Renderizar resumen / totalizador en tiempo real ─────── */
function renderSummary() {
  const total = carrito.reduce((sum, item) => sum + item.price, 0);

  // Construir lista de items
  summaryList.innerHTML = carrito.map(item => `
    <div class="summary-item">
      <span class="summary-item-name">${escapeHTML(item.name)}</span>
      <span class="summary-item-price">S/ ${item.price.toFixed(0)}</span>
    </div>
  `).join('');

  summaryTotalEl.textContent = 'S/ ' + total.toFixed(0);

  // Mostrar / ocultar con transición de opacidad suave
  if (carrito.length > 0) {
    summaryCard.classList.add('visible');
    // Forzar reflow para que la transición de opacidad se aplique
    requestAnimationFrame(() => summaryCard.classList.add('show'));
  } else {
    summaryCard.classList.remove('show');
    setTimeout(() => {
      if (carrito.length === 0) summaryCard.classList.remove('visible');
    }, 350);
  }
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ── Toggle panel QR ─────────────────────────────────────── */
btnToggle.addEventListener('click', () => {
  const isOpen = qrPanel.classList.toggle('open');
  btnToggle.classList.toggle('active', isOpen);
  btnToggle.setAttribute('aria-expanded', isOpen);

  if (isOpen) {
    setTimeout(() => qrPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
  }
});

/* ── Archivo / Comprobante ───────────────────────────────── */
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (file) {
    fileNameEl.textContent = '✓ ' + file.name;
    fileNameEl.classList.add('visible');
    fileDrop.classList.add('has-file');
    hideError(errFile);
  } else {
    fileNameEl.classList.remove('visible');
    fileDrop.classList.remove('has-file');
  }
});

/* Drag & Drop visual */
fileDrop.addEventListener('dragover', e => {
  e.preventDefault();
  fileDrop.style.borderColor = 'var(--accent-a)';
});
fileDrop.addEventListener('dragleave', () => {
  fileDrop.style.borderColor = '';
});
fileDrop.addEventListener('drop', e => {
  e.preventDefault();
  fileDrop.style.borderColor = '';
  if (e.dataTransfer.files.length) {
    fileInput.files = e.dataTransfer.files;
    fileInput.dispatchEvent(new Event('change'));
  }
});

/* ── Solo 4 dígitos en el PIN ────────────────────────────── */
inputPin.addEventListener('input', () => {
  inputPin.value = inputPin.value.replace(/\D/g, '').slice(0, 4);
});

/* ── Validación y envío por WhatsApp ─────────────────────── */
btnEnviar.addEventListener('click', () => {
  let valido = true;

  // Limpiar errores previos
  [errNombre, errPin, errFile, errCarrito].forEach(hideError);

  const nombre  = inputNombre.value.trim();
  const pin     = inputPin.value.trim();
  const archivo = fileInput.files[0];

  // Validar carrito (al menos 1 producto)
  if (carrito.length === 0) {
    showError(errCarrito);
    showToast('⚠️  Selecciona al menos un producto del catálogo');
    document.getElementById('catalogGrid')
      .scrollIntoView({ behavior: 'smooth', block: 'start' });
    return; // Detiene el envío de inmediato
  }

  // Validar nombre
  if (!nombre) {
    showError(errNombre);
    valido = false;
  }

  // Validar PIN (exactamente 4 dígitos)
  if (!/^\d{4}$/.test(pin)) {
    showError(errPin);
    valido = false;
  }

  // Validar comprobante adjunto
  if (!archivo) {
    if (!qrPanel.classList.contains('open')) {
      qrPanel.classList.add('open');
      btnToggle.classList.add('active');
      btnToggle.setAttribute('aria-expanded', 'true');
    }
    showError(errFile);
    setTimeout(() => qrPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
    valido = false;
  }

  if (!valido) {
    showToast('⚠️  Por favor completa todos los campos');
    return;
  }

  /* ── Construir desglose de productos y total ────────────── */
  const total = carrito.reduce((sum, item) => sum + item.price, 0);
  const desglose = carrito
    .map(item => '• ' + item.name + ' (S/ ' + item.price.toFixed(2) + ')')
    .join('%0A');

  /* ── Construir mensaje de WhatsApp ──────────────────────── */
  const msg = [
    '🎬 *SOLICITUD DE ACTIVACIÓN — StreamVault*',
    '',
    '👤 *Nombre:* ' + nombre,
    '🔑 *PIN de perfil:* ' + pin,
    '📦 *Productos en la Canasta:*',
    desglose,
    '',
    '💰 *Monto Total Pagado:* S/ ' + total.toFixed(2),
    '',
    '✅ *El pago ya fue realizado.*',
    '📎 *(Adjunto el comprobante en este chat de WhatsApp)*',
    '',
    '_Gracias, espero confirmación_ 🙌',
  ].join('%0A');

  const url = 'https://wa.me/' + WA_NUMBER + '?text=' + msg;

  // Redirección limpia — evita bloqueo de pop-up en navegadores móviles
  window.location.href = url;
});

/* ── Helpers ─────────────────────────────────────────────── */
function showError(el) {
  el.classList.add('visible');
  el.closest('.form-group, .section-card, .qr-panel')
    ?.querySelector('input, .file-drop')
    ?.focus();
}
function hideError(el) { el.classList.remove('visible'); }

let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}
