const defaultParams = {
  PW: 210,
  PH: 297,
  PTW: 170,
  PTH: 220,
  al: 24,
  TH: 28,
};

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

function setRootVariables({ PW, PH, PTW, PTH, al, TH }) {
  const root = document.documentElement;
  root.style.setProperty("--pw", `${PW}mm`);
  root.style.setProperty("--ph", `${PH}mm`);
  root.style.setProperty("--ptw", `${PTW}mm`);
  root.style.setProperty("--pth", `${PTH}mm`);
  root.style.setProperty("--al", `${al}mm`);
  root.style.setProperty("--th", `${TH}mm`);
}

function buildQRText({ PTW, PTH, al }) {
  return `${PTW}*${PTH}-${al} mm`;
}

function renderQRCode({ PTW, PTH, al }) {
  const canvas = document.getElementById("qrCanvas");
  const qrTextEl = document.getElementById("qrText");
  const text = buildQRText({ PTW, PTH, al });

  qrTextEl.textContent = text;

  QRCode.toCanvas(canvas, text, {
    margin: 1,
    width: Math.round(al * 3.7795275591 * 0.8),
  });
}

function applyTemplateParams(nextParams) {
  setRootVariables(nextParams);
  renderQRCode(nextParams);
}

window.addEventListener("message", (event) => {
  if (event.source !== window.parent) return;
  if (window.location.protocol !== "file:" && event.origin !== window.location.origin) {
    return;
  }
  if (event.data?.type !== "template-params") return;

  applyTemplateParams({
    ...defaultParams,
    ...event.data.params,
  });
});

applyTemplateParams(parseParamsFromLocation());
