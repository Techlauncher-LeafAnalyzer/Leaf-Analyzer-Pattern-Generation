const params = {
  PW: 210,
  PH: 297,
  PTW: 170,
  PTH: 220,
  al: 24,
  TH: 28,
};

function setRootVariables({ PW, PH, PTW, PTH, al, TH }) {
  const root = document.documentElement;
  root.style.setProperty("--pw", `${PW}mm`);
  root.style.setProperty("--ph", `${PH}mm`);
  root.style.setProperty("--ptw", `${PTW}mm`);
  root.style.setProperty("--pth", `${PTH}mm`);
  root.style.setProperty("--al", `${al}mm`);
  root.style.setProperty("--th", `${TH}mm`);
}

function updateInfo({ PW, PH, PTW, PTH, al, TH }) {
  const leftMargin = (PW - PTW) / 2;
  const rightMargin = (PW - PTW) / 2;
  const topMargin = 0.2 * al;
  const patternTop = al + TH;
  const bottomMargin = PH - patternTop - PTH;

  document.getElementById("info").innerHTML = `
          <div><strong>Paper</strong>: ${PW}mm × ${PH}mm</div>
          <div><strong>Pattern</strong>: ${PTW}mm × ${PTH}mm</div>
          <div><strong>AprilTag</strong>: ${al}mm</div>
          <div><strong>Text area height</strong>: ${TH}mm</div>
          <div><strong>Left margin</strong>: ${leftMargin.toFixed(2)}mm</div>
          <div><strong>Right margin</strong>: ${rightMargin.toFixed(2)}mm</div>
          <div><strong>Top margin</strong>: ${topMargin.toFixed(2)}mm</div>
          <div><strong>Pattern top</strong>: ${patternTop.toFixed(2)}mm</div>
          <div><strong>Bottom margin</strong>: ${bottomMargin.toFixed(2)}mm</div>
        `;
}

setRootVariables(params);
updateInfo(params);
