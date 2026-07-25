import { useRef, useState } from 'react';
import type { ExpenseCategory } from '../types';
import { CATEGORY_ORDER, CATEGORY_INFO } from '../types';
import {
  getStores, upsertStore, findStoreByName, saveExpense, generateId, todayStr, getSettings,
} from '../storage';
import { recognizeReceipt, fileToDataUrl, compressImage } from '../ocr';
import { C, FONT } from '../theme';
import { Card, PrimaryButton } from '../components/ui';

interface Props {
  onBack: () => void;
  onSaved: () => void;
}

type Mode = 'choose' | 'scanning' | 'form';

export function RecordScreen({ onBack, onSaved }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const settings = getSettings();

  const [mode, setMode] = useState<Mode>('choose');
  const [scanError, setScanError] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | undefined>(undefined);

  const [date, setDate] = useState(todayStr());
  const [storeName, setStoreName] = useState('');
  const [company, setCompany] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const stores = getStores();

  const applyStoreAutofill = (name: string) => {
    const match = findStoreByName(name);
    if (match) {
      setCompany(match.company || match.name);
      if (!categoryTouched) setCategory(match.category);
    }
  };

  const startManual = () => {
    setReceiptImage(undefined);
    setDate(todayStr());
    setMode('form');
  };

  const handleFileChosen = async (file: File) => {
    setScanError('');
    setMode('scanning');
    try {
      const fullDataUrl = await fileToDataUrl(file);
      const thumb = await compressImage(fullDataUrl);
      setReceiptImage(settings.saveReceiptImages ? thumb : undefined);

      const result = await recognizeReceipt(fullDataUrl);
      if (result.date) setDate(result.date);
      if (result.storeName) {
        setStoreName(result.storeName);
        if (result.company) setCompany(result.company);
        applyStoreAutofill(result.storeName);
      }
      if (result.amount) setAmount(String(result.amount));
    } catch {
      setScanError('レシートの読み取りに失敗しました。内容を確認・修正してください。');
    } finally {
      setMode('form');
    }
  };

  const handleSave = () => {
    setError('');
    const amountNum = parseInt(amount.replace(/[^0-9]/g, ''), 10) || 0;
    const name = storeName.trim();
    if (!name) { setError('店舗名を入力してください'); return; }
    if (amountNum <= 0) { setError('金額を入力してください'); return; }

    setSaving(true);
    const existing = findStoreByName(name);
    const store = {
      id: existing?.id ?? generateId(),
      name,
      company: company.trim() || name,
      category,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    upsertStore(store);

    saveExpense({
      id: generateId(),
      date,
      storeId: store.id,
      storeName: name,
      company: store.company ?? name,
      category,
      amount: amountNum,
      memo: memo.trim() || undefined,
      receiptImage,
      createdAt: new Date().toISOString(),
    });
    setTimeout(() => { setSaving(false); onSaved(); }, 200);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: C.page }}>
      <div style={{ flexShrink: 0, background: C.surface, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ height: 3, background: `linear-gradient(90deg,transparent,${C.brand},${C.brandBright} 50%,${C.brand},transparent)` }} />
        <div style={{ display: 'flex', alignItems: 'center', padding: '13px 16px' }}>
          <button onClick={onBack} style={{ fontSize: 14, fontWeight: 600, color: C.brand, fontFamily: FONT }}>← 戻る</button>
          <span style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 800, color: C.brand, fontFamily: FONT, letterSpacing: '0.15em' }}>
            記 録
          </span>
          <div style={{ width: 44 }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 110px' }}>

        {mode === 'choose' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            <input
              ref={fileInputRef} type="file" accept="image/*" capture="environment"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFileChosen(f); e.target.value = ''; }}
            />
            <Card
              style={{ padding: '22px 16px', textAlign: 'center', cursor: 'pointer' }}
            >
              <button onClick={() => fileInputRef.current?.click()} style={{ width: '100%' }}>
                <div style={{ fontSize: 30, marginBottom: 8 }}>📷</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.brandBright, marginBottom: 4, fontFamily: FONT }}>レシートを読み取る</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>撮影またはアップロードして自動入力</div>
              </button>
            </Card>
            <Card style={{ padding: '22px 16px', textAlign: 'center' }}>
              <button onClick={startManual} style={{ width: '100%' }}>
                <div style={{ fontSize: 30, marginBottom: 8 }}>✏️</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.brandBright, marginBottom: 4, fontFamily: FONT }}>手入力で記録</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>店舗名・金額を直接入力</div>
              </button>
            </Card>
          </div>
        )}

        {mode === 'scanning' && (
          <div style={{ textAlign: 'center', padding: '60px 16px' }}>
            <div style={{
              width: 36, height: 36, margin: '0 auto 16px', borderRadius: '50%',
              border: `3px solid ${C.brandDim}`, borderTopColor: C.brand,
              animation: 'spin 0.8s linear infinite',
            }} />
            <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
            <div style={{ fontSize: 14, color: C.textSecondary, fontFamily: FONT }}>レシートを読み取り中...</div>
          </div>
        )}

        {mode === 'form' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {scanError && (
              <div style={{
                padding: '10px 14px', background: C.dangerDim, border: `1px solid ${C.danger}`,
                borderRadius: 8, fontSize: 12, color: C.dangerBright, fontFamily: FONT,
              }}>
                {scanError}
              </div>
            )}

            {receiptImage && (
              <img src={receiptImage} alt="レシート" style={{
                width: '100%', maxHeight: 200, objectFit: 'contain',
                borderRadius: 10, border: `1px solid ${C.border}`, background: C.card2,
              }} />
            )}

            <Field label="内容を確認してください">
              <div style={{ fontSize: 11, color: C.textMuted }}>
                自動読み取りの結果です。必要に応じて修正してから保存してください。
              </div>
            </Field>

            <Field label="日付">
              <input
                type="date" value={date} onChange={e => setDate(e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="店舗名">
              <input
                type="text" value={storeName} list="store-list"
                placeholder="例：セブンイレブン渋谷店"
                onChange={e => { setStoreName(e.target.value); applyStoreAutofill(e.target.value); }}
                style={inputStyle}
              />
              <datalist id="store-list">
                {stores.map(s => <option key={s.id} value={s.name} />)}
              </datalist>
            </Field>

            <Field label="企業・チェーン名（任意）">
              <input
                type="text" value={company} onChange={e => setCompany(e.target.value)}
                placeholder="例：セブン&アイ（未入力は店舗名と同じ）"
                style={inputStyle}
              />
            </Field>

            <Field label="カテゴリ">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {CATEGORY_ORDER.map(cat => {
                  const active = category === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => { setCategory(cat); setCategoryTouched(true); }}
                      style={{
                        padding: '7px 12px', borderRadius: 16, fontSize: 12, fontWeight: 700, fontFamily: FONT,
                        background: active ? CATEGORY_INFO[cat].colorVar : C.card2,
                        color: active ? '#1a1408' : C.textSecondary,
                        border: `1px solid ${active ? CATEGORY_INFO[cat].colorVar : C.border}`,
                      }}
                    >
                      {CATEGORY_INFO[cat].label}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="金額">
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 16, color: C.textMuted,
                }}>¥</span>
                <input
                  type="number" inputMode="numeric" value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0"
                  style={{ ...inputStyle, paddingLeft: 28, fontSize: 22, fontWeight: 800, color: C.brandBright, fontFamily: FONT }}
                />
              </div>
            </Field>

            <Field label="メモ（任意）">
              <input
                type="text" value={memo} onChange={e => setMemo(e.target.value)}
                placeholder="例：週末の買い出し"
                style={inputStyle}
              />
            </Field>

            {error && (
              <div style={{
                padding: '10px 14px', background: C.dangerDim, border: `1px solid ${C.danger}`,
                borderRadius: 8, fontSize: 12, color: C.dangerBright, fontFamily: FONT,
              }}>
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      {mode === 'form' && (
        <div style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480, padding: '12px 16px 26px', background: C.page,
          borderTop: `1px solid ${C.border}`,
        }}>
          <PrimaryButton onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存する'}
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 6, fontFamily: FONT, letterSpacing: '0.05em' }}>
        {label}
      </div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: C.card2,
  border: `1px solid ${C.border}`, borderRadius: 10,
  fontSize: 15, color: C.text,
};
