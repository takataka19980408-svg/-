import { useState, useCallback } from 'react';
import type { GamblingCategory } from '../types';
import { CATEGORY_LABELS } from '../types';
import { getStores, saveStore, saveRecord, generateId } from '../storage';

interface Props {
  onBack: () => void;
  onSaved: () => void;
}

const QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000, 30000, 50000, 100000];

function formatDispAmount(n: number): string {
  if (n === 0) return '0';
  if (n >= 10000) {
    const man = Math.floor(n / 10000);
    const rem = n % 10000;
    if (rem === 0) return `${man}万`;
    return `${man}万${rem.toLocaleString()}`;
  }
  return n.toLocaleString();
}

function QuickAmountBtn({ amount, onClick }: { amount: number; onClick: () => void }) {
  const label = amount >= 10000 ? `${amount / 10000}万` : amount.toLocaleString();
  return (
    <button
      onClick={onClick}
      style={{
        padding: '9px 0',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 700,
        background: 'var(--bg-card2)',
        border: '1px solid var(--border)',
        color: 'var(--text-main)',
        transition: 'all 0.1s',
        textAlign: 'center',
      }}
      onTouchStart={e => {
        e.currentTarget.style.background = 'var(--gold-dim)';
        e.currentTarget.style.borderColor = 'var(--gold)';
      }}
      onTouchEnd={e => {
        e.currentTarget.style.background = 'var(--bg-card2)';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      {label}
    </button>
  );
}

export function RecordScreen({ onBack, onSaved }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toTimeString().slice(0, 5);

  const [activeInput, setActiveInput] = useState<'in' | 'out'>('in');
  const [inAmount, setInAmount] = useState(0);
  const [outAmount, setOutAmount] = useState(0);
  const [inRaw, setInRaw] = useState('');
  const [outRaw, setOutRaw] = useState('');
  const [useNumpad, setUseNumpad] = useState<'in' | 'out' | null>(null);

  const [stores, setStores] = useState(getStores());
  const [storeId, setStoreId] = useState(stores[0]?.id || '');
  const [newStoreName, setNewStoreName] = useState('');
  const [showNewStore, setShowNewStore] = useState(false);

  const [category, setCategory] = useState<GamblingCategory>('pachinko');
  const [date, setDate] = useState(today);
  const [time, setTime] = useState(nowTime);
  const [memo, setMemo] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const profit = outAmount - inAmount;

  const addAmount = useCallback((amount: number) => {
    if (activeInput === 'in') {
      setInAmount(v => v + amount);
    } else {
      setOutAmount(v => v + amount);
    }
  }, [activeInput]);

  const handleNumpadChange = (raw: string) => {
    const num = parseInt(raw.replace(/[^0-9]/g, ''), 10) || 0;
    if (useNumpad === 'in') { setInAmount(num); setInRaw(raw); }
    else if (useNumpad === 'out') { setOutAmount(num); setOutRaw(raw); }
  };

  const handleAddStore = () => {
    const name = newStoreName.trim();
    if (!name) return;
    const store = { id: generateId(), name, createdAt: new Date().toISOString() };
    saveStore(store);
    const updated = getStores();
    setStores(updated);
    setStoreId(store.id);
    setNewStoreName('');
    setShowNewStore(false);
  };

  const handleSave = () => {
    setError('');
    if (inAmount === 0 && outAmount === 0) {
      setError('INかOUTの金額を入力してください');
      return;
    }
    if (!storeId) {
      setError('店舗を選択してください');
      return;
    }
    const store = stores.find(s => s.id === storeId);
    if (!store) {
      setError('店舗を選択してください');
      return;
    }
    setSaving(true);
    const record = {
      id: generateId(),
      date,
      time,
      storeId,
      storeName: store.name,
      category,
      inAmount,
      outAmount,
      profit,
      memo: memo.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    saveRecord(record);
    setTimeout(() => {
      setSaving(false);
      onSaved();
    }, 300);
  };

  const categories: GamblingCategory[] = ['pachinko', 'slot', 'baccarat', 'horse', 'boat', 'cycle', 'other'];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      background: 'var(--bg)',
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '14px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)',
        flexShrink: 0,
      }}>
        <button
          onClick={onBack}
          style={{
            padding: '6px 12px 6px 0',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--gold)',
          }}
        >
          ← 戻る
        </button>
        <span style={{
          flex: 1,
          textAlign: 'center',
          fontSize: 16,
          fontWeight: 800,
          letterSpacing: '0.1em',
          color: 'var(--text-main)',
        }}>
          戦績を記録
        </span>
        <div style={{ width: 52 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 100px' }}>

        {/* IN/OUT inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {(['in', 'out'] as const).map(type => {
            const isActive = activeInput === type;
            const amount = type === 'in' ? inAmount : outAmount;
            const label = type === 'in' ? 'IN（投資）' : 'OUT（回収）';
            return (
              <div
                key={type}
                onClick={() => { setActiveInput(type); setUseNumpad(null); }}
                style={{
                  background: isActive ? 'var(--gold-dim)' : 'var(--bg-card)',
                  border: `2px solid ${isActive ? 'var(--gold)' : 'var(--border)'}`,
                  borderRadius: 12,
                  padding: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: 11, color: isActive ? 'var(--gold)' : 'var(--text-sub)', marginBottom: 4, fontWeight: 700, letterSpacing: '0.05em' }}>
                  {label}
                </div>
                <div style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: amount > 0 ? 'var(--text-main)' : 'var(--text-sub)',
                }}>
                  ¥{formatDispAmount(amount)}
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setUseNumpad(useNumpad === type ? null : type); setActiveInput(type); }}
                  style={{
                    marginTop: 4,
                    fontSize: 10,
                    color: 'var(--text-sub)',
                    padding: '2px 6px',
                    border: '1px solid var(--border)',
                    borderRadius: 4,
                    background: 'transparent',
                  }}
                >
                  数字入力
                </button>
              </div>
            );
          })}
        </div>

        {/* Numpad input */}
        {useNumpad && (
          <div style={{ marginBottom: 12 }}>
            <input
              type="number"
              value={useNumpad === 'in' ? inRaw : outRaw}
              onChange={e => handleNumpadChange(e.target.value)}
              placeholder="金額を入力"
              autoFocus
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'var(--bg-card)',
                border: '1px solid var(--gold)',
                borderRadius: 10,
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--text-main)',
              }}
            />
          </div>
        )}

        {/* Quick amount buttons */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--text-sub)', marginBottom: 8, letterSpacing: '0.1em' }}>
            クイック入力 → {activeInput === 'in' ? 'IN' : 'OUT'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {QUICK_AMOUNTS.map(a => (
              <QuickAmountBtn key={a} amount={a} onClick={() => addAmount(a)} />
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 6 }}>
            <button
              onClick={() => { if (activeInput === 'in') { setInAmount(0); setInRaw(''); } else { setOutAmount(0); setOutRaw(''); } }}
              style={{
                padding: '9px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                background: 'var(--loss-dim)',
                border: '1px solid rgba(231,76,60,0.3)',
                color: 'var(--loss)',
              }}
            >
              リセット
            </button>
            <div style={{
              padding: '9px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 800,
              background: profit > 0 ? 'var(--profit-dim)' : profit < 0 ? 'var(--loss-dim)' : 'var(--bg-card)',
              border: `1px solid ${profit > 0 ? 'rgba(46,204,113,0.4)' : profit < 0 ? 'rgba(231,76,60,0.4)' : 'var(--border)'}`,
              color: profit > 0 ? 'var(--profit)' : profit < 0 ? 'var(--loss)' : 'var(--text-sub)',
              textAlign: 'center',
            }}>
              差引 {profit > 0 ? '+' : ''}{formatDispAmount(profit)}
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />

        {/* Store selection */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--text-sub)', marginBottom: 8, fontWeight: 600, letterSpacing: '0.08em' }}>
            店舗
          </div>
          {stores.length > 0 ? (
            <select
              value={storeId}
              onChange={e => setStoreId(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--text-main)',
                appearance: 'none',
                WebkitAppearance: 'none',
              }}
            >
              {stores.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text-sub)', padding: '10px 0' }}>
              店舗が登録されていません
            </div>
          )}
          {!showNewStore ? (
            <button
              onClick={() => setShowNewStore(true)}
              style={{
                marginTop: 8,
                fontSize: 13,
                color: 'var(--gold)',
                fontWeight: 600,
                padding: '4px 0',
              }}
            >
              + 新しい店舗を追加
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input
                type="text"
                value={newStoreName}
                onChange={e => setNewStoreName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddStore()}
                placeholder="店舗名を入力"
                autoFocus
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--gold)',
                  borderRadius: 8,
                  fontSize: 14,
                  color: 'var(--text-main)',
                }}
              />
              <button
                onClick={handleAddStore}
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  background: 'var(--gold)',
                  color: '#0a0a08',
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                追加
              </button>
              <button
                onClick={() => { setShowNewStore(false); setNewStoreName(''); }}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-sub)',
                  fontSize: 13,
                }}
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Category */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--text-sub)', marginBottom: 8, fontWeight: 600, letterSpacing: '0.08em' }}>
            種目
          </div>
          <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4 }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  flexShrink: 0,
                  padding: '8px 14px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 700,
                  background: category === cat ? 'var(--gold)' : 'var(--bg-card)',
                  color: category === cat ? '#0a0a08' : 'var(--text-sub)',
                  border: category === cat ? 'none' : '1px solid var(--border)',
                  transition: 'all 0.15s',
                }}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Date/Time */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-sub)', marginBottom: 6, fontWeight: 600 }}>日付</div>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 12px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                fontSize: 14,
                color: 'var(--text-main)',
                colorScheme: 'dark',
              }}
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-sub)', marginBottom: 6, fontWeight: 600 }}>時刻</div>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 12px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                fontSize: 14,
                color: 'var(--text-main)',
                colorScheme: 'dark',
              }}
            />
          </div>
        </div>

        {/* Memo */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--text-sub)', marginBottom: 6, fontWeight: 600 }}>
            メモ（任意）
          </div>
          <textarea
            value={memo}
            onChange={e => setMemo(e.target.value)}
            placeholder="台の種類、状況など..."
            rows={2}
            style={{
              width: '100%',
              padding: '11px 12px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              fontSize: 14,
              color: 'var(--text-main)',
              resize: 'none',
            }}
          />
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            background: 'var(--loss-dim)',
            border: '1px solid rgba(231,76,60,0.3)',
            borderRadius: 8,
            fontSize: 13,
            color: 'var(--loss)',
            marginBottom: 12,
          }}>
            {error}
          </div>
        )}
      </div>

      {/* Save button */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        padding: '12px 16px 24px',
        background: 'linear-gradient(transparent, var(--bg) 35%)',
      }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 14,
            fontSize: 17,
            fontWeight: 800,
            letterSpacing: '0.08em',
            background: saving ? 'rgba(255,215,0,0.4)' : 'linear-gradient(135deg, #FFD700, #FFC200)',
            color: '#0a0a08',
            boxShadow: saving ? 'none' : '0 4px 20px rgba(255,215,0,0.35)',
            border: 'none',
            transition: 'all 0.2s',
          }}
        >
          {saving ? '保存中...' : '保存する'}
        </button>
      </div>
    </div>
  );
}
