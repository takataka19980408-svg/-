export type GamblingCategory =
  | 'pachinko'
  | 'slot'
  | 'baccarat'
  | 'horse'
  | 'boat'
  | 'cycle'
  | 'mahjong'
  | 'other';

export interface Store {
  id: string;
  name: string;
  createdAt: string;
}

export interface GamblingRecord {
  id: string;
  date: string;
  time?: string;
  storeId: string;
  storeName: string;
  category: GamblingCategory;
  inAmount: number;
  outAmount: number;
  profit: number;
  memo?: string;
  createdAt: string;
}

export interface AppSettings {
  dayBoundaryHour: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  dayBoundaryHour: 6,
};

export const CATEGORY_LABELS: Record<GamblingCategory, string> = {
  pachinko: 'パチンコ',
  slot: 'スロット',
  baccarat: 'バカラ',
  horse: '競馬',
  boat: '競艇',
  cycle: '競輪',
  mahjong: '麻雀',
  other: 'その他',
};

export const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

export type MainScreen = 'home' | 'history' | 'analysis' | 'ranking' | 'settings';
