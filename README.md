# Leaf Analyzer — Pattern Designer

A browser-based tool for generating calibration sheets used by the Leaf Analyzer system. The printed sheet contains four AprilTag markers at the corners of a measurement area, dashed boundary lines between them, and a QR code that encodes the pattern dimensions. The Leaf Analyzer camera reads this sheet to automatically determine scale and alignment at runtime.

No installation or build step is required. Access the latest version on the [github pages website](https://techlauncher-leafanalyzer.github.io/Leaf-Analyzer-Pattern-Generation/).

## Usage

1. Open the [github pages website](https://techlauncher-leafanalyzer.github.io/Leaf-Analyzer-Pattern-Generation/) in a browser (Tested with Chromium & Firefox 126+).
2. Adjust the input fields. The preview on the right updates live.
3. Click **Print** to generate and download a PDF at the exact paper dimensions specified.
4. Click **Reset** to restore all fields to their default values.

## Input fields

### Paper

| Field | Default | Description |
|---|---|---|
| Paper size | A4 | Preset shortcut. Sets width, height, AprilTag length, and default margins for known A-series sizes. Selecting **Custom** allows free entry. Automatically updates when you type dimensions that match a preset. |
| Paper width | 210 mm | Physical width of the sheet that will be printed on. |
| Paper height | 297 mm | Physical height of the sheet. |
| Orientation | Portrait | Swaps width and height when changed. Automatically updates to reflect whichever dimension is larger. |

### Pattern

| Field | Default | Description |
|---|---|---|
| Pattern width | 200 mm | Width of the measurement area bounded by the four AprilTag markers. |
| Pattern height | 241 mm | Height of the measurement area. |
| AprilTag length | 15 mm | Side length of each AprilTag square placed at the four corners. Larger tags are easier for cameras to detect from a distance. Also controls the size of the QR code and logo. |
| Text area height | 28 mm | Height of the header strip above the pattern area, which contains the title, logo, and QR code. |

### Margins (read-only)

Calculated automatically from the values above and displayed for reference. The pattern and header together are centred on the page, so left/right margins are always equal, as are top/bottom margins.

## What appears on the printed sheet

- **AprilTag markers** — one in each corner of the pattern area, used by the Leaf Analyzer to detect position and scale.
- **Dashed boundary lines** — drawn between the tags along each edge to visually mark the measurement boundary.
- **Header** — contains the *Leaf Analyzer* title and *APPN-Tech* subtitle, a logo, and a QR code. The QR code encodes the pattern dimensions in the format `PTW,PTH,al mm` (e.g. `170,220,24 mm`) so the analyzer can read the sheet's configuration automatically.

## Project structure

```
index.html          Main UI
src/template.html   Printable pattern (loaded in the preview iframe)
js/index.js         UI logic — reads inputs, drives the preview
js/template.js      Template logic — applies parameters, renders QR code, exports PDF
css/index.css       Main UI styles
css/template.css    Printable page styles
assets/             Logo and other static assets
```
