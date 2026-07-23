export type ExpenseCategory =
  | 'food'
  | 'dining'
  | 'daily'
  | 'transport'
  | 'entertainment'
  | 'fashion'
  | 'medical'
  | 'housing'
  | 'other';

export interface CategoryInfo {
  label: string;
  colorVar: string; // CSS custom property, defined for both light/dark in index.css
}

// Fixed identity → color mapping (dataviz categorical order). Never reassigned by rank.
export const CATEGORY_INFO: Record<ExpenseCategory, CategoryInfo> = {
  food:          { label: '食費',       colorVar: 'var(--cat-food)' },
  dining:        { label: '外食',       colorVar: 'var(--cat-dining)' },
  daily:         { label: '日用品',     colorVar: 'var(--cat-daily)' },
  transport:     { label: '交通',       colorVar: 'var(--cat-transport)' },
  entertainment: { label: '娯楽',       colorVar: 'var(--cat-entertainment)' },
  fashion:       { label: '衣服・美容', colorVar: 'var(--cat-fashion)' },
  medical:       { label: '医療',       colorVar: 'var(--cat-medical)' },
  housing:       { label: '住居・光熱', colorVar: 'var(--cat-housing)' },
  other:         { label: 'その他',     colorVar: 'var(--cat-other)' },
};

export const CATEGORY_ORDER: ExpenseCategory[] = [
  'food', 'dining', 'daily', 'transport', 'entertainment', 'fashion', 'medical', 'housing', 'other',
];

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = Object.fromEntries(
  CATEGORY_ORDER.map(c => [c, CATEGORY_INFO[c].label]),
) as Record<ExpenseCategory, string>;

export interface Store {
  id: string;
  name: string;
  company?: string;
  category: ExpenseCategory;
  createdAt: string;
}

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  storeId?: string;
  storeName: string;
  company: string;
  category: ExpenseCategory;
  amount: number;
  memo?: string;
  receiptImage?: string; // compressed dataURL thumbnail, optional
  createdAt: string;
}

export interface AppSettings {
  monthlyBudget: number | null;
  saveReceiptImages: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  monthlyBudget: null,
  saveReceiptImages: true,
};

export type MainScreen = 'home' | 'history' | 'analysis' | 'settings';
