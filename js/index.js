/* =================================
              FOREWORD
   =================================
In regards to function naming in this file, if a user selects an option from a dropdown,
we "apply" the values. When a user changes fields correlating to a dropdown, we "sync" the dropdown.

For example:
    User selects A4 preset: "apply" A4 preset values to width + height.
    User changes width & height to match A3 preset: "sync" the preset dropdown to display A3 preset.
    User select Portrait orientation: "apply" portrait values to width + height.
    User makes width > height: "sync" dropdown to display landscape.
   ============================== */

//#region global vars
// Conversion constant: millimeters to pixels (based on 96 DPI)
const MM_TO_PX = 96 / 25.4;

// Default template parameters (all units in mm)
const DEFAULT_TEMPLATE_PARAMS = {
    PW: 210,
    PH: 297,
    PTW: 170,
    PTH: 220,
    al: 24,
    TH: 28,
};

// Preset paper sizes
const PRESET_SIZES = {
    A0: { PW: 841, PH: 1189 },
    A1: { PW: 594, PH: 841 },
    A2: { PW: 420, PH: 594 },
    A3: { PW: 297, PH: 420 },
    A4: { PW: 210, PH: 297 },
    B4: { PW: 250, PH: 353 },
    B5: { PW: 176, PH: 250 },
};

// Cache all DOM elements for easy access
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
    orientation: document.getElementById("orientation")
};

//#endregion

//#region CORE UI UPDATE LOOP

/**
 * Syncs orientation and paper size dropdowns with current values.
 * Pushes current params to the preview window.
 */
function syncFieldChanges() {
    syncPaperSizeSelect();
    syncOrientationSelect();
    pushParamsToPreview();
}

/**
 * Calculate and display page margins.
 */
function syncMarginsDisplay({PW, PH, PTW, PTH, al, TH}) {
    const horizontalMargin = (PW - PTW) / 2;
    const topMargin = (PH - al - TH - PTH) / 2;
    const bottomMargin = PH - topMargin - al - TH - PTH;

    elements.marginsText.innerHTML =
        `Left: ${formatMm(horizontalMargin)} mm, ` +
        `Right: ${formatMm(horizontalMargin)} mm<br />` +
        `Top: ${formatMm(topMargin)} mm, ` +
        `Bottom: ${formatMm(bottomMargin)} mm`;
}

/**
 * Update dropdown paper size selection based on manual input.
 */
function syncPaperSizeSelect() {
    const {PW, PH} = getCurrentParams();
    const activePreset = Object.entries(PRESET_SIZES).find(
        ([, preset]) => (preset.PW === PW || preset.PH === PW) && (preset.PW * preset.PH === PW * PH),
    );

    elements.paperSize.value = activePreset ? activePreset[0] : "Custom";
}

/**
 * Update dropdown orientation selection based on manual input.
 */
function syncOrientationSelect() {
    const {PW, PH} = getCurrentParams();
    elements.orientation.value = PW > PH ? "Landscape" : "Portrait";
}

/**
 * Scale preview to fit viewport.
 */
function updatePreviewScale() {
    const {previewViewport, paper} = elements;
    const {PW, PH} = getCurrentParams();

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

/**
 * Send updated parameters to preview iframe.
 */
function pushParamsToPreview() {
    const params = getCurrentParams();
    const targetOrigin =
        window.location.protocol === "file:" ? "*" : window.location.origin;

    syncMarginsDisplay(params);
    updatePreviewScale();

    if (elements.previewFrame.contentWindow) {
        elements.previewFrame.contentWindow.postMessage(
            {type: "template-params", params},
            targetOrigin,
        );
    }
}

//#endregion

//#region Read UI

/**
 * Safely parse numeric input from an input element.
 * Falls back to default value if invalid.
 */
function getNumericValue(element, fallback) {
    const value = Number.parseFloat(element.value);
    return Number.isFinite(value) && value > 0 ? value : fallback;
}

/**
 * Read all current parameters from input fields.
 */
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

//#endregion

//#region Set UI

/**
 * Apply parameter values back into input fields.
 */
function applyParamsToInputs(params) {
    elements.paperWidth.value = params.PW;
    elements.paperHeight.value = params.PH;
    elements.patternWidth.value = params.PTW;
    elements.patternHeight.value = params.PTH;
    elements.aprilTagLength.value = params.al;
    elements.textHeight.value = params.TH;
}

/**
 * Build preview page URL with query parameters.
 */
function buildTemplateUrl(params) {
    const searchParams = new URLSearchParams(
        Object.entries(params).map(([key, value]) => [key, String(value)]),
    );
    return `./src/template.html?${searchParams.toString()}`;
}

/**
 * Apply width/height when preset (A4/A3) is selected.
 */
function applyPaperSizeSelection() {
    const {paperSize, paperWidth, paperHeight, patternWidth, patternHeight} = elements;
    const preset = PRESET_SIZES[paperSize.value];

    if (!preset) return;
    const al = getNumericValue(elements.aprilTagLength, DEFAULT_TEMPLATE_PARAMS.al);
    const TH = getNumericValue(elements.textHeight, DEFAULT_TEMPLATE_PARAMS.TH);
    paperWidth.value = preset.PW;
    paperHeight.value = preset.PH;
    patternWidth.value = preset.PW - 40;
    patternHeight.value = preset.PH - al - TH - 25;
}

/**
 * Applies a new orientation dropdown selection.
 */
function applySelectedOrientation() {
    let params = getCurrentParams();
    const orientation = elements.orientation.value;

    const isWider = params.PW > params.PH;
    const isLandscape = orientation === "Landscape";
    if ((isWider &&  !isLandscape)||(!isWider && isLandscape)) {
        [params.PW, params.PH] = [params.PH, params.PW];
        params.PTW = params.PW - 40;
        params.PTH = params.PH - params.al - params.TH - 25;
        applyParamsToInputs(params);
        pushParamsToPreview();
    }
}

//#endregion

//#region Helpers

/**
 * Format millimeter values for display.
 */
function formatMm(value) {
    return Number.isInteger(value)
        ? String(value)
        : Number(value.toFixed(3)).toString();
}

/**
 * Reset all parameters to default values.
 */
function resetToDefaultParams() {
    applyParamsToInputs(DEFAULT_TEMPLATE_PARAMS);
    Object.values(errorMsgs).forEach(el => { el.style.visibility = "hidden"; });
    syncFieldChanges();
}

/**
 * Checks if the pattern falls off the sides of the page.
 * It's recommended to throw a warning notification before allowing printing in this case.
 */
function badPatternState(){
    const params = getCurrentParams();
    if (params.PH < params.PTH + params.TH + params.al) return true;
    return params.PW < params.PTW + params.al;

}
//#endregion
/* ===========================
   Event Listeners
=========================== */

// Paper size dropdown
elements.paperSize.addEventListener("change", () => {
    applyPaperSizeSelection();
    syncFieldChanges();
});
elements.orientation.addEventListener("change", () => {
    applySelectedOrientation();
    syncFieldChanges();
});

// Six numeric input fields
[
    elements.paperWidth,
    elements.paperHeight,
    elements.patternWidth,
    elements.patternHeight,
    elements.aprilTagLength,
    elements.textHeight,
].forEach((input) => {
    input.addEventListener("input", syncFieldChanges);
    input.addEventListener("change", syncFieldChanges);
});

// Window events
window.addEventListener("resize", pushParamsToPreview);
window.addEventListener("load", () => {
    applyParamsToInputs(DEFAULT_TEMPLATE_PARAMS);
    syncPaperSizeSelect();
    syncOrientationSelect(); // TODO: Can we call syncFieldChanges() here?
    elements.previewFrame.src = buildTemplateUrl(DEFAULT_TEMPLATE_PARAMS);
    pushParamsToPreview();
});

// Iframe load
elements.previewFrame.addEventListener("load", pushParamsToPreview);

// Buttons
elements.resetBtn.addEventListener("click", resetToDefaultParams);
elements.okBtn.addEventListener("click", () => {
    if (badPatternState() && !confirm("Page dimensions are smaller than pattern size. Are you sure?")) {
        return;
    }
    const targetOrigin =
        window.location.protocol === "file:" ? "*" : window.location.origin;
    const newWindow = window.open(buildTemplateUrl(getCurrentParams()));

    newWindow.addEventListener("load", () => {
        newWindow.postMessage({type: "save-pdf"}, targetOrigin);
    });
});

/** validation start**/
/** validation rule:
 * 1. Pattern length, Pattern width, AprilTag length and Text area height must be greater than 0.
 * 2. Pattern length, Pattern width must be greater than or equal to 2 × AprilTag length.
 * Validation is triggered when the input field loses focus.
 * **/
const inputNames={
    paperWidthNm: document.getElementById("paperWidthNm"),
    paperHeightNm: document.getElementById("paperHeightNm"),
    patternWidthNm: document.getElementById("patternWidthNm"),
    patternHeightNm: document.getElementById("patternHeightNm"),
    aprilTagLengthNm: document.getElementById("aprilTagLengthNm"),
    textHeightNm: document.getElementById("textHeightNm"),
}

const errorMsgs = {
    paperWidthErr: document.getElementById("paperWidthErr"),
    paperHeightErr: document.getElementById("paperHeightErr"),
    patternWidthErr: document.getElementById("patternWidthErr"),
    patternHeightErr: document.getElementById("patternHeightErr"),
    aprilTagLengthErr: document.getElementById("aprilTagLengthErr"),
    textHeightErr: document.getElementById("textHeightErr"),
};

const aprilTagValue = Number(elements.aprilTagLength.value);

// Rule 1 & Rule 2
function validateInputSize(input, errorMsg, inputNm) {
  input.addEventListener("blur", () => {
    const inputValue = Number(input.value);

    // Validate after the user leaves the input field.
    if (!(input.value !== "" && inputValue > 0)) {
      // rule 1. >0 and not null
      errorMsg.textContent = inputNm.textContent.trim() + " should be greater than 0!";
      errorMsg.style.visibility = "visible";
      return;
    }
    if (!(inputValue >= 2 * aprilTagValue)) {
      // rule 2. > 2* AprilTag
      errorMsg.textContent = inputNm.textContent.trim() + " should be greater than 2 × AprilTag length!";
      errorMsg.style.visibility = "visible";
      return;
    }
  });

  // While typing, hide the error as soon as the value becomes valid.
  input.addEventListener("input", () => {
    const inputValue = Number(input.value);
    if (((input.value !== "" && inputValue > 0) && (inputValue >= 2 * aprilTagValue))) {
      errorMsg.style.visibility = "hidden";
    }
  });
}

// Rule 1
function validateInputSizeRule1(input, errorMsg, inputNm) {
  input.addEventListener("blur", () => {
    const inputValue = Number(input.value);

    // Validate after the user leaves the input field.
    if (!(input.value !== "" && inputValue > 0)) {
      // rule 1. >0 and not null
      errorMsg.textContent = inputNm.textContent.trim() + " should be greater than 0!";
      errorMsg.style.visibility = "visible";
      return;
    }
  });

  // While typing, hide the error as soon as the value becomes valid.
  input.addEventListener("input", () => {
    const inputValue = Number(input.value);
    if ((input.value !== "" && inputValue > 0)) {
      errorMsg.style.visibility = "hidden";
    }
  });
}

// Register validation once.
validateInputSize(elements.paperWidth, errorMsgs.paperWidthErr, inputNames.paperWidthNm);
validateInputSize(elements.paperHeight, errorMsgs.paperHeightErr, inputNames.paperHeightNm);
validateInputSize(elements.patternWidth, errorMsgs.patternWidthErr, inputNames.patternWidthNm);
validateInputSize(elements.patternHeight, errorMsgs.patternHeightErr, inputNames.patternHeightNm);

validateInputSizeRule1(elements.aprilTagLength, errorMsgs.aprilTagLengthErr, inputNames.aprilTagLengthNm);
validateInputSizeRule1(elements.textHeight, errorMsgs.textHeightErr, inputNames.textHeightNm);

/** validation end**/
