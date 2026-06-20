import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { writeFileSync } from 'fs';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="bg" cx="35%" cy="28%" r="85%">
      <stop offset="0%" stop-color="#201508"/>
      <stop offset="55%" stop-color="#0E0B05"/>
      <stop offset="100%" stop-color="#060503"/>
    </radialGradient>

    <filter id="bigred" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="22" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="midred" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="9" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="whiteglow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="textglow" x="-12%" y="-12%" width="124%" height="124%">
      <feGaussianBlur stdDeviation="12" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="spark" x="-300%" y="-300%" width="700%" height="700%">
      <feGaussianBlur stdDeviation="5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="tinybloom" x="-400%" y="-400%" width="900%" height="900%">
      <feGaussianBlur stdDeviation="3" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>

    <!-- Katana blade gradient: bright at center, tapers at tips -->
    <linearGradient id="blade" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="white" stop-opacity="0.4"/>
      <stop offset="30%"  stop-color="white" stop-opacity="1"/>
      <stop offset="50%"  stop-color="#FFF8E0" stop-opacity="1"/>
      <stop offset="70%"  stop-color="white" stop-opacity="1"/>
      <stop offset="100%" stop-color="white" stop-opacity="0.4"/>
    </linearGradient>
  </defs>

  <!-- ── Background ── -->
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>

  <!-- Slash impact tint -->
  <polygon points="360,30 485,30 150,482 30,482"
    fill="#8B1200" opacity="0.12"/>

  <!-- Gold frame -->
  <rect x="14" y="14" width="484" height="484" rx="84"
    fill="none" stroke="#C9A227" stroke-width="2" opacity="0.45"/>
  <rect x="26" y="26" width="460" height="460" rx="74"
    fill="none" stroke="#C9A227" stroke-width="0.7" opacity="0.18"/>

  <!-- Corner brackets -->
  <path d="M46 100 L46 52 L94 52"  fill="none" stroke="#C9A227" stroke-width="2" opacity="0.5" stroke-linecap="round"/>
  <path d="M466 100 L466 52 L418 52" fill="none" stroke="#C9A227" stroke-width="2" opacity="0.5" stroke-linecap="round"/>
  <path d="M46 412 L46 460 L94 460" fill="none" stroke="#C9A227" stroke-width="2" opacity="0.5" stroke-linecap="round"/>
  <path d="M466 412 L466 460 L418 460" fill="none" stroke="#C9A227" stroke-width="2" opacity="0.5" stroke-linecap="round"/>

  <!-- ── 帳 character ── -->
  <!-- Glow pass -->
  <text x="256" y="328"
    font-family="'Hiragino Mincho ProN','Yu Mincho','MS Mincho',serif"
    font-size="265" font-weight="700"
    fill="#C9A227" text-anchor="middle"
    filter="url(#textglow)" opacity="0.4">帳</text>
  <!-- Solid pass -->
  <text x="256" y="328"
    font-family="'Hiragino Mincho ProN','Yu Mincho','MS Mincho',serif"
    font-size="265" font-weight="700"
    fill="#C9A227" text-anchor="middle" opacity="0.93">帳</text>

  <!-- ── SLASH ── -->
  <!-- Slash path: slightly curved arc (katana feel) via quadratic bezier -->
  <!-- from (415,45) curving slightly, to (95,465) -->

  <!-- Layer 1: deep red outer bloom -->
  <path d="M415,45 Q255,254 95,465"
    fill="none" stroke="#CC1100" stroke-width="52"
    stroke-linecap="round" filter="url(#bigred)" opacity="0.55"/>

  <!-- Layer 2: orange mid glow -->
  <path d="M415,45 Q255,254 95,465"
    fill="none" stroke="#FF4400" stroke-width="20"
    stroke-linecap="round" filter="url(#midred)" opacity="0.75"/>

  <!-- Layer 3: gold haze -->
  <path d="M415,45 Q255,254 95,465"
    fill="none" stroke="#FFB030" stroke-width="7"
    stroke-linecap="round" filter="url(#whiteglow)" opacity="0.85"/>

  <!-- Layer 4: blade edge — back (ha-mune) -->
  <path d="M419,52 Q258,258 100,470"
    fill="none" stroke="#FFE8A0" stroke-width="2.5"
    stroke-linecap="round" filter="url(#whiteglow)" opacity="0.6"/>

  <!-- Layer 5: blade edge — bright leading edge -->
  <path d="M412,40 Q252,250 92,462"
    fill="none" stroke="white" stroke-width="1.6"
    stroke-linecap="round" filter="url(#whiteglow)" opacity="0.95"/>

  <!-- Layer 6: razor-thin white center -->
  <path d="M413,43 Q253,252 93,464"
    fill="none" stroke="white" stroke-width="0.9"
    stroke-linecap="round"/>

  <!-- Blade reflection highlight (short segment near tip) -->
  <path d="M400,62 Q360,120 330,165"
    fill="none" stroke="white" stroke-width="3"
    stroke-linecap="round" opacity="0.35"/>

  <!-- ── IMPACT SPARKS at ~(255,254) ── -->

  <!-- Spark burst lines radiating from center of slash -->
  <line x1="255" y1="254" x2="320" y2="165" stroke="#FF8830" stroke-width="2.8" stroke-linecap="round" filter="url(#spark)" opacity="0.95"/>
  <line x1="255" y1="254" x2="355" y2="188" stroke="white" stroke-width="1.4" stroke-linecap="round" filter="url(#tinybloom)" opacity="0.8"/>
  <line x1="255" y1="254" x2="300" y2="135" stroke="#FF6620" stroke-width="2.2" stroke-linecap="round" filter="url(#spark)" opacity="0.85"/>
  <line x1="255" y1="254" x2="185" y2="175" stroke="#FFB040" stroke-width="2.5" stroke-linecap="round" filter="url(#spark)" opacity="0.8"/>
  <line x1="255" y1="254" x2="155" y2="215" stroke="white" stroke-width="1.3" stroke-linecap="round" filter="url(#tinybloom)" opacity="0.7"/>
  <line x1="255" y1="254" x2="370" y2="280" stroke="#FF6620" stroke-width="2" stroke-linecap="round" filter="url(#spark)" opacity="0.75"/>
  <line x1="255" y1="254" x2="380" y2="235" stroke="white" stroke-width="1" stroke-linecap="round" filter="url(#tinybloom)" opacity="0.65"/>
  <line x1="255" y1="254" x2="175" y2="335" stroke="#FF5518" stroke-width="2.2" stroke-linecap="round" filter="url(#spark)" opacity="0.7"/>
  <line x1="255" y1="254" x2="135" y2="295" stroke="#FFB040" stroke-width="1.5" stroke-linecap="round" filter="url(#spark)" opacity="0.65"/>
  <line x1="255" y1="254" x2="225" y2="138" stroke="white" stroke-width="1.2" stroke-linecap="round" filter="url(#tinybloom)" opacity="0.6"/>

  <!-- Spark tip dots -->
  <circle cx="322" cy="163" r="5" fill="white" filter="url(#spark)" opacity="0.95"/>
  <circle cx="357" cy="186" r="3.5" fill="#FFE080" filter="url(#spark)" opacity="0.9"/>
  <circle cx="301" cy="132" r="4" fill="white" filter="url(#spark)" opacity="0.85"/>
  <circle cx="184" cy="173" r="4.5" fill="#FFB040" filter="url(#spark)" opacity="0.85"/>
  <circle cx="153" cy="213" r="3" fill="white" filter="url(#spark)" opacity="0.75"/>
  <circle cx="372" cy="278" r="3.5" fill="#FF8830" filter="url(#spark)" opacity="0.8"/>
  <circle cx="382" cy="233" r="2.5" fill="white" filter="url(#tinybloom)" opacity="0.7"/>
  <circle cx="173" cy="337" r="3.5" fill="#FF6620" filter="url(#spark)" opacity="0.75"/>
  <circle cx="133" cy="297" r="3" fill="#FFB040" filter="url(#spark)" opacity="0.7"/>
  <circle cx="224" cy="136" r="3" fill="white" filter="url(#tinybloom)" opacity="0.65"/>

  <!-- Tiny floating embers -->
  <circle cx="340" cy="142" r="2" fill="white" opacity="0.7"/>
  <circle cx="272" cy="118" r="1.8" fill="#FFE080" opacity="0.65"/>
  <circle cx="395" cy="255" r="1.8" fill="white" opacity="0.6"/>
  <circle cx="148" cy="248" r="1.8" fill="#FFB040" opacity="0.6"/>
  <circle cx="200" cy="360" r="1.8" fill="#FF8830" opacity="0.6"/>
  <circle cx="310" cy="302" r="1.5" fill="white" opacity="0.5"/>
  <circle cx="235" cy="192" r="1.5" fill="white" opacity="0.5"/>
  <circle cx="285" cy="168" r="1.2" fill="#FFE080" opacity="0.45"/>
  <circle cx="365" cy="207" r="1.2" fill="white" opacity="0.4"/>
  <circle cx="165" cy="362" r="1.2" fill="white" opacity="0.4"/>

  <!-- Speed lines at blade tip -->
  <line x1="404" y1="36" x2="448" y2="14" stroke="white" stroke-width="0.9" opacity="0.28"/>
  <line x1="415" y1="25" x2="460" y2="8"  stroke="#FFD080" stroke-width="0.6" opacity="0.22"/>
  <line x1="393" y1="47" x2="432" y2="22" stroke="white" stroke-width="0.6" opacity="0.2"/>

  <!-- Speed lines at blade tail -->
  <line x1="106" y1="474" x2="62" y2="498" stroke="white" stroke-width="0.9" opacity="0.28"/>
  <line x1="116" y1="485" x2="70" y2="508" stroke="#FFD080" stroke-width="0.6" opacity="0.22"/>
  <line x1="96"  y1="464" x2="54" y2="488" stroke="white" stroke-width="0.6" opacity="0.2"/>
</svg>`;

const html = `<!doctype html>
<html><head>
<meta charset="UTF-8">
<style>*{margin:0;padding:0;}html,body{width:512px;height:512px;background:#060503;}</style>
</head><body>${svg}</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 512, height: 512 });
await page.setContent(html, { waitUntil: 'networkidle' });

const buf512 = await page.screenshot({ type:'png', clip:{x:0,y:0,width:512,height:512} });
writeFileSync('public/icon-512.png', buf512);
console.log('icon-512.png written');

await page.setViewportSize({ width: 192, height: 192 });
await page.evaluate(() => {
  const s = document.querySelector('svg');
  s.setAttribute('width','192'); s.setAttribute('height','192');
});
const buf192 = await page.screenshot({ type:'png', clip:{x:0,y:0,width:192,height:192} });
writeFileSync('public/icon-192.png', buf192);
console.log('icon-192.png written');

await browser.close();
