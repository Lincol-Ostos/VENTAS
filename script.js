/* ════════════════════════════════════════════════════════════
   StreamVault — script.js  (Access Vault Edition)
   ════════════════════════════════════════════════════════════ */

/* ── Configuración general ───────────────────────────────── */
const WA_NUMBER = '943621317';   // ← tu número real

/* ═══════════════════════════════════════════════════════════
   ★  CATÁLOGO — edita aquí precio, stock y nombre de cada
      producto. El HTML se actualiza automáticamente al cargar.
   ═══════════════════════════════════════════════════════════
   Campos por producto:
     id       → debe coincidir con data-id de la tarjeta HTML
     name     → nombre que aparece en el resumen y WhatsApp
     price    → precio en soles (número)
     period   → texto del período (solo informativo)
     stock    → unidades disponibles (0 = bloqueado)
═══════════════════════════════════════════════════════════ */
const CATALOG = {
  netflix: {
    name:   'Netflix Premium',
    price:  14,
    period: '30 días',
    stock:  4,
  },
  hbo: {
    name:   'HBO Max Premium',
    price:  6,
    period: '30 días',
    stock:  3,
  },
    combo: {
    name:   'Combo Netflix + HBO Max',
    price:  20,
    period: '30 días',
    stock:  3,
  },
  netflix1: {
    name:   'Netflix 1 Dispositivo',
    price:  10,
    period: '30 días',
    stock:  8,          // ← 0 = tarjeta bloqueada automáticamente
  },
  duolingo: {
    name:   'Duolingo Vidas Infinitas',
    price:  3,
    period: '30 días',
    stock:  22,
  }, 
  paramount: {
    name:   'Paramount+',
    price:  13.5,
    period: '30 días',
    stock:  5,
  },
  spotify: {
    name:   'Activación de Spotify',
    price:  16,
    period: '30 días',
    stock:  999,       // ← stock infinito (usa un número muy alto) 
  }

};

/* ── Inyectar datos del catálogo en el HTML ──────────────── */
function initCatalog() {
  document.querySelectorAll('.vault-card').forEach(card => {
    const id   = card.dataset.id;
    const item = CATALOG[id];
    if (!item) return;

    // Actualizar data-attributes usados por el carrito
    card.dataset.name   = item.name;
    card.dataset.price  = item.price;
    card.dataset.period = item.period;

    // Actualizar precio visible
    const amountEl = card.querySelector('.v-amount');
    if (amountEl) amountEl.textContent = item.price;

    // Actualizar badge de stock
    const stockEl = card.querySelector('.vault-stock');
    if (stockEl) {
      if (item.stock <= 0) {
        stockEl.textContent = 'Agotado';
        stockEl.classList.add('out-of-stock');
      } else {
        stockEl.textContent = item.stock + ' disp.';
        stockEl.classList.remove('out-of-stock');
      }
    }

    // Bloquear tarjeta si stock = 0
    if (item.stock <= 0) {
      card.classList.add('vault-disabled');
      card.setAttribute('aria-disabled', 'true');
      card.setAttribute('tabindex', '-1');
    }
  });
}

/* ── Carrito ─────────────────────────────────────────────── */
const cart = new Map();

/* ── Referencias DOM ─────────────────────────────────────── */
const vaultCards   = document.querySelectorAll('.vault-card');
const summaryCard  = document.getElementById('summaryCard');
const summaryLines = document.getElementById('summaryLines');
const summaryTotal = document.getElementById('summaryTotal');

const btnToggle    = document.getElementById('btnTogglePay');
const qrPanel      = document.getElementById('qrPanel');
const fileInput    = document.getElementById('fileInput');
const fileDrop     = document.getElementById('fileDrop');
const fileNameEl   = document.getElementById('fileName');
const inputNombre  = document.getElementById('inputNombre');
const inputPin     = document.getElementById('inputPin');
const btnEnviar    = document.getElementById('btnEnviar');
const toast        = document.getElementById('toast');

const errNombre    = document.getElementById('errorNombre');
const errPin       = document.getElementById('errorPin');
const errFile      = document.getElementById('errorFile');

const tosToggle    = document.getElementById('tosToggle');
const tosPanel     = document.getElementById('tosPanel');

/* ── Vault Cards — selección de productos ────────────────── */
vaultCards.forEach(card => {
  card.addEventListener('click', () => toggleCard(card));
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleCard(card);
    }
  });
});

function toggleCard(card) {
  // Ignorar si está bloqueada por stock 0
  if (card.classList.contains('vault-disabled')) {
    showToast('❌  Este producto está agotado');
    return;
  }

  const id     = card.dataset.id;
  const name   = card.dataset.name;
  const price  = parseFloat(card.dataset.price);
  const period = card.dataset.period;

  if (cart.has(id)) {
    cart.delete(id);
    card.classList.remove('selected');
    card.setAttribute('aria-pressed', 'false');
  } else {
    cart.set(id, { name, price, period });
    card.classList.add('selected');
    card.setAttribute('aria-pressed', 'true');
  }

  updateSummary();
}

function updateSummary() {
  if (cart.size === 0) {
    summaryCard.classList.remove('visible');
    return;
  }

  summaryCard.classList.add('visible');
  summaryLines.innerHTML = '';

  let total = 0;
  cart.forEach(({ name, price, period }) => {
    total += price;
    const line = document.createElement('div');
    line.className = 'summary-line';
    line.innerHTML = `
      <span class="summary-line-name">${name} <span style="color:var(--t2);font-size:11px;">· ${period}</span></span>
      <span class="summary-line-price">S/ ${price.toFixed(2)}</span>
    `;
    summaryLines.appendChild(line);
  });

  summaryTotal.textContent = `S/ ${total.toFixed(2)}`;
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

/* Drag & Drop */
fileDrop.addEventListener('dragover', e => {
  e.preventDefault();
  fileDrop.style.borderColor = 'var(--amber)';
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
  [errNombre, errPin, errFile].forEach(hideError);

  const nombre  = inputNombre.value.trim();
  const pin     = inputPin.value.trim();
  const archivo = fileInput.files[0];

  if (cart.size === 0) {
    showToast('⚠️  Elige al menos un producto');
    document.querySelector('.vault-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  if (!nombre) {
    showError(errNombre);
    valido = false;
  }

  if (!/^\d{4}$/.test(pin)) {
    showError(errPin);
    valido = false;
  }

  if (!archivo) {
    if (!qrPanel.classList.contains('open')) {
      qrPanel.classList.add('open');
      btnToggle.classList.add('active');
      btnToggle.setAttribute('aria-expanded', 'true');
    }
    showError(errFile);
    setTimeout(() => {
      fileDrop.scrollIntoView({ behavior: 'smooth', block: 'center' });
      fileInput.focus();
    }, 100);
    valido = false;
  }

  if (!valido) {
    showToast('⚠️  Por favor completa todos los campos');
    return;
  }

  // --- CÁLCULO DE FECHA DE CORTE (SOLO ESTO SE AGREGA) ---
  const fechaHoy = new Date();
  const fechaCorte = new Date(fechaHoy);
  fechaCorte.setDate(fechaHoy.getDate() + 30);
  
  const dia = String(fechaCorte.getDate()).padStart(2, '0');
  const mes = String(fechaCorte.getMonth() + 1).padStart(2, '0');
  const anio = fechaCorte.getFullYear();
  const fechaCorteFormateada = `${dia}/${mes}/${anio}`;
  // ───────────────────────────────────────────────────────

  let total = 0;
  let productLines = '';
  cart.forEach(({ name, price, period }) => {
    total += price;
    productLines += `%0A   • ${name} — S/ ${price.toFixed(2)} x ${period}`;
  });

  const msg = [
    '🎬 *SOLICITUD DE ACTIVACIÓN — StreamVault*',
    '',
    '👤 *Nombre:* ' + nombre,
    '🔑 *PIN de perfil:* ' + pin,
    '',
    '📦 *Productos:*' + productLines,
    '',
    `💰 *Total: S/ ${total.toFixed(2)}*`,
    '📅 *Fecha de Corte:* ' + fechaCorteFormateada, // <-- Único cambio en tu mensaje
    '',
    '✅ *El pago ya fue realizado.*',
    '📎 *(Adjunto el comprobante en el chat)*',
    '',
    '_Gracias, espero confirmación_ 🙌',
  ].join('%0A');

  window.location.href = `https://wa.me/${WA_NUMBER}?text=${msg}`;
});
/* ── Acordeón TOS ────────────────────────────────────────── */
tosToggle.addEventListener('click', () => {
  const isOpen = tosPanel.classList.toggle('open');
  tosToggle.setAttribute('aria-expanded', isOpen);
});

/* ── Helpers ─────────────────────────────────────────────── */
function showError(el) {
  el.classList.add('visible');
  const target = el.closest('.form-group, .section-card, .qr-panel')
    ?.querySelector('input, .file-drop');
  target?.focus();
}
function hideError(el) { el.classList.remove('visible'); }

let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

/* ── Init ────────────────────────────────────────────────── */
initCatalog();
