// Default parameters (unit: mm)
const defaultParams = {
  PW: 210,   // Paper Width
  PH: 297,   // Paper Height
  PTW: 170,  // Pattern Width
  PTH: 220,  // Pattern Height
  al: 24,    // AprilTag Length
  TH: 28,    // Text Height
};

/**
 * Parse parameters from URL query string.
 * Example: ?PW=210&PH=297
 * Falls back to default values if invalid.
 */
function parseParamsFromLocation() {
  const searchParams = new URLSearchParams(window.location.search);
  const params = { ...defaultParams };

  Object.keys(defaultParams).forEach((key) => {
    const rawValue = searchParams.get(key);

    if (rawValue === null) return;

    const value = Number.parseFloat(rawValue);

    if (Number.isFinite(value) && value > 0) {
      params[key] = value;
    }
  });

  return params;
}

/**
 * Set CSS variables on the root element.
 * These variables are used for layout styling in CSS.
 */
function setRootVariables({ PW, PH, PTW, PTH, al, TH }) {
  const root = document.documentElement;
  root.style.setProperty("--pw", `${PW}mm`);
  root.style.setProperty("--ph", `${PH}mm`);
  root.style.setProperty("--ptw", `${PTW}mm`);
  root.style.setProperty("--pth", `${PTH}mm`);
  root.style.setProperty("--al", `${al}mm`);
  root.style.setProperty("--th", `${TH}mm`);
}

/**
 * Build the text content encoded in the QR code.
 * Format example: "170*220-24 mm"
 */
function buildQRText({ PTW, PTH, al }) {
  return `${PTW}*${PTH}-${al} mm`;
}

/**
 * Render QR code onto canvas.
 * Also updates the visible text label.
 */
function renderQRCode({ PTW, PTH, al }) {
  const canvas = document.getElementById("qrCanvas");
  const qrTextEl = document.getElementById("qrText");
  const text = buildQRText({ PTW, PTH, al });

  qrTextEl.textContent = text;

  QRCode.toCanvas(canvas, text, {
    margin: 1,
    width: Math.round(al * 3.7795275591 * 0.8), // mm to px conversion based on 96 DPI
  });
}

/**
 * Apply all template parameters:
 * - Update CSS variables
 * - Re-render QR code
 */
function applyTemplateParams(nextParams) {
  setRootVariables(nextParams);
  renderQRCode(nextParams);
}

/**
 * Wraps window.print().
 */
function saveAsPDF(){
  window.print();
}

/**
 * Listen for messages from parent window.
 * Used to update template dynamically.
 */
window.addEventListener("message", (event) => {
  if (event.source !== window.parent) return;
  if (window.location.protocol !== "file:" && event.origin !== window.location.origin) {
    return;
  }

  if (event.data?.type === "template-params") {
    applyTemplateParams({ ...defaultParams, ...event.data.params });
  } else if (event.data?.type === "save-pdf") {
    saveAsPDF();
  }
});

// Apply parameters from URL on first load
applyTemplateParams(parseParamsFromLocation());
