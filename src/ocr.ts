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
      // SINGLE_COLUMN suits receipts: a narrow strip of lines with varying font size.
      await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_COLUMN });
      return worker;
    });
  }
  return workerPromise;
}

export async function recognizeReceipt(imageDataUrl: string): Promise<ReceiptOcrResult> {
  const worker = await getWorker();
  const preprocessed = await preprocessForOcr(imageDataUrl).catch(() => imageDataUrl);
  const { data } = await worker.recognize(preprocessed);
  const text = data.text ?? '';

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

function heuristicStoreName(rawText: string): string | undefined {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
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

function guessAmount(text: string): number | undefined {
  const normalized = toHalfWidth(text);
  const lines = normalized.split(/\r?\n/);
  const numberPattern = /[¥￥]?\s*([0-9][0-9,]{1,9})\s*円?/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (TOTAL_KEYWORDS.some(k => line.includes(k))) {
      const candidates = [line, lines[i + 1] ?? ''];
      for (const c of candidates) {
        const nums = [...c.matchAll(numberPattern)].map(m => parseInt(m[1].replace(/,/g, ''), 10));
        const valid = nums.filter(n => n > 0 && n < 10_000_000);
        if (valid.length > 0) return Math.max(...valid);
      }
    }
  }

  const all = [...normalized.matchAll(numberPattern)]
    .map(m => parseInt(m[1].replace(/,/g, ''), 10))
    .filter(n => n > 0 && n < 10_000_000);
  if (all.length === 0) return undefined;
  return Math.max(...all);
}

function guessDate(text: string): string | undefined {
  const normalized = toHalfWidth(text);

  const western = normalized.match(/(20\d{2})[/年.-](\d{1,2})[/月.-](\d{1,2})/);
  if (western) {
    const [, y, m, d] = western;
    return toIsoDate(parseInt(y, 10), parseInt(m, 10), parseInt(d, 10));
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

// Grayscale + percentile contrast stretch, and upscale small photos. Receipts are
// often low-contrast thermal prints; this materially improves Tesseract's read
// rate on store names and totals without a hard binarization threshold that could
// wipe out faint text under uneven lighting.
function preprocessForOcr(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const targetW = Math.min(Math.max(img.width, 1200), 2000);
      const scale = targetW / img.width;
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('canvas unsupported')); return; }
      ctx.drawImage(img, 0, 0, w, h);

      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;
      const n = w * h;
      const gray = new Uint8ClampedArray(n);
      for (let i = 0; i < n; i++) {
        const o = i * 4;
        gray[i] = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
      }

      const sorted = gray.slice().sort();
      const lo = sorted[Math.floor(n * 0.02)];
      const hi = sorted[Math.floor(n * 0.98)] || 255;
      const range = Math.max(hi - lo, 1);

      for (let i = 0; i < n; i++) {
        const v = Math.max(0, Math.min(255, ((gray[i] - lo) / range) * 255));
        const o = i * 4;
        data[o] = data[o + 1] = data[o + 2] = v;
      }
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}
