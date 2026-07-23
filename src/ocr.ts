import { createWorker } from 'tesseract.js';

export interface ReceiptOcrResult {
  rawText: string;
  storeName?: string;
  amount?: number;
  date?: string; // YYYY-MM-DD
}

let workerPromise: ReturnType<typeof createWorker> | null = null;

function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker('jpn+eng');
  }
  return workerPromise;
}

export async function recognizeReceipt(imageDataUrl: string): Promise<ReceiptOcrResult> {
  const worker = await getWorker();
  const { data } = await worker.recognize(imageDataUrl);
  const text = data.text ?? '';
  return {
    rawText: text,
    storeName: guessStoreName(text),
    amount: guessAmount(text),
    date: guessDate(text),
  };
}

const TOTAL_KEYWORDS = ['合計', '合  計', 'ご 合計', '税込合計', '御会計', 'お会計', '会計', '総額', '小計'];

function toHalfWidth(s: string): string {
  return s.replace(/[０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xfee0));
}

function guessAmount(text: string): number | undefined {
  const normalized = toHalfWidth(text);
  const lines = normalized.split(/\r?\n/);
  const numberPattern = /[¥￥]?\s*([0-9][0-9,]{1,9})\s*円?/g;

  // 1) Look for a line containing a total keyword and grab the number on it (or the next line).
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

  // 2) Fallback: largest plausible currency-looking number in the whole receipt.
  const all = [...normalized.matchAll(numberPattern)]
    .map(m => parseInt(m[1].replace(/,/g, ''), 10))
    .filter(n => n > 0 && n < 10_000_000);
  if (all.length === 0) return undefined;
  return Math.max(...all);
}

function guessDate(text: string): string | undefined {
  const normalized = toHalfWidth(text);

  // YYYY/MM/DD or YYYY-MM-DD or YYYY年MM月DD日
  const western = normalized.match(/(20\d{2})[/年.-](\d{1,2})[/月.-](\d{1,2})/);
  if (western) {
    const [, y, m, d] = western;
    return toIsoDate(parseInt(y, 10), parseInt(m, 10), parseInt(d, 10));
  }

  // Japanese era: 令和R, 平成H followed by year.month.day
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

function guessStoreName(text: string): string | undefined {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  for (const line of lines.slice(0, 5)) {
    const stripped = line.replace(/[0-9¥￥,.\-/年月日:：]/g, '').trim();
    if (stripped.length >= 2 && stripped.length <= 20) {
      return line.length > 20 ? line.slice(0, 20) : line;
    }
  }
  return undefined;
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
