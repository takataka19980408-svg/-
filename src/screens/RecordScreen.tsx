import { useState, useCallback } from 'react';
import type { GamblingCategory } from '../types';
import { CATEGORY_LABELS } from '../types';
import { getStores, saveStore, saveRecord, generateId } from '../storage';

interface Props {
  onBack: () => void;
  onSaved: () => void;
}

const QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000, 30000, 50000, 100000];

function formatDisp(n: number): string {
  if (n === 0) return '0';
  if (n >= 10000) {
    const man = Math.floor(n / 10000);
    const rem = n % 10000;
    if (rem === 0) return `${man}万`;
    return `${man}万${rem.toLocaleString()}`;
  }
  return n.toLocaleString();
}

function QuickBtn({ amount, onClick }: { amount: number; onClick: () => void }) {
  const label = amount >= 10000 ? `${amount / 10000}万` : amount.toLocaleString();
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 0',
        borderRadius: 5,
        fontSize: 13,
        fontWeight: 800,
        fontFamily: 'sans-serif',
        background: 'var(--bg-card2)',
        border: '1px solid rgba(255,215,0,0.18)',
        color: 'var(--gold)',
        letterSpacing: '0.02em',
        transition: 'all 0.1s',
      }}
      onTouchStart={e => {
        e.currentTarget.style.background = 'rgba(255,215,0,0.12)';
        e.currentTarget.style.boxShadow = '0 0 10px rgba(255,215,0,0.3)';
      }}
      onTouchEnd={e => {
        e.currentTarget.style.background = 'var(--bg-card2)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      onMouseDown={e => {
        e.currentTarget.style.background = 'rgba(255,215,0,0.12)';
        e.currentTarget.style.boxShadow = '0 0 10px rgba(255,215,0,0.3)';
      }}
      onMouseUp={e => {
        e.currentTarget.style.background = 'var(--bg-card2)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {label}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    }}>
      <span style={{ color: 'var(--red)', fontSize: 10 }}>◆</span>
      <span style={{
        fontSize: 11,
        fontWeight: 700,
        color: 'var(--gold)',
        letterSpacing: '0.2em',
        fontFamily: 'sans-serif',
        opacity: 0.85,
      }}>
        {children}
      </span>
    </div>
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
  const [storeId, setStoreId] = useState(getStores()[0]?.id || '');
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
    if (activeInput === 'in') setInAmount(v => v + amount);
    else setOutAmount(v => v + amount);
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
    if (inAmount === 0 && outAmount === 0) { setError('IN・OUTの金額を入力してください'); return; }
    if (!storeId) { setError('店舗を選択または登録してください'); return; }
    const store = stores.find(s => s.id === storeId);
    if (!store) { setError('店舗を選択または登録してください'); return; }
    setSaving(true);
    saveRecord({
      id: generateId(), date, time, storeId,
      storeName: store.name, category,
      inAmount, outAmount, profit,
      memo: memo.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
    setTimeout(() => { setSaving(false); onSaved(); }, 300);
  };

  const categories: GamblingCategory[] = ['pachinko', 'slot', 'baccarat', 'horse', 'boat', 'cycle', 'other'];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      background: 'var(--bg)',
    }}>
      {/* ══ HEADER ══ */}
      <div style={{
        background: 'linear-gradient(180deg, #0a0020 0%, #080810 100%)',
        flexShrink: 0,
      }}>
        <div style={{ height: 3, background: 'linear-gradient(90deg, var(--red), var(--gold), var(--red))' }} />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255,215,0,0.12)',
        }}>
          <button
            onClick={onBack}
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--gold)',
              padding: '4px 0',
              fontFamily: 'sans-serif',
              letterSpacing: '0.05em',
            }}
          >
            ← 戻る
          </button>
          <span style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 17,
            fontWeight: 900,
            letterSpacing: '0.2em',
            color: 'var(--gold)',
            textShadow: '0 0 20px rgba(255,215,0,0.5)',
            fontFamily: '"Hiragino Mincho ProN", serif',
          }}>
            戦績記録
          </span>
          <div style={{ width: 52 }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 100px' }}>

        {/* ══ IN / OUT ══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          {(['in', 'out'] as const).map(type => {
            const isActive = activeInput === type;
            const amount = type === 'in' ? inAmount : outAmount;
            const isIN = type === 'in';
            const accentColor = isIN ? 'var(--loss)' : 'var(--profit)';

            return (
              <div
                key={type}
                onClick={() => { setActiveInput(type); setUseNumpad(null); }}
                style={{
                  background: isActive
                    ? `radial-gradient(ellipse at 50% 0%, ${isIN ? 'rgba(255,51,51,0.08)' : 'rgba(0,232,122,0.08)'} 0%, var(--bg-card) 70%)`
                    : 'var(--bg-card)',
                  border: `2px solid ${isActive ? accentColor : 'rgba(255,215,0,0.15)'}`,
                  borderRadius: 8,
                  padding: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: isActive
                    ? `0 0 16px ${isIN ? 'rgba(255,51,51,0.2)' : 'rgba(0,232,122,0.2)'}`
                    : 'none',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {isActive && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                    background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
                  }} />
                )}
                <div style={{
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: 'sans-serif',
                  color: isActive ? accentColor : 'var(--text-sub)',
                  marginBottom: 6,
                  letterSpacing: '0.1em',
                }}>
                  {isIN ? 'IN（投資）' : 'OUT（回収）'}
                </div>
                <div style={{
                  fontSize: 26,
                  fontWeight: 900,
                  fontFamily: 'sans-serif',
                  color: amount > 0 ? 'var(--text-main)' : 'rgba(245,238,216,0.3)',
                  lineHeight: 1,
                }}>
                  ¥{formatDisp(amount)}
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setUseNumpad(useNumpad === type ? null : type); setActiveInput(type); }}
                  style={{
                    marginTop: 6,
                    fontSize: 10,
                    color: 'var(--text-sub)',
                    padding: '2px 7px',
                    border: '1px solid rgba(255,215,0,0.15)',
                    borderRadius: 3,
                    background: 'transparent',
                    fontFamily: 'sans-serif',
                  }}
                >
                  数字入力
                </button>
              </div>
            );
          })}
        </div>

        {/* Numpad */}
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
                borderRadius: 6,
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--text-main)',
                fontFamily: 'sans-serif',
                boxShadow: '0 0 12px rgba(255,215,0,0.15)',
              }}
            />
          </div>
        )}

        {/* ══ QUICK BUTTONS ══ */}
        <div style={{ marginBottom: 10 }}>
          <div style={{
            fontSize: 10,
            color: 'var(--text-sub)',
            marginBottom: 8,
            fontFamily: 'sans-serif',
            letterSpacing: '0.12em',
          }}>
            クイック入力 → {activeInput === 'in' ? 'IN' : 'OUT'} に加算
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {QUICK_AMOUNTS.map(a => (
              <QuickBtn key={a} amount={a} onClick={() => addAmount(a)} />
            ))}
          </div>
        </div>

        {/* Reset + diff */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 16 }}>
          <button
            onClick={() => {
              if (activeInput === 'in') { setInAmount(0); setInRaw(''); }
              else { setOutAmount(0); setOutRaw(''); }
            }}
            style={{
              padding: '10px',
              borderRadius: 5,
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'sans-serif',
              background: 'rgba(255,51,51,0.08)',
              border: '1px solid rgba(255,51,51,0.25)',
              color: 'var(--loss)',
              letterSpacing: '0.05em',
            }}
          >
            リセット
          </button>
          <div style={{
            padding: '10px',
            borderRadius: 5,
            fontSize: 14,
            fontWeight: 900,
            fontFamily: 'sans-serif',
            background: profit > 0
              ? 'rgba(0,232,122,0.08)'
              : profit < 0
              ? 'rgba(255,51,51,0.08)'
              : 'var(--bg-card)',
            border: `1px solid ${profit > 0 ? 'rgba(0,232,122,0.3)' : profit < 0 ? 'rgba(255,51,51,0.3)' : 'var(--border)'}`,
            color: profit > 0 ? 'var(--profit)' : profit < 0 ? 'var(--loss)' : 'var(--text-sub)',
            textAlign: 'center',
            textShadow: profit !== 0 ? `0 0 12px ${profit > 0 ? 'rgba(0,232,122,0.4)' : 'rgba(255,51,51,0.4)'}` : 'none',
          }}>
            差引 {profit > 0 ? '+' : profit < 0 ? '−' : ''}{formatDisp(Math.abs(profit))}
          </div>
        </div>

        {/* ── separator ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0 16px' }}>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.2))' }} />
          <span style={{ color: 'var(--gold)', fontSize: 9, opacity: 0.5 }}>◆◆◆</span>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(255,215,0,0.2), transparent)' }} />
        </div>

        {/* ══ 店舗 ══ */}
        <div style={{ marginBottom: 16 }}>
          <SectionLabel>店 舗</SectionLabel>
          {stores.length > 0 ? (
            <select
              value={storeId}
              onChange={e => setStoreId(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--text-main)',
                fontFamily: 'sans-serif',
                appearance: 'none',
                WebkitAppearance: 'none',
                colorScheme: 'dark',
              }}
            >
              {stores.map(s => (
                <option key={s.id} value={s.id} style={{ background: '#0f0f18' }}>{s.name}</option>
              ))}
            </select>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--text-sub)', padding: '8px 0', fontFamily: 'sans-serif' }}>
              店舗が登録されていません
            </div>
          )}
          {!showNewStore ? (
            <button
              onClick={() => setShowNewStore(true)}
              style={{
                marginTop: 8,
                fontSize: 12,
                color: 'var(--gold)',
                fontWeight: 700,
                fontFamily: 'sans-serif',
                letterSpacing: '0.08em',
                opacity: 0.85,
              }}
            >
              ＋ 新しい店舗を登録
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input
                type="text"
                value={newStoreName}
                onChange={e => setNewStoreName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddStore()}
                placeholder="店舗名"
                autoFocus
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--gold)',
                  borderRadius: 6,
                  fontSize: 14,
                  color: 'var(--text-main)',
                  fontFamily: 'sans-serif',
                }}
              />
              <button
                onClick={handleAddStore}
                style={{
                  padding: '10px 16px',
                  borderRadius: 6,
                  background: 'linear-gradient(135deg, #CC2200, #FF4400)',
                  color: '#FFF5A0',
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: 'sans-serif',
                  border: '1px solid rgba(255,100,0,0.4)',
                }}
              >
                登録
              </button>
              <button
                onClick={() => { setShowNewStore(false); setNewStoreName(''); }}
                style={{
                  padding: '10px 12px',
                  borderRadius: 6,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-sub)',
                  fontSize: 13,
                  fontFamily: 'sans-serif',
                }}
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* ══ 種目 ══ */}
        <div style={{ marginBottom: 16 }}>
          <SectionLabel>種 目</SectionLabel>
          <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4 }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  flexShrink: 0,
                  padding: '8px 16px',
                  borderRadius: 4,
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: 'sans-serif',
                  letterSpacing: '0.05em',
                  background: category === cat
                    ? 'linear-gradient(135deg, #CC2200, #FF4400)'
                    : 'var(--bg-card)',
                  color: category === cat ? '#FFF5A0' : 'var(--text-sub)',
                  border: category === cat
                    ? '1px solid rgba(255,100,0,0.4)'
                    : '1px solid rgba(255,215,0,0.12)',
                  boxShadow: category === cat ? '0 0 10px rgba(204,34,0,0.35)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* ══ 日時 ══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[
            { label: '日 付', type: 'date', value: date, onChange: setDate },
            { label: '時 刻', type: 'time', value: time, onChange: setTime },
          ].map(({ label, type, value, onChange }) => (
            <div key={label}>
              <SectionLabel>{label}</SectionLabel>
              <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 12px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  fontSize: 14,
                  color: 'var(--text-main)',
                  colorScheme: 'dark',
                  fontFamily: 'sans-serif',
                }}
              />
            </div>
          ))}
        </div>

        {/* ══ メモ ══ */}
        <div style={{ marginBottom: 16 }}>
          <SectionLabel>メ モ（任意）</SectionLabel>
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
              borderRadius: 6,
              fontSize: 14,
              color: 'var(--text-main)',
              resize: 'none',
              fontFamily: 'sans-serif',
            }}
          />
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(255,51,51,0.08)',
            border: '1px solid rgba(255,51,51,0.3)',
            borderRadius: 6,
            fontSize: 13,
            color: 'var(--loss)',
            marginBottom: 12,
            fontFamily: 'sans-serif',
            letterSpacing: '0.05em',
          }}>
            {error}
          </div>
        )}
      </div>

      {/* ══ SAVE BUTTON ══ */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        padding: '16px 16px 28px',
        background: 'linear-gradient(transparent, #080810 45%)',
        pointerEvents: 'none',
      }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%',
            padding: '17px',
            borderRadius: 6,
            fontSize: 18,
            fontWeight: 900,
            letterSpacing: '0.2em',
            background: saving
              ? 'rgba(180,150,0,0.3)'
              : 'linear-gradient(135deg, #B22200 0%, #FF3300 40%, #FFD700 100%)',
            color: '#FFF5A0',
            boxShadow: saving ? 'none' : '0 4px 24px rgba(200,50,0,0.5), 0 0 40px rgba(255,100,0,0.2)',
            border: '1px solid rgba(255,200,0,0.3)',
            pointerEvents: 'all',
            fontFamily: '"Hiragino Mincho ProN", serif',
            textShadow: '0 1px 4px rgba(0,0,0,0.6)',
            transition: 'all 0.2s',
          }}
        >
          {saving ? '記録中...' : '◆ 保存する ◆'}
        </button>
      </div>
    </div>
  );
}
