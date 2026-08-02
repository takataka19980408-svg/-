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
      // SPARSE_TEXT: tested head-to-head against AUTO and SINGLE_COLUMN on
      // both synthetic and real receipt photos — it's the only mode that
      // reliably reads all the way down to the 合計/total line on a real,
      // imperfectly-photographed receipt (background, tilt, small dense
      // print). It emits one fragment per line rather than reconstructed
      // paragraphs, which is why the text-parsing helpers below work off
      // whitespace-stripped lines and check a small window on both sides of
      // a keyword instead of assuming reliable top-to-bottom line order.
      await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
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
  { match: ['ザ・ビッグエクスプレス', 'ザ・ビッグ'], label: 'ザ・ビッグ', company: 'イオン' },
  { match: ['マックスバリュ'], label: 'マックスバリュ', company: 'イオン' },
  { match: ['ダイエー'], label: 'ダイエー', company: 'イオン' },
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

// Top lines of a receipt only — a chain name appearing further down is more
// likely a promotional footer ("「イオン琉球」で検索") than the store's own
// name line, and using it verbatim would show the user a slogan instead.
const CHAIN_NAME_LINE_LIMIT = 5;

function matchKnownChain(rawText: string): { name: string; company: string; nameIsReliable: boolean } | null {
  const normLines = rawText.split(/\r?\n/).map(l => normalize(l));
  for (const chain of KNOWN_CHAINS) {
    for (const m of chain.match) {
      const lineIdx = normLines.findIndex(l => l.includes(m));
      if (lineIdx === -1) continue;
      const line = normLines[lineIdx];
      // Prefer the full matched line as the store name (often includes a branch
      // suffix like "渋谷店"), falling back to the bare chain label.
      const usableLine = line.length <= 24 && line.length >= m.length && !/[「」]/.test(line);
      const nameIsReliable = usableLine && lineIdx < CHAIN_NAME_LINE_LIMIT;
      const name = usableLine ? line : chain.label;
      return { name, company: chain.company, nameIsReliable };
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
    // A logo/graphic (e.g. a brand mark like "AEON") often OCRs as a short
    // fragment mixing a couple of stray Latin letters with a lone kana — real
    // Japanese store names are predominantly CJK script, so require at least
    // two CJK characters before trusting a candidate as the name.
    const cjkCount = (stripped.match(new RegExp(CJK_RANGE, 'g')) ?? []).length;
    if (stripped.length >= 2 && stripped.length <= 20 && cjkCount >= 2) {
      return line.length > 20 ? line.slice(0, 20) : line;
    }
  }
  return undefined;
}

function resolveStoreName(rawText: string): { name: string; company?: string } | undefined {
  const registered = matchRegisteredStore(rawText);
  if (registered) return registered;

  const chain = matchKnownChain(rawText);
  const guess = heuristicStoreName(rawText);

  if (chain) {
    // The chain dictionary's company mapping is reliable regardless of where
    // the brand name was found, but the NAME should come from the top of the
    // receipt (where the store actually prints its own name/branch) rather
    // than wherever the brand happened to be mentioned in the OCR text.
    return { name: chain.nameIsReliable ? chain.name : (guess ?? chain.name), company: chain.company };
  }

  return guess ? { name: guess } : undefined;
}

// ── Amount / date extraction ─────────────────────────────────
// Matched against whitespace-stripped lines (see `lines` in guessAmount).
const TOTAL_KEYWORDS = ['合計', 'ご合計', '税込合計', '御会計', 'お会計', '会計', '総額', '小計'];
const PAYMENT_LINE_KEYWORDS = ['預かり', '預り', 'お預り', '現金', 'お釣り', '釣銭', 'おつり', 'カード', 'クレジット'];

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

// A heavily degraded photo sometimes has Tesseract split a comma-grouped
// total ("3,792") into two separate bare-digit lines ("3" then "792") with
// nothing else on either — recombine those, conservatively (only when each
// line is truly just digits, so a real item line like "おにぎり 150" can
// never trigger this).
function mergedFragmentAmounts(lines: string[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < lines.length - 1; i++) {
    const a = lines[i], b = lines[i + 1];
    if (/^[0-9]{1,2}$/.test(a) && /^[0-9]{3,4}$/.test(b)) {
      const n = parseInt(a + b, 10);
      if (n > 0 && n < 10_000_000) out.push(n);
    }
  }
  return out;
}

function guessAmount(text: string): number | undefined {
  const normalized = toHalfWidth(text);
  // PSM.SPARSE_TEXT (used for photos with background around the receipt)
  // emits one recognized fragment per line, typically with a blank line
  // after every single one — so anything checking "the next line" needs to
  // work over non-blank lines, or it silently lands on blanks and falls
  // through to a less reliable tier. Internal whitespace is stripped too:
  // Tesseract frequently hallucinates a space between adjacent CJK glyphs
  // (see collapseCjkSpaces), which would otherwise break a keyword substring
  // check like "お預かり" split into "お 預 か り".
  const lines = normalized.split(/\r?\n/)
    .map(l => l.replace(/[\s\u3000]+/g, ''))
    .filter(l => l.length > 0);

  // 1. A line naming the total, or within a couple of lines of it. Checked on
  // both sides: PSM.SPARSE_TEXT (used for photos with background) does not
  // reliably emit fragments in top-to-bottom reading order, so the amount can
  // end up recognized just *before* the "合計" fragment instead of after it.
  for (let i = 0; i < lines.length; i++) {
    if (TOTAL_KEYWORDS.some(k => lines[i].includes(k))) {
      // Closest lines first, so an unrelated number two lines away never
      // outranks one immediately adjacent to the keyword. Payment lines
      // (tendered cash / change) are excluded even when adjacent — "合計"
      // sitting right next to "お預かり1000円" would otherwise win on
      // proximity alone and report the wrong number.
      const window = [lines[i], lines[i + 1] ?? '', lines[i - 1] ?? '', lines[i + 2] ?? '', lines[i - 2] ?? '']
        .filter(l => !PAYMENT_LINE_KEYWORDS.some(k => l.includes(k)));
      for (const c of window) {
        const valid = extractAmounts(c);
        if (valid.length > 0) return Math.max(...valid);
      }
      const contextLines = lines.slice(Math.max(0, i - 2), i + 3)
        .filter(l => !PAYMENT_LINE_KEYWORDS.some(k => l.includes(k)));
      const merged = mergedFragmentAmounts(contextLines);
      if (merged.length > 0) return Math.max(...merged);
    }
  }

  // 2. No keyword matched (common on a blurry/damaged receipt, or when "合計"
  // itself misreads badly enough to not contain any known keyword substring).
  // The total is almost always printed in the bottom portion of the receipt,
  // below the itemized lines — but so are the tendered-cash and change lines,
  // which are typically >= and <= the total respectively and would otherwise
  // make "largest number near the bottom" pick the wrong one. Drop those
  // lines before taking the max.
  const bottomLines = lines.slice(Math.floor(lines.length * 0.6))
    .filter(l => !PAYMENT_LINE_KEYWORDS.some(k => l.includes(k)));
  const bottomValid = [...extractAmounts(bottomLines.join('\n')), ...mergedFragmentAmounts(bottomLines)];
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
// slightly damp thermal paper, background clutter around the paper, and real
// thermal-print text is small and dense. A single global contrast stretch
// (the original approach) does nothing for a shadow gradient across the page.
// This pipeline instead:
//   1. Converts to grayscale and does a cheap global percentile contrast
//      stretch (conditions the image for the next step; fast, O(n)).
//   2. Applies a light 3x3 blur to suppress JPEG/sensor noise before
//      thresholding.
//   3. Runs Sauvola local-adaptive binarization: the threshold at each pixel
//      is derived from the mean/stddev of its own neighborhood, computed in
//      O(1) per pixel via summed-area tables. Unlike a single global
//      threshold, this cleanly separates text from paper even when a shadow
//      or damp patch makes one part of the receipt much darker than another.
// Working resolution is capped fairly high (up to 2800px on the long side,
// window radius 10) — verified against a real supermarket receipt photo that
// small, dense thermal print needs materially more pixels than a synthetic
// large-font test receipt to come through legibly.
//
// Deliberately does NOT attempt to auto-crop out background clutter. Two
// different approaches were tried and both proved unreliable enough to ship:
//   - Ink-density (Sauvola) projection profile: background texture reads as
//     "ink" just as readily as real text, so the crop box never tightens.
//   - Brightness (Otsu) connected-component box: correctly isolates the
//     paper from a textured desk, but a strong shadow ON the receipt itself
//     reads as "not paper" and silently crops away real, still-legible text
//     (verified on the shadow-gradient case, which the binarization step
//     alone already handles correctly — the crop only made it worse).
// Tesseract's own layout analysis (PSM.SPARSE_TEXT, see getWorker above)
// handles a receipt sitting in a larger frame better than either hand-rolled
// heuristic did in testing.
function preprocessForOcr(dataUrl: string): Promise<string> {
  return withScaledImageData(dataUrl, 1800, 2800, (ctx, imageData, w, h) => {
    const n = w * h;
    let gray = toGrayscale(imageData.data, n);
    gray = percentileStretch(gray, n, 0.02, 0.98);
    gray = boxBlur3(gray, w, h);
    const binary = sauvolaBinarize(gray, w, h, 10, 0.2, 128);

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
