export type GamblingCategory =
  | 'pachinko'
  | 'slot'
  | 'baccarat'
  | 'horse'
  | 'boat'
  | 'cycle'
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

export const CATEGORY_LABELS: Record<GamblingCategory, string> = {
  pachinko: 'パチンコ',
  slot: 'スロット',
  baccarat: 'バカラ',
  horse: '競馬',
  boat: '競艇',
  cycle: '競輪',
  other: 'その他',
};

export type RankingTab = 'store' | 'category' | 'weekday' | 'month' | 'year';

export const RANKING_TAB_LABELS: Record<RankingTab, string> = {
  store: '店舗別',
  category: '種目別',
  weekday: '曜日別',
  month: '月別',
  year: '年別',
};

export const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];
