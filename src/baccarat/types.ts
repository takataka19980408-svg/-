export interface BaccaratRecord {
  id: string;
  date: string;
  table: string;
  dealer: string;
  shuffle: string;
  customerId?: string;
  inAmount: number;
  outAmount: number;
  profit: number; // 客OUT - 客IN（店の収支はこの符号反転）
  memo?: string;
  createdAt: string;
}

export type MasterKind = 'dealers' | 'shuffles' | 'tables' | 'customers';

export interface BaccaratMasters {
  dealers: string[];
  shuffles: string[];
  tables: string[];
  customers: string[];
}

export const DEFAULT_MASTERS: BaccaratMasters = {
  dealers: [],
  shuffles: [],
  tables: [],
  customers: [],
};

export const MASTER_LABELS: Record<MasterKind, string> = {
  dealers: 'ディーラー',
  shuffles: 'シャッフル方式',
  tables: '卓',
  customers: '客ID',
};

export type BaccaratScreen = 'record' | 'history' | 'summary' | 'masters';
