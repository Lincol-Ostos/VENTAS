/* ════════════════════════════════════════════════════════════
   StreamVault — script.js
   ════════════════════════════════════════════════════════════ */

/* ── Configuración ───────────────────────────────────────── */
const WA_NUMBER = '943621317';   // ← cambia por tu número real (sin +)
const PRODUCTO  = 'Netflix Premium – Perfil S/ 15 x 30días';

/* ── Referencias DOM ─────────────────────────────────────── */
const btnToggle   = document.getElementById('btnTogglePay');
const qrPanel     = document.getElementById('qrPanel');
const fileInput   = document.getElementById('fileInput');
const fileDrop    = document.getElementById('fileDrop');
const fileNameEl  = document.getElementById('fileName');
const inputNombre = document.getElementById('inputNombre');
const inputPin    = document.getElementById('inputPin');
const btnEnviar   = document.getElementById('btnEnviar');
const toast       = document.getElementById('toast');

const errNombre = document.getElementById('errorNombre');
const errPin    = document.getElementById('errorPin');
const errFile   = document.getElementById('errorFile');

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
  [errNombre, errPin, errFile].forEach(hideError);

  const nombre  = inputNombre.value.trim();
  const pin     = inputPin.value.trim();
  const archivo = fileInput.files[0];

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
      setTimeout(() => qrPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
    }
    showError(errFile);
    valido = false;
  }

  if (!valido) {
    showToast('⚠️  Por favor completa todos los campos');
    return;
  }

  /* ── Construir mensaje de WhatsApp ──────────────────────── */
  const msg = [
    '🎬 *SOLICITUD DE ACTIVACIÓN — StreamVault*',
    '',
    '👤 *Nombre:* ' + nombre,
    '🔑 *PIN de perfil:* ' + pin,
    '📦 *Producto:* ' + PRODUCTO,
    '',
    '✅ *El pago ya fue realizado.*',
    '📎 *(Adjunto el comprobante en el chat)*',
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
