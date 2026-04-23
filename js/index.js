const MM_TO_PX = 96 / 25.4;
const DEFAULT_TEMPLATE_PARAMS = {
  PW: 210,
  PH: 297,
  PTW: 170,
  PTH: 220,
  al: 24,
  TH: 28,
};

const PRESET_SIZES = {
  A4: { PW: 210, PH: 297 },
  A3: { PW: 297, PH: 420 },
};

const elements = {
  paperSize: document.getElementById("paperSize"),
  paperWidth: document.getElementById("paperWidth"),
  paperHeight: document.getElementById("paperHeight"),
  patternWidth: document.getElementById("patternWidth"),
  patternHeight: document.getElementById("patternHeight"),
  aprilTagLength: document.getElementById("aprilTagLength"),
  textHeight: document.getElementById("textHeight"),
  previewFrame: document.querySelector(".preview-iframe"),
  previewViewport: document.querySelector(".preview-viewport"),
  paper: document.querySelector(".paper"),
  marginsText: document.getElementById("marginsText"),
  resetBtn: document.getElementById("resetBtn"),
  okBtn: document.getElementById("okBtn"),
};

function getNumericValue(element, fallback) {
  const value = Number.parseFloat(element.value);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function getCurrentParams() {
  return {
    PW: getNumericValue(elements.paperWidth, DEFAULT_TEMPLATE_PARAMS.PW),
    PH: getNumericValue(elements.paperHeight, DEFAULT_TEMPLATE_PARAMS.PH),
    PTW: getNumericValue(elements.patternWidth, DEFAULT_TEMPLATE_PARAMS.PTW),
    PTH: getNumericValue(elements.patternHeight, DEFAULT_TEMPLATE_PARAMS.PTH),
    al: getNumericValue(elements.aprilTagLength, DEFAULT_TEMPLATE_PARAMS.al),
    TH: getNumericValue(elements.textHeight, DEFAULT_TEMPLATE_PARAMS.TH),
  };
}

function applyParamsToInputs(params) {
  elements.paperWidth.value = params.PW;
  elements.paperHeight.value = params.PH;
  elements.patternWidth.value = params.PTW;
  elements.patternHeight.value = params.PTH;
  elements.aprilTagLength.value = params.al;
  elements.textHeight.value = params.TH;
}

function buildTemplateUrl(params) {
  const searchParams = new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)]),
  );

  return `./src/template.html?${searchParams.toString()}`;
}

function formatMm(value) {
  return Number.isInteger(value)
    ? String(value)
    : Number(value.toFixed(3)).toString();
}

function updateMarginsDisplay({ PW, PH, PTW, PTH, al, TH }) {
  const horizontalMargin = (PW - PTW) / 2;
  const topMargin = (PH - al - TH - PTH) / 2;
  const bottomMargin = PH - topMargin - al - TH - PTH;

  elements.marginsText.innerHTML =
    `Left: ${formatMm(horizontalMargin)} mm, ` +
    `Right: ${formatMm(horizontalMargin)} mm<br />` +
    `Top: ${formatMm(topMargin)} mm, ` +
    `Bottom: ${formatMm(bottomMargin)} mm`;
}

function syncPaperPreset() {
  const { paperSize, paperWidth, paperHeight } = elements;
  const preset = PRESET_SIZES[paperSize.value];

  if (!preset) return;

  paperWidth.value = preset.PW;
  paperHeight.value = preset.PH;
}

function syncPaperSizeSelect() {
  const { PW, PH } = getCurrentParams();
  const activePreset = Object.entries(PRESET_SIZES).find(
    ([, preset]) => preset.PW === PW && preset.PH === PH,
  );

  elements.paperSize.value = activePreset ? activePreset[0] : "Custom";
}

function updatePreviewScale() {
  const { previewViewport, paper } = elements;
  const { PW, PH } = getCurrentParams();

  if (!previewViewport || !paper) return;

  const pageWidthPx = PW * MM_TO_PX;
  const pageHeightPx = PH * MM_TO_PX;
  const scale = Math.min(
    previewViewport.clientWidth / pageWidthPx,
    previewViewport.clientHeight / pageHeightPx,
  );

  paper.style.setProperty("--preview-page-width", `${PW}mm`);
  paper.style.setProperty("--preview-page-height", `${PH}mm`);
  paper.style.setProperty("--preview-scale", String(scale));
}

function pushParamsToPreview() {
  const params = getCurrentParams();
  const targetOrigin =
    window.location.protocol === "file:" ? "*" : window.location.origin;

  updateMarginsDisplay(params);
  updatePreviewScale();

  if (elements.previewFrame.contentWindow) {
    elements.previewFrame.contentWindow.postMessage(
      { type: "template-params", params },
      targetOrigin,
    );
  }
}

function handleFieldChange() {
  syncPaperSizeSelect();
  pushParamsToPreview();
}

function resetToDefaultParams() {
  applyParamsToInputs(DEFAULT_TEMPLATE_PARAMS);
  syncPaperSizeSelect();
  pushParamsToPreview();
}

elements.paperSize.addEventListener("change", () => {
  syncPaperPreset();
  handleFieldChange();
});

[
  elements.paperWidth,
  elements.paperHeight,
  elements.patternWidth,
  elements.patternHeight,
  elements.aprilTagLength,
  elements.textHeight,
].forEach((input) => {
  input.addEventListener("input", handleFieldChange);
  input.addEventListener("change", handleFieldChange);
});

window.addEventListener("resize", pushParamsToPreview);
window.addEventListener("load", () => {
  applyParamsToInputs(DEFAULT_TEMPLATE_PARAMS);
  syncPaperSizeSelect();
  elements.previewFrame.src = buildTemplateUrl(DEFAULT_TEMPLATE_PARAMS);
  pushParamsToPreview();
});

elements.previewFrame.addEventListener("load", pushParamsToPreview);
elements.resetBtn.addEventListener("click", resetToDefaultParams);

elements.okBtn.addEventListener("click", () => {
  window.location.href = buildTemplateUrl(getCurrentParams());
});
