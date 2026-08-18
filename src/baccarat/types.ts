export interface BaccaratRecord {
  id: string;
  date: string;
  table: string;
  dealer: string;
  shuffle: string;
  customerIds?: string[];
  startAmount: number;
  endAmount: number;
  profit: number; // 店の収支 = エンド - スタート
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
