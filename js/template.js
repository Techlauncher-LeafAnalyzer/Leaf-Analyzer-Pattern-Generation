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

function getRootVariables() {
  const root = document.documentElement;
  return {
    PW: Number(root.style.getPropertyValue("--pw").replace("mm", "")),
    PH: Number(root.style.getPropertyValue("--ph").replace("mm", "")),
    PTW: Number(root.style.getPropertyValue("--ptw").replace("mm", "")),
    PTH: Number(root.style.getPropertyValue("--pth").replace("mm", "")),
    al: Number(root.style.getPropertyValue("--al").replace("mm", "")),
    TH: Number(root.style.getPropertyValue("--th").replace("mm", "")),
  }
}

/**
 * Build the text content encoded in the QR code.
 * Format example: "170,220,24 mm"
 */
function buildQRText({ PTW, PTH, al }) {
  return `${PTW},${PTH},${al} mm`;
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
 * Rasterizes one SVG to a same-sized <canvas> via an off-thread Image decode.
 * Returns the canvas and keeps the original SVG for later restoration.
 */
function svgToCanvas(svg) {
  return new Promise((resolve) => {
    const { width, height } = svg.getBoundingClientRect();
    const canvas = document.createElement("canvas");
    canvas.width = width * 2;
    canvas.height = height * 2;
    canvas.style.width = "100%";
    canvas.style.height = "100%";

    const blob = new Blob([new XMLSerializer().serializeToString(svg)], {
      type: "image/svg+xml",
    });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Generates and automatically saves the current preview template as a pdf.
 * SVGs are swapped for canvases in-place on the live element so html2canvas
 * captures them at their correct on-screen coordinates, then restored after.
 */
async function saveAsPDF({ PW, PH }) {
  const element = document.getElementById("page");

  // Pre-rasterize all SVGs before html2canvas runs
  const svgs = Array.from(element.querySelectorAll("svg"));
  const canvases = await Promise.all(svgs.map(svgToCanvas));
  svgs.forEach((svg, i) => { if (canvases[i]) svg.replaceWith(canvases[i]); });

  // Capture element, then place it as a single image on one jsPDF page.
  // This bypasses html2pdf's page-splitting logic, which was producing a
  // blank extra page due to floating-point rounding in the mm→px conversion.
  const canvas = await html2canvas(element, { scale: 2, logging: false });
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({
    unit: "mm",
    orientation: PH >= PW ? "portrait" : "landscape",
    format: [PW, PH],
  });
  pdf.addImage(canvas.toDataURL("image/jpeg", 1.0), "JPEG", 0, 0, PW, PH);
  pdf.save(`${PW}-${PH}-leaf-analyzer-pattern.pdf`);

  // Restore original SVGs
  canvases.forEach((canvas, i) => { if (canvas) canvas.replaceWith(svgs[i]); });
}

/**
 * Listen for messages from parent window.
 * Used to update template dynamically.
 */
window.addEventListener("message", (event) => {
  const expectedSource = window.parent !== window ? window.parent : window.opener;
  if (event.source !== expectedSource) return;
  if (window.location.protocol !== "file:" && event.origin !== window.location.origin) {
    return;
  }

  if (event.data?.type === "template-params") {
    applyTemplateParams({ ...defaultParams, ...event.data.params });
  } else if (event.data?.type === "save-pdf") {
    saveAsPDF(getRootVariables());
  }
});

// Apply parameters from URL on first load
applyTemplateParams(parseParamsFromLocation());
