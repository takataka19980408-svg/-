import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { writeFileSync } from 'fs';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3987e5"/>
      <stop offset="100%" stop-color="#2a78d6"/>
    </linearGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#0b3a73" flood-opacity="0.28"/>
    </filter>
  </defs>

  <rect width="512" height="512" rx="112" fill="url(#bg)"/>

  <!-- Receipt card -->
  <g filter="url(#shadow)">
    <path d="M156 92 h200 a12 12 0 0 1 12 12 v304 l-28 -20 l-28 20 l-28 -20 l-28 20 l-28 -20 l-28 20 l-28 -20 l-28 20 V104 a12 12 0 0 1 12 -12 z"
      fill="#fcfcfb"/>
  </g>

  <!-- Receipt lines -->
  <rect x="184" y="150" width="144" height="14" rx="7" fill="#c3c2b7"/>
  <rect x="184" y="182" width="100" height="14" rx="7" fill="#e1e0d9"/>
  <rect x="184" y="214" width="144" height="14" rx="7" fill="#e1e0d9"/>
  <rect x="184" y="246" width="80" height="14" rx="7" fill="#e1e0d9"/>

  <!-- Yen mark -->
  <text x="256" y="340" font-family="system-ui,-apple-system,sans-serif" font-size="86" font-weight="800"
    fill="#2a78d6" text-anchor="middle">¥</text>
</svg>`;

const html = `<!doctype html>
<html><head>
<meta charset="UTF-8">
<style>*{margin:0;padding:0;}html,body{width:512px;height:512px;background:transparent;}</style>
</head><body>${svg}</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 512, height: 512 } });
await page.setContent(html, { waitUntil: 'networkidle' });

const buf512 = await page.screenshot({ type: 'png', omitBackground: true, clip: { x: 0, y: 0, width: 512, height: 512 } });
writeFileSync('public/icon-512.png', buf512);
console.log('icon-512.png written');

await page.setViewportSize({ width: 192, height: 192 });
await page.evaluate(() => {
  const s = document.querySelector('svg');
  s.setAttribute('width', '192');
  s.setAttribute('height', '192');
});
const buf192 = await page.screenshot({ type: 'png', omitBackground: true, clip: { x: 0, y: 0, width: 192, height: 192 } });
writeFileSync('public/icon-192.png', buf192);
console.log('icon-192.png written');

writeFileSync('public/favicon.svg', svg);
console.log('favicon.svg written');

await browser.close();
