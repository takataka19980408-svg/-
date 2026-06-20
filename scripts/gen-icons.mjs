// Generates icon-192.png and icon-512.png using Playwright
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { writeFileSync } from 'fs';

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="bg" cx="50%" cy="35%" r="75%">
      <stop offset="0%" stop-color="#1C1A0E"/>
      <stop offset="100%" stop-color="#0A0905"/>
    </radialGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#C9A22722"/>
      <stop offset="100%" stop-color="#C9A22700"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>

  <!-- Subtle center glow -->
  <rect width="512" height="512" rx="96" fill="url(#glow)"/>

  <!-- Outer gold border -->
  <rect x="16" y="16" width="480" height="480" rx="82"
    fill="none" stroke="#C9A227" stroke-width="2.5" opacity="0.55"/>

  <!-- Top decorative rule -->
  <line x1="72" y1="102" x2="440" y2="102"
    stroke="#C9A227" stroke-width="1.5" opacity="0.45"/>
  <!-- Bottom decorative rule -->
  <line x1="72" y1="410" x2="440" y2="410"
    stroke="#C9A227" stroke-width="1.5" opacity="0.45"/>

  <!-- Corner ornaments top-left -->
  <line x1="72" y1="102" x2="72" y2="116" stroke="#C9A227" stroke-width="1.5" opacity="0.45"/>
  <!-- Corner ornaments top-right -->
  <line x1="440" y1="102" x2="440" y2="116" stroke="#C9A227" stroke-width="1.5" opacity="0.45"/>
  <!-- Corner ornaments bottom-left -->
  <line x1="72" y1="396" x2="72" y2="410" stroke="#C9A227" stroke-width="1.5" opacity="0.45"/>
  <!-- Corner ornaments bottom-right -->
  <line x1="440" y1="396" x2="440" y2="410" stroke="#C9A227" stroke-width="1.5" opacity="0.45"/>

  <!-- Main character 帳 -->
  <text x="256" y="325"
    font-family="'Hiragino Mincho ProN','Yu Mincho','MS Mincho',serif"
    font-size="252" font-weight="700"
    fill="#C9A227"
    text-anchor="middle">帳</text>

  <!-- Sub label ゼニ -->
  <text x="256" y="388"
    font-family="'Hiragino Mincho ProN','Yu Mincho','MS Mincho',serif"
    font-size="46" font-weight="400" letter-spacing="18"
    fill="#C9A22799"
    text-anchor="middle">ゼニ</text>
</svg>`;

const html = `<!doctype html>
<html><head>
<meta charset="UTF-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:512px; height:512px; background:#0A0905; }
</style>
</head><body>
${svg}
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 512, height: 512 });
await page.setContent(html, { waitUntil: 'networkidle' });

const buf512 = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 512, height: 512 } });
writeFileSync('public/icon-512.png', buf512);
console.log('icon-512.png written');

await page.setViewportSize({ width: 192, height: 192 });
await page.evaluate((s) => {
  document.querySelector('svg').setAttribute('width', '192');
  document.querySelector('svg').setAttribute('height', '192');
}, null);
const buf192 = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 192, height: 192 } });
writeFileSync('public/icon-192.png', buf192);
console.log('icon-192.png written');

await browser.close();
console.log('Done.');
