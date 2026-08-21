export interface BaccaratRecord {
  id: string;
  date: string;
  table: string;
  dealerIds: string[];
  shuffle: string;
  customerIds?: string[];
  // 客が2人以上の場合のみ使用。客ID→その客への収支配分（手入力、円）。
  // 客が1人以下の場合は未使用（店収支がそのままその客の収支になる）。
  customerProfits?: Record<string, number>;
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
