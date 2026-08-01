import { createWorker, OEM, PSM } from 'tesseract.js';
import { getStores } from './storage';

export interface ReceiptOcrResult {
  rawText: string;
  storeName?: string;
  company?: string;
  amount?: number;
  date?: string; // YYYY-MM-DD
}

let workerPromise: ReturnType<typeof createWorker> | null = null;

// Self-hosted under public/tesseract-assets — avoids depending on the jsdelivr CDN
// at runtime (which is unreachable on some networks/proxies, and would otherwise
// break OCR entirely and defeat the offline-PWA design). Downloaded lazily on the
// first receipt scan and cached by the browser afterward.
const ASSET_BASE = `${import.meta.env.BASE_URL}tesseract-assets/`;

async function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker('jpn', OEM.LSTM_ONLY, {
      workerPath: `${ASSET_BASE}worker.min.js`,
      corePath: `${ASSET_BASE}core/`,
      langPath: `${ASSET_BASE}tessdata`,
    }).then(async worker => {
      // AUTO: a phone photo usually includes some background/desk around the
      // receipt (and sometimes a slight tilt), so we rely on Tesseract's own
      // layout analysis to find the text block(s) rather than assuming the
      // whole frame is one clean column of text.
      await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO });
      return worker;
    });
  }
  return workerPromise;
}

const MIN_USABLE_TEXT_LENGTH = 8;

export async function recognizeReceipt(imageDataUrl: string): Promise<ReceiptOcrResult> {
  const worker = await getWorker();

  const preprocessed = await preprocessForOcr(imageDataUrl).catch(() => imageDataUrl);
  let text = ((await worker.recognize(preprocessed)).data.text ?? '').trim();

  // Local-adaptive binarization occasionally backfires — a hard shadow or paper
  // edge can binarize into a solid border that Tesseract's layout analysis reads
  // as a non-text graphic and skips entirely, returning ~nothing. If that
  // happens, retry once against a gentler pass (grayscale + contrast only, no
  // thresholding) rather than leaving the user with a silent failure.
  if (text.length < MIN_USABLE_TEXT_LENGTH) {
    const gentle = await gentlePreprocessForOcr(imageDataUrl).catch(() => imageDataUrl);
    const retryText = ((await worker.recognize(gentle)).data.text ?? '').trim();
    if (retryText.length > text.length) text = retryText;
  }

  const store = resolveStoreName(text);

  return {
    rawText: text,
    storeName: store?.name,
    company: store?.company,
    amount: guessAmount(text),
    date: guessDate(text),
  };
}

// ── Store name resolution ────────────────────────────────────
// Three-tier strategy, most reliable first:
//   1. Match against the user's own previously-registered stores (repeat visits —
//      by far the most common case in day-to-day household bookkeeping).
//   2. Match against a built-in dictionary of common Japanese retail chains.
//   3. Fall back to a line heuristic over the raw OCR text.
// OCR from a phone photo is never 100% reliable, which is why the record screen
// always shows an editable confirmation step regardless of which tier matched.

interface KnownChain { match: string[]; label: string; company: string }

const KNOWN_CHAINS: KnownChain[] = [
  // コンビニ
  { match: ['セブンイレブン', 'セブン-イレブン', 'セブン－イレブン'], label: 'セブンイレブン', company: 'セブン&アイ・ホールディングス' },
  { match: ['ファミリーマート', 'ファミマ'], label: 'ファミリーマート', company: 'ファミリーマート' },
  { match: ['ローソンストア', 'ローソン'], label: 'ローソン', company: 'ローソン' },
  { match: ['ミニストップ'], label: 'ミニストップ', company: 'ミニストップ' },
  { match: ['セイコーマート'], label: 'セイコーマート', company: 'セコマ' },
  // スーパー
  { match: ['イオンスタイル', 'イオン'], label: 'イオン', company: 'イオン' },
  { match: ['西友'], label: '西友', company: '西友' },
  { match: ['ライフ'], label: 'ライフ', company: 'ライフコーポレーション' },
  { match: ['マルエツ'], label: 'マルエツ', company: 'マルエツ' },
  { match: ['サミットストア', 'サミット'], label: 'サミット', company: 'サミット' },
  { match: ['オーケーストア', 'オーケー'], label: 'オーケー', company: 'オーケー' },
  { match: ['業務スーパー'], label: '業務スーパー', company: '神戸物産' },
  { match: ['ヤオコー'], label: 'ヤオコー', company: 'ヤオコー' },
  { match: ['いなげや'], label: 'いなげや', company: 'いなげや' },
  { match: ['東急ストア'], label: '東急ストア', company: '東急ストア' },
  { match: ['成城石井'], label: '成城石井', company: '成城石井' },
  { match: ['コストコ'], label: 'コストコ', company: 'コストコ' },
  { match: ['ドン・キホーテ', 'ドンキホーテ'], label: 'ドン・キホーテ', company: 'パン・パシフィック・インターナショナル' },
  { match: ['サミットストア'], label: 'サミットストア', company: 'サミット' },
  { match: ['まいばすけっと'], label: 'まいばすけっと', company: 'イオン' },
  // ドラッグストア
  { match: ['マツモトキヨシ', 'マツキヨ'], label: 'マツモトキヨシ', company: 'マツモトキヨシ' },
  { match: ['ウエルシア'], label: 'ウエルシア', company: 'ウエルシアホールディングス' },
  { match: ['ツルハドラッグ', 'ツルハ'], label: 'ツルハドラッグ', company: 'ツルハホールディングス' },
  { match: ['サンドラッグ'], label: 'サンドラッグ', company: 'サンドラッグ' },
  { match: ['ココカラファイン'], label: 'ココカラファイン', company: 'ココカラファイン' },
  { match: ['スギ薬局'], label: 'スギ薬局', company: 'スギホールディングス' },
  { match: ['クリエイトエス・ディー', 'クリエイト'], label: 'クリエイト', company: 'クリエイトエス・ディー' },
  // 100均・ホームセンター
  { match: ['ダイソー'], label: 'ダイソー', company: '大創産業' },
  { match: ['セリア'], label: 'セリア', company: 'セリア' },
  { match: ['キャンドゥ'], label: 'キャンドゥ', company: 'キャンドゥ' },
  { match: ['ニトリ'], label: 'ニトリ', company: 'ニトリホールディングス' },
  { match: ['カインズ'], label: 'カインズ', company: 'カインズ' },
  { match: ['コーナン'], label: 'コーナン', company: 'コーナン商事' },
  { match: ['無印良品'], label: '無印良品', company: '良品計画' },
  // 飲食
  { match: ['マクドナルド'], label: 'マクドナルド', company: '日本マクドナルド' },
  { match: ['スターバックス'], label: 'スターバックス', company: 'スターバックス コーヒー ジャパン' },
  { match: ['ドトールコーヒー', 'ドトール'], label: 'ドトールコーヒー', company: 'ドトール・日レスホールディングス' },
  { match: ['すき家'], label: 'すき家', company: 'ゼンショーホールディングス' },
  { match: ['吉野家'], label: '吉野家', company: '吉野家ホールディングス' },
  { match: ['松屋'], label: '松屋', company: '松屋フーズ' },
  { match: ['サイゼリヤ'], label: 'サイゼリヤ', company: 'サイゼリヤ' },
  { match: ['丸亀製麺'], label: '丸亀製麺', company: 'トリドールホールディングス' },
  { match: ['ガスト'], label: 'ガスト', company: 'すかいらーくホールディングス' },
  { match: ['ケンタッキーフライドチキン', 'ケンタッキー'], label: 'ケンタッキーフライドチキン', company: '日本KFCホールディングス' },
  // ガソリンスタンド等
  { match: ['ENEOS', 'エネオス'], label: 'ENEOS', company: 'ENEOS' },
  { match: ['出光'], label: '出光', company: '出光興産' },
];

function normalize(text: string): string {
  return toHalfWidth(text).replace(/[\s\u3000]+/g, '');
}

function matchKnownChain(rawText: string): { name: string; company: string } | null {
  const normLines = rawText.split(/\r?\n/).map(l => normalize(l));
  for (const chain of KNOWN_CHAINS) {
    for (const m of chain.match) {
      const lineIdx = normLines.findIndex(l => l.includes(m));
      if (lineIdx === -1) continue;
      const line = normLines[lineIdx];
      // Prefer the full matched line as the store name (often includes a branch
      // suffix like "渋谷店"), falling back to the bare chain label.
      const name = line.length <= 24 && line.length >= m.length ? line : chain.label;
      return { name, company: chain.company };
    }
  }
  return null;
}

function matchRegisteredStore(rawText: string): { name: string; company: string } | null {
  const stores = getStores();
  if (stores.length === 0) return null;
  const norm = normalize(rawText);
  const sorted = [...stores].sort((a, b) => b.name.length - a.name.length);
  for (const s of sorted) {
    const key = normalize(s.name);
    if (key.length >= 2 && norm.includes(key)) {
      return { name: s.name, company: s.company || s.name };
    }
  }
  return null;
}

const BOILERPLATE = [
  'レシート', '領収書', '領収証', 'ご利用明細', 'クレジット', '電話', 'TEL', 'FAX',
  '登録番号', 'インボイス', 'お客様', '様', 'No.', 'レジ', '責', '担当',
];

function looksLikeBoilerplate(line: string): boolean {
  if (BOILERPLATE.some(w => line.includes(w))) return true;
  if (/〒?\d{3}-?\d{4}/.test(line)) return true; // postal code
  if (/\d{2,4}-\d{2,4}-\d{3,4}/.test(line)) return true; // phone number
  if (/20\d{2}[/年.-]\d{1,2}[/月.-]\d{1,2}/.test(line)) return true; // date line
  const digitRatio = (line.match(/[0-9]/g)?.length ?? 0) / Math.max(line.length, 1);
  if (digitRatio > 0.4) return true;
  return false;
}

// Tesseract frequently hallucinates a word-space between adjacent CJK glyphs
// (more so on large/bold title text) — real Japanese store names never contain
// a deliberate space there, so collapsing it is a safe, strict improvement.
const CJK_RANGE = /[぀-ヿ㐀-鿿＀-￯]/;

function collapseCjkSpaces(s: string): string {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (/\s/.test(ch)) {
      const prev = out[out.length - 1] ?? '';
      const next = s[i + 1] ?? '';
      if (CJK_RANGE.test(prev) && CJK_RANGE.test(next)) continue;
    }
    out += ch;
  }
  return out;
}

function heuristicStoreName(rawText: string): string | undefined {
  const lines = rawText.split(/\r?\n/).map(l => collapseCjkSpaces(l.trim())).filter(l => l.length > 0);
  for (const line of lines.slice(0, 8)) {
    if (looksLikeBoilerplate(line)) continue;
    const stripped = line.replace(/[0-9¥￥,.\-/:：]/g, '').trim();
    if (stripped.length >= 2 && stripped.length <= 20) {
      return line.length > 20 ? line.slice(0, 20) : line;
    }
  }
  return undefined;
}

function resolveStoreName(rawText: string): { name: string; company?: string } | undefined {
  const registered = matchRegisteredStore(rawText);
  if (registered) return registered;

  const chain = matchKnownChain(rawText);
  if (chain) return chain;

  const guess = heuristicStoreName(rawText);
  return guess ? { name: guess } : undefined;
}

// ── Amount / date extraction ─────────────────────────────────
const TOTAL_KEYWORDS = ['合計', '合  計', 'ご 合計', '税込合計', '御会計', 'お会計', '会計', '総額', '小計'];

function toHalfWidth(s: string): string {
  return s.replace(/[０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xfee0));
}

function extractAmounts(text: string): number[] {
  const numberPattern = /[¥￥]?\s*([0-9][0-9,]{1,9})\s*円?/g;
  const out: number[] = [];
  for (const m of text.matchAll(numberPattern)) {
    const raw = m[1];
    // A leading zero on a multi-digit run is never a real yen amount — it's
    // almost always two OCR tokens (e.g. a stray mark + the real number)
    // fused together, which would otherwise produce a wildly wrong total.
    if (raw.length > 1 && raw[0] === '0') continue;
    const n = parseInt(raw.replace(/,/g, ''), 10);
    if (n > 0 && n < 10_000_000) out.push(n);
  }
  return out;
}

function guessAmount(text: string): number | undefined {
  const normalized = toHalfWidth(text);
  const lines = normalized.split(/\r?\n/);

  // 1. A line naming the total, or the line right after it.
  for (let i = 0; i < lines.length; i++) {
    if (TOTAL_KEYWORDS.some(k => lines[i].includes(k))) {
      for (const c of [lines[i], lines[i + 1] ?? '']) {
        const valid = extractAmounts(c);
        if (valid.length > 0) return Math.max(...valid);
      }
    }
  }

  // 2. No keyword matched (common on a blurry/damaged receipt) — the total is
  // almost always printed in the bottom portion of the receipt, below the
  // itemized lines, so prefer numbers found there over ones from the middle.
  const bottomStart = Math.floor(lines.length * 0.6);
  const bottomValid = extractAmounts(lines.slice(bottomStart).join('\n'));
  if (bottomValid.length > 0) return Math.max(...bottomValid);

  // 3. Last resort: largest plausible amount anywhere in the receipt.
  const all = extractAmounts(normalized);
  if (all.length === 0) return undefined;
  return Math.max(...all);
}

function guessDate(text: string): string | undefined {
  const normalized = toHalfWidth(text);

  // Tier 1: the expected separator characters.
  const western = normalized.match(/(20\d{2})[/年.-](\d{1,2})[/月.-](\d{1,2})/);
  if (western) {
    const [, y, m, d] = western;
    const iso = toIsoDate(parseInt(y, 10), parseInt(m, 10), parseInt(d, 10));
    if (iso) return iso;
  }

  // Tier 2: a thin "/" is one of the most commonly misread glyphs in OCR (easily
  // confused with "7", "1", "7" etc.), so if the strict separator match failed,
  // retry allowing any single stray character in its place.
  const westernFuzzy = normalized.match(/(20\d{2}).(\d{1,2}).(\d{1,2})(?!\d)/);
  if (westernFuzzy) {
    const [, y, m, d] = westernFuzzy;
    const iso = toIsoDate(parseInt(y, 10), parseInt(m, 10), parseInt(d, 10));
    if (iso) return iso;
  }

  // Tier 3: separator dropped entirely — a bare YYYYMMDD run.
  const westernBare = normalized.match(/20(\d{2})(\d{2})(\d{2})(?!\d)/);
  if (westernBare) {
    const [, yy, m, d] = westernBare;
    const iso = toIsoDate(2000 + parseInt(yy, 10), parseInt(m, 10), parseInt(d, 10));
    if (iso) return iso;
  }

  const era = normalized.match(/[令和RH平成](\d{1,2})[年.\-/](\d{1,2})[月.\-/](\d{1,2})/);
  if (era) {
    const eraYear = parseInt(era[1], 10);
    const isReiwa = /[令R]/.test(normalized[normalized.indexOf(era[0])] ?? '');
    const y = isReiwa ? 2018 + eraYear : 1988 + eraYear;
    return toIsoDate(y, parseInt(era[2], 10), parseInt(era[3], 10));
  }

  return undefined;
}

function toIsoDate(y: number, m: number, d: number): string | undefined {
  if (m < 1 || m > 12 || d < 1 || d > 31) return undefined;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export async function terminateOcrWorker(): Promise<void> {
  if (workerPromise) {
    const worker = await workerPromise;
    await worker.terminate();
    workerPromise = null;
  }
}

// ── Image helpers ────────────────────────────────────────────
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function compressImage(dataUrl: string, maxWidth = 480, quality = 0.6): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('canvas unsupported')); return; }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

// ── Receipt image preprocessing ──────────────────────────────
// Phone photos of receipts are rarely clean: uneven lighting/shadows, faded or
// slightly damp thermal paper, background clutter around the paper. A single
// global contrast stretch (the previous approach) does nothing for a shadow
// gradient across the page. This pipeline instead:
//   1. Converts to grayscale and does a cheap global percentile contrast
//      stretch (conditions the image for the next step; fast, O(n)).
//   2. Applies a light 3x3 blur to suppress JPEG/sensor noise before
//      thresholding.
//   3. Runs Sauvola local-adaptive binarization: the threshold at each pixel
//      is derived from the mean/stddev of its own neighborhood, computed in
//      O(1) per pixel via summed-area tables. Unlike a single global
//      threshold, this cleanly separates text from paper even when a shadow
//      or damp patch makes one part of the receipt much darker than another.
// Deliberately does NOT attempt to auto-crop out background clutter — tested
// against a photo with a textured desk background and it was not reliable
// (background texture reads as "ink" too, defeating the crop). Tesseract's
// own layout analysis (PSM.AUTO) handles a receipt sitting in a larger frame
// better than a hand-rolled heuristic does.
function preprocessForOcr(dataUrl: string): Promise<string> {
  return withScaledImageData(dataUrl, 1200, 2000, (ctx, imageData, w, h) => {
    const n = w * h;
    let gray = toGrayscale(imageData.data, n);
    gray = percentileStretch(gray, n, 0.02, 0.98);
    gray = boxBlur3(gray, w, h);
    const binary = sauvolaBinarize(gray, w, h, 15, 0.2, 128);

    const out = imageData.data;
    for (let i = 0; i < n; i++) {
      const v = binary[i];
      const o = i * 4;
      out[o] = out[o + 1] = out[o + 2] = v;
    }
    ctx.putImageData(imageData, 0, 0);
  });
}

// Grayscale + global contrast stretch only — no local thresholding. Used as a
// fallback retry when the binarized pass comes back empty (see
// MIN_USABLE_TEXT_LENGTH above): less aggressive, so it can't misfire into a
// solid graphic border the way Sauvola occasionally does, at the cost of being
// less robust to shadows/fading than the primary pass.
function gentlePreprocessForOcr(dataUrl: string): Promise<string> {
  return withScaledImageData(dataUrl, 1200, 2000, (ctx, imageData, w, h) => {
    const n = w * h;
    const gray = percentileStretch(toGrayscale(imageData.data, n), n, 0.02, 0.98);
    const out = imageData.data;
    for (let i = 0; i < n; i++) {
      const v = gray[i];
      const o = i * 4;
      out[o] = out[o + 1] = out[o + 2] = v;
    }
    ctx.putImageData(imageData, 0, 0);
  });
}

function withScaledImageData(
  dataUrl: string,
  minLongSide: number,
  maxLongSide: number,
  process: (ctx: CanvasRenderingContext2D, imageData: ImageData, w: number, h: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const { w, h } = scaledDims(img.width, img.height, minLongSide, maxLongSide);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('canvas unsupported')); return; }
        ctx.drawImage(img, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        process(ctx, imageData, w, h);
        resolve(canvas.toDataURL('image/png'));
      } catch (e) {
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function scaledDims(w: number, h: number, minLongSide: number, maxLongSide: number): { w: number; h: number } {
  const longSide = Math.max(w, h);
  let scale = 1;
  if (longSide > maxLongSide) scale = maxLongSide / longSide;
  else if (longSide < minLongSide) scale = minLongSide / longSide;
  return { w: Math.max(1, Math.round(w * scale)), h: Math.max(1, Math.round(h * scale)) };
}

function toGrayscale(src: Uint8ClampedArray, n: number): Float32Array {
  const gray = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    gray[i] = 0.299 * src[o] + 0.587 * src[o + 1] + 0.114 * src[o + 2];
  }
  return gray;
}

// Histogram-based percentile stretch — O(n), independent of image size (unlike
// sorting every pixel, which gets slow on a multi-megapixel photo).
function percentileStretch(gray: Float32Array, n: number, loPct: number, hiPct: number): Float32Array {
  const hist = new Uint32Array(256);
  for (let i = 0; i < n; i++) hist[Math.max(0, Math.min(255, gray[i] | 0))]++;
  const loTarget = n * loPct, hiTarget = n * hiPct;
  let cum = 0, lo = 0, hi = 255, loFound = false;
  for (let v = 0; v < 256; v++) {
    cum += hist[v];
    if (!loFound && cum >= loTarget) { lo = v; loFound = true; }
    if (cum >= hiTarget) { hi = v; break; }
  }
  const range = Math.max(hi - lo, 1);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = Math.max(0, Math.min(255, ((gray[i] - lo) / range) * 255));
  return out;
}

function boxBlur3(src: Float32Array, w: number, h: number): Float32Array {
  const tmp = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - 1), x1 = Math.min(w - 1, x + 1);
      tmp[row + x] = (src[row + x0] + src[row + x] + src[row + x1]) / 3;
    }
  }
  const out = new Float32Array(w * h);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      const y0 = Math.max(0, y - 1), y1 = Math.min(h - 1, y + 1);
      out[y * w + x] = (tmp[y0 * w + x] + tmp[y * w + x] + tmp[y1 * w + x]) / 3;
    }
  }
  return out;
}

// Sauvola local-adaptive binarization via summed-area tables (integral images)
// for O(1)-per-pixel windowed mean/variance. k/R are the standard Sauvola
// constants; a lower k (0.2) is more permissive, keeping faint/thin strokes
// that a harsher threshold would erase — important for faded thermal print.
function sauvolaBinarize(
  gray: Float32Array, w: number, h: number, windowRadius: number, k: number, R: number,
): Uint8ClampedArray {
  const iw = w + 1;
  const sum = new Float64Array(iw * (h + 1));
  const sumSq = new Float64Array(iw * (h + 1));
  for (let y = 0; y < h; y++) {
    let rowSum = 0, rowSumSq = 0;
    const rowBase = (y + 1) * iw;
    const prevRowBase = y * iw;
    for (let x = 0; x < w; x++) {
      const v = gray[y * w + x];
      rowSum += v;
      rowSumSq += v * v;
      sum[rowBase + x + 1] = sum[prevRowBase + x + 1] + rowSum;
      sumSq[rowBase + x + 1] = sumSq[prevRowBase + x + 1] + rowSumSq;
    }
  }

  const out = new Uint8ClampedArray(w * h);
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - windowRadius), y1 = Math.min(h - 1, y + windowRadius);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - windowRadius), x1 = Math.min(w - 1, x + windowRadius);
      const area = (x1 - x0 + 1) * (y1 - y0 + 1);
      const A = y0 * iw + x0, B = y0 * iw + (x1 + 1), C = (y1 + 1) * iw + x0, D = (y1 + 1) * iw + (x1 + 1);
      const s = sum[D] - sum[B] - sum[C] + sum[A];
      const sSq = sumSq[D] - sumSq[B] - sumSq[C] + sumSq[A];
      const mean = s / area;
      const variance = Math.max(sSq / area - mean * mean, 0);
      const std = Math.sqrt(variance);
      const threshold = mean * (1 + k * (std / R - 1));
      out[y * w + x] = gray[y * w + x] > threshold ? 255 : 0;
    }
  }
  return out;
}
