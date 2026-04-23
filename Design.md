1. Input parameters (defined in `./js/template.js`):

   * Paper width (`PW`): total width of the paper
   * Paper height (`PH`): total height of the paper
   * Pattern width (`PTW`): width of the pattern area
   * Pattern height (`PTH`): height of the pattern area
   * AprilTag length (`al`): side length of a single AprilTag
   * Text height (`TH`): height of the top text area

2. A corresponding webpage needs to be generated:

   * Left margin = (PW - PTW) / 2
   * Right margin = (PW - PTW) / 2
   * Logo image width = height = al, centered horizontally, aligned to the top margin
   * QR code image placed immediately to the right of the logo, aligned to the top margin, with width = height = 0.8 × al
   * On the left side of the logo, there are two lines of text:

     * First line (main title): "Leaf Analyzer", line height = 0.3 × al, font color is #fbc43b
     * Second line (subtitle): "APPN-Tech", line height = 0.2 × al, font color is #a5cb71
     * The combined height of the two lines is 0.5 × al, vertically centered relative to the logo
   * Directly below the logo image is the text area with height TH
   * Below TH is the pattern area, with dashed border between 4 AprilTag
   * The horizontal distance between AprilTags is horizontal tag space (hts), and the horizontal dashed border length in the pattern area is 0.9 × hts
   * The vertical distance between AprilTags is vertical tag space (vts), and the vertical dashed border length in the pattern area is 0.9 × vts
   * The remaining height below the pattern area is the bottom margin
