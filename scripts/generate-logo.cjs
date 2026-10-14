const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');
const opentype = require('opentype.js');

// 1. Load Fonts
const boldFontBuf = fs.readFileSync('/tmp/Poppins-Bold.ttf');
const boldFont = opentype.parse(boldFontBuf.buffer.slice(boldFontBuf.byteOffset, boldFontBuf.byteOffset + boldFontBuf.byteLength));

const semiBoldBuf = fs.readFileSync('/tmp/Poppins-SemiBold.ttf');
const semiBoldFont = opentype.parse(semiBoldBuf.buffer.slice(semiBoldBuf.byteOffset, semiBoldBuf.byteOffset + semiBoldBuf.byteLength));

// 2. Icon Builder
// Center: (110, 110)
// Primary Color: #1D76C4 (Vibrant Royal Blue matching user logo)
function getIconSvg(isDark = false) {
  const whiteColor = '#FFFFFF';
  const cutColor = isDark ? '#0b1120' : '#FFFFFF';

  return `
  <!-- MaxiCareer Circular Emblem with Magnifying Glass motif -->
  <g id="maxicareer-emblem">
    <!-- Magnifying Glass Handle at ~45° down-right -->
    <path d="M 149 165 L 175 191 C 178 194 183 194 186 191 L 191 186 C 194 183 194 178 191 175 L 165 149 Z" fill="#1D76C4" />

    <!-- Main Circular Badge -->
    <circle cx="110" cy="110" r="82" fill="#1D76C4" />

    <!-- White Diagonal Cut (creates optical separation above the handle) -->
    <polygon points="144,144 153,135 180,162 171,171" fill="${cutColor}" />

    <!-- White 'C' Arc (Concentric ribbon along circumference, open at right) -->
    <path d="
      M 169 76
      A 68 68 0 1 0 158 158
      L 149 149
      A 55 55 0 1 1 158 83
      Z
    " fill="${whiteColor}" />

    <!-- Stylized 'M' in the Center -->
    <path d="
      M 76 132
      L 89 86
      C 91 79 99 79 102 85
      L 110 99
      L 118 85
      C 121 79 129 79 131 86
      L 144 132
      L 131 132
      L 122 96
      L 115 109
      C 113 113 107 113 105 109
      L 98 96
      L 89 132
      Z
    " fill="${whiteColor}" />
  </g>
  `;
}

// 3. Text Generation with Poppins-Bold for "MaxiCareer"
// EXACT SPELLING: MaxiCareer (capital M, capital C)
const fontSize = 108;
const baselineY = 149;
const textStartX = 236;

const textPath = boldFont.getPath("MaxiCareer", textStartX, baselineY, fontSize);
const textSvgPath = textPath.toPathData(2);
const bbox = textPath.getBoundingBox();

console.log("MaxiCareer Text Bounding Box:", bbox);

const minX = 24;
const minY = 24;
const maxX = Math.ceil(bbox.x2 + 16);
const maxY = 196;
const width = maxX - minX;
const height = maxY - minY;

// Tagline text with letter spacing
function getTrackedTextPath(font, text, startX, y, size, letterSpacing) {
  let currentX = startX;
  const paths = [];
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const glyphPath = font.getPath(char, currentX, y, size);
    paths.push(glyphPath.toPathData(2));
    const advance = font.getAdvanceWidth(char, size);
    currentX += advance + letterSpacing;
  }
  return { pathData: paths.join(' '), totalWidth: currentX - startX };
}

// Generate tagline version
// In tagline version:
// "MaxiCareer" title shifted slightly up to Y=126, and tagline underneath at Y=166
const taglineTitlePath = boldFont.getPath("MaxiCareer", textStartX, 126, 92).toPathData(2);
const taglineText = "CAREER GUIDANCE & MENTORSHIP";
const taglineInfo = getTrackedTextPath(semiBoldFont, taglineText, textStartX + 2, 166, 17, 4.2);

const taglineMaxX = Math.max(maxX, Math.ceil(textStartX + taglineInfo.totalWidth + 16));
const taglineWidth = taglineMaxX - minX;

// Function to generate full logo SVG (without tagline)
function generateFullLogoSvg(isDark = false) {
  const textColor = isDark ? '#FFFFFF' : '#1E1E1E';
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" width="${width}" height="${height}">
  ${getIconSvg(isDark)}
  <path d="${textSvgPath}" fill="${textColor}" />
</svg>`;
}

// Function to generate tagline logo SVG
function generateTaglineLogoSvg(isDark = false) {
  const textColor = isDark ? '#FFFFFF' : '#1E1E1E';
  const taglineColor = isDark ? '#94A3B8' : '#2563EB';
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${taglineWidth} ${height}" width="${taglineWidth}" height="${height}">
  ${getIconSvg(isDark)}
  <path d="${taglineTitlePath}" fill="${textColor}" />
  <path d="${taglineInfo.pathData}" fill="${taglineColor}" />
</svg>`;
}

// Function to generate icon-only SVG
function generateIconSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="24 24 172 172" width="172" height="172">
  ${getIconSvg(false)}
</svg>`;
}

// 4. Save and Render all assets
const publicDir = path.join(__dirname, '../public/images');
const distDir = path.join(__dirname, '../dist/images');

fs.mkdirSync(publicDir, { recursive: true });
fs.mkdirSync(distDir, { recursive: true });

const assets = [
  { name: 'maxicareer-logo', svg: generateFullLogoSvg(false), pngWidth: 1600 },
  { name: 'maxicareer-logo-white', svg: generateFullLogoSvg(true), pngWidth: 1600 },
  { name: 'maxicareer-logo-tagline', svg: generateTaglineLogoSvg(false), pngWidth: 1600 },
  { name: 'maxicareer-icon', svg: generateIconSvg(), pngWidth: 512 },
];

for (const asset of assets) {
  // Write SVG
  const svgPathPublic = path.join(publicDir, `${asset.name}.svg`);
  const svgPathDist = path.join(distDir, `${asset.name}.svg`);
  fs.writeFileSync(svgPathPublic, asset.svg);
  fs.writeFileSync(svgPathDist, asset.svg);

  // Render PNG with @resvg/resvg-js
  const resvg = new Resvg(asset.svg, {
    fitTo: { mode: 'width', value: asset.pngWidth }
  });
  const pngBuffer = resvg.render().asPng();

  const pngPathPublic = path.join(publicDir, `${asset.name}.png`);
  const pngPathDist = path.join(distDir, `${asset.name}.png`);
  fs.writeFileSync(pngPathPublic, pngBuffer);
  fs.writeFileSync(pngPathDist, pngBuffer);

  console.log(`Generated: ${asset.name}.svg & .png (${pngBuffer.length} bytes)`);
}

console.log("All MaxiCareer logo assets generated successfully with exact spelling!");
