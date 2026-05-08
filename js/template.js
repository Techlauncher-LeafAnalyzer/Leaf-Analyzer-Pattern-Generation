// Default parameters (unit: mm)
const defaultParams = {
  PW: 210,   // Paper Width
  PH: 297,   // Paper Height
  PTW: 200,  // Pattern Width
  PTH: 244,  // Pattern Height
  al: 15,    // AprilTag Length
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
 * Generate and save the current preview template as a PDF.
 *
 * Rasterizes inline SVGs in-place so html2canvas captures their on-screen appearance,
 * renders the #page element to a single canvas, embeds that canvas as a full-page
 * JPEG into a jsPDF document sized PW×PH millimeters, saves the PDF, and restores
 * the original SVG elements.
 *
 * @param {number} PW - Page width in millimeters.
 * @param {number} PH - Page height in millimeters.
 */
/**
 * Renders the page to a PDF blob. Temporarily replaces inline SVGs with
 * rasterized canvases so html2canvas captures them correctly, then restores them.
 */
async function buildPDFBlob({ PW, PH }) {
  const element = document.getElementById("page");

  const svgs = Array.from(element.querySelectorAll("svg"));
  const rasterized = await Promise.all(svgs.map(svgToCanvas));
  svgs.forEach((svg, i) => { if (rasterized[i]) svg.replaceWith(rasterized[i]); });

  const pwPx = Math.round(PW * 3.7795275591);
  const phPx = Math.round(PH * 3.7795275591);
  const canvas = await html2canvas(element, {
    width: pwPx,
    height: phPx,
    windowWidth: pwPx,
    windowHeight: phPx,
    scrollX: 0,
    scrollY: 0,
    logging: true,
  });

  rasterized.forEach((c, i) => { if (c) c.replaceWith(svgs[i]); });

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({
    unit: "mm",
    orientation: PH >= PW ? "portrait" : "landscape",
    format: [PW, PH],
  });
  pdf.addImage(canvas.toDataURL("image/jpeg", 1.0), "JPEG", 0, 0, PW, PH, "", "NONE");
  return pdf.output("blob");
}

/**
 * Saves via the File System Access API. Resolves only after the file is fully
 * written — the writable.close() call is the deterministic signal.
 */
async function saveAsPDFToHandle(handle, params) {
  const blob = await buildPDFBlob(params);
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
}

/**
 * Fallback for browsers without showSaveFilePicker (e.g. Firefox).
 * Triggers a blob-URL download and waits 1 s for the browser to register it.
 */
async function saveAsPDF(params) {
  const { PW, PH } = params;
  const blob = await buildPDFBlob(params);
  await new Promise((resolve, reject) => {
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${PW}-${PH}-leaf-analyzer-pattern.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        resolve();
      }, 1000);
    } catch (err) {
      reject(err);
    }
  });
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
    if (event.data.scale != null) {
      const lineWidth = Math.max(1, Math.ceil(1 / event.data.scale));
      document.documentElement.style.setProperty("--line-width", `${lineWidth}px`);
    }
  } else if (event.data?.type === "save-pdf") {
    const vars = getRootVariables();
    const savePromise = event.data.handle
      ? saveAsPDFToHandle(event.data.handle, vars)
      : saveAsPDF(vars);

    savePromise
      .then(() => window.close())
      .catch((err) => {
        const overlay = document.createElement("div");
        overlay.textContent = `Failed to generate PDF: ${err?.message ?? "unknown error"}`;
        overlay.style.cssText = "position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.92);font-size:1.2rem;color:#900;padding:2rem;text-align:center;z-index:9999";
        document.body.appendChild(overlay);
      });
  }
});

// Apply parameters from URL on first load
applyTemplateParams(parseParamsFromLocation());
