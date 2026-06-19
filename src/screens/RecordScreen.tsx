import { useState, useCallback } from 'react';
import type { GamblingCategory } from '../types';
import { CATEGORY_LABELS } from '../types';
import { getStores, saveStore, saveRecord, generateId, getSettings, getEffectiveToday } from '../storage';

interface Props {
  onBack: () => void;
  onSaved: () => void;
}

const IN_QUICK = [1000, 5000, 10000, 30000, 50000, 100000];

function fmt(n: number): string {
  if (n === 0) return '0';
  if (n >= 10000) {
    const man = Math.floor(n / 10000);
    const rem = n % 10000;
    return rem === 0 ? `${man}万` : `${man}万${rem.toLocaleString()}`;
  }
  return n.toLocaleString();
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
      <span style={{ color: 'var(--red)', fontSize: 9 }}>◆</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.18em', fontFamily: 'sans-serif', opacity: 0.85 }}>
        {children}
      </span>
    </div>
  );
}

export function RecordScreen({ onBack, onSaved }: Props) {
  const settings = getSettings();
  const effectiveToday = getEffectiveToday(settings.dayBoundaryHour);
  const nowTime = new Date().toTimeString().slice(0, 5);

  const [inAmount, setInAmount] = useState(0);
  const [outRaw, setOutRaw] = useState('');
  const outAmount = parseInt(outRaw.replace(/[^0-9]/g, ''), 10) || 0;
  const [showInCustom, setShowInCustom] = useState(false);
  const [inCustomRaw, setInCustomRaw] = useState('');

  const [stores, setStores] = useState(getStores());
  const [storeId, setStoreId] = useState(getStores()[0]?.id ?? '');
  const [newStoreName, setNewStoreName] = useState('');
  const [showNewStore, setShowNewStore] = useState(false);

  const [category, setCategory] = useState<GamblingCategory>('slot');
  const [date, setDate] = useState(effectiveToday);
  const [time, setTime] = useState(nowTime);
  const [memo, setMemo] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const profit = outAmount - inAmount;

  const addInAmount = useCallback((amount: number) => {
    setInAmount(v => v + amount);
  }, []);

  const handleInCustomApply = () => {
    const n = parseInt(inCustomRaw.replace(/[^0-9]/g, ''), 10) || 0;
    setInAmount(v => v + n);
    setInCustomRaw('');
    setShowInCustom(false);
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
    if (inAmount === 0 && outAmount === 0) { setError('INまたはOUTの金額を入力してください'); return; }
    if (!storeId) { setError('店舗を選択または登録してください'); return; }
    const store = stores.find(s => s.id === storeId);
    if (!store) { setError('店舗を選択または登録してください'); return; }
    setSaving(true);
    saveRecord({
      id: generateId(), date, time, storeId, storeName: store.name,
      category, inAmount, outAmount, profit,
      memo: memo.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
    setTimeout(() => { setSaving(false); onSaved(); }, 300);
  };

  const categories: GamblingCategory[] = ['slot', 'pachinko', 'baccarat', 'horse', 'boat', 'cycle', 'mahjong', 'other'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg)' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(180deg,#0a0020,#080810)', flexShrink: 0 }}>
        <div style={{ height: 3, background: 'linear-gradient(90deg,var(--red),var(--gold),var(--red))' }} />
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid rgba(255,215,0,0.12)' }}>
          <button onClick={onBack} style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)', fontFamily: 'sans-serif', letterSpacing: '0.05em' }}>
            ← 戻る
          </button>
          <span style={{
            flex: 1, textAlign: 'center', fontSize: 17, fontWeight: 900,
            letterSpacing: '0.2em', color: 'var(--gold)',
            textShadow: '0 0 20px rgba(255,215,0,0.5)',
            fontFamily: '"Hiragino Mincho ProN",serif',
          }}>戦績記録</span>
          <div style={{ width: 52 }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 96px' }}>

        {/* IN */}
        <div style={{ marginBottom: 14 }}>
          <SectionLabel>IN（投資額）</SectionLabel>
          <div style={{
            background: 'var(--bg-card)', border: '2px solid var(--border)',
            borderRadius: 8, padding: '12px 14px', marginBottom: 8,
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-sub)', fontFamily: 'sans-serif', marginBottom: 4 }}>累計</div>
            <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'sans-serif', color: inAmount > 0 ? 'var(--text-main)' : 'rgba(245,238,216,0.3)' }}>
              ¥{fmt(inAmount)}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 6 }}>
            {IN_QUICK.map(a => (
              <button
                key={a}
                onClick={() => addInAmount(a)}
                style={{
                  padding: '10px 0', borderRadius: 5, fontSize: 14, fontWeight: 800, fontFamily: 'sans-serif',
                  background: 'var(--bg-card2)', border: '1px solid rgba(255,215,0,0.18)',
                  color: 'var(--gold)', letterSpacing: '0.02em',
                }}
                onMouseDown={e => { e.currentTarget.style.background = 'rgba(255,215,0,0.12)'; }}
                onMouseUp={e => { e.currentTarget.style.background = 'var(--bg-card2)'; }}
                onTouchStart={e => { e.currentTarget.style.background = 'rgba(255,215,0,0.12)'; }}
                onTouchEnd={e => { e.currentTarget.style.background = 'var(--bg-card2)'; }}
              >
                {a >= 10000 ? `${a / 10000}万` : a.toLocaleString()}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setShowInCustom(v => !v)}
              style={{
                flex: 1, padding: '9px', borderRadius: 5, fontSize: 12, fontWeight: 700, fontFamily: 'sans-serif',
                background: showInCustom ? 'rgba(255,215,0,0.12)' : 'var(--bg-card)',
                border: `1px solid ${showInCustom ? 'var(--gold)' : 'var(--border)'}`,
                color: showInCustom ? 'var(--gold)' : 'var(--text-sub)',
              }}
            >
              その他の金額
            </button>
            <button
              onClick={() => setInAmount(0)}
              style={{
                padding: '9px 16px', borderRadius: 5, fontSize: 12, fontWeight: 700, fontFamily: 'sans-serif',
                background: 'rgba(255,51,51,0.08)', border: '1px solid rgba(255,51,51,0.25)', color: 'var(--loss)',
              }}
            >
              リセット
            </button>
          </div>
          {showInCustom && (
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <input
                type="number"
                value={inCustomRaw}
                onChange={e => setInCustomRaw(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleInCustomApply()}
                placeholder="金額を入力"
                autoFocus
                style={{
                  flex: 1, padding: '10px 12px', background: 'var(--bg-card)',
                  border: '1px solid var(--gold)', borderRadius: 6, fontSize: 16,
                  color: 'var(--text-main)', fontFamily: 'sans-serif',
                }}
              />
              <button
                onClick={handleInCustomApply}
                style={{
                  padding: '10px 16px', borderRadius: 6, fontSize: 13, fontWeight: 700, fontFamily: 'sans-serif',
                  background: 'linear-gradient(135deg,#CC2200,#FF4400)', color: '#FFF5A0',
                  border: '1px solid rgba(255,100,0,0.4)',
                }}
              >
                追加
              </button>
            </div>
          )}
        </div>

        {/* OUT */}
        <div style={{ marginBottom: 14 }}>
          <SectionLabel>OUT（回収額）</SectionLabel>
          <input
            type="number"
            value={outRaw}
            onChange={e => setOutRaw(e.target.value)}
            placeholder="0"
            style={{
              width: '100%', padding: '14px', background: 'var(--bg-card)',
              border: '2px solid var(--border)', borderRadius: 8,
              fontSize: 24, fontWeight: 900, color: 'var(--text-main)',
              fontFamily: 'sans-serif', textAlign: 'right',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--gold)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          />
        </div>

        {/* 差引 */}
        <div style={{
          padding: '12px 14px', borderRadius: 8, marginBottom: 14, textAlign: 'center',
          background: profit > 0 ? 'var(--profit-dim)' : profit < 0 ? 'var(--loss-dim)' : 'var(--bg-card)',
          border: `1px solid ${profit > 0 ? 'rgba(0,232,122,0.35)' : profit < 0 ? 'rgba(255,51,51,0.35)' : 'var(--border)'}`,
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-sub)', fontFamily: 'sans-serif', letterSpacing: '0.1em' }}>収支 </span>
          <span style={{
            fontSize: 22, fontWeight: 900, fontFamily: 'sans-serif',
            color: profit > 0 ? 'var(--profit)' : profit < 0 ? 'var(--loss)' : 'var(--text-sub)',
            textShadow: profit !== 0 ? `0 0 12px ${profit > 0 ? 'rgba(0,232,122,0.4)' : 'rgba(255,51,51,0.4)'}` : 'none',
          }}>
            {profit > 0 ? '+' : profit < 0 ? '−' : ''}{fmt(Math.abs(profit))}円
          </span>
        </div>

        <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,215,0,0.2),transparent)', margin: '4px 0 16px' }} />

        {/* 店舗 */}
        <div style={{ marginBottom: 14 }}>
          <SectionLabel>店 舗</SectionLabel>
          {stores.length > 0 ? (
            <select
              value={storeId}
              onChange={e => setStoreId(e.target.value)}
              style={{
                width: '100%', padding: '12px 14px', background: 'var(--bg-card)',
                border: '1px solid var(--border)', borderRadius: 6,
                fontSize: 15, fontWeight: 600, color: 'var(--text-main)',
                fontFamily: 'sans-serif', appearance: 'none', WebkitAppearance: 'none', colorScheme: 'dark',
              }}
            >
              {stores.map(s => <option key={s.id} value={s.id} style={{ background: '#0f0f18' }}>{s.name}</option>)}
            </select>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--text-sub)', padding: '6px 0', fontFamily: 'sans-serif' }}>店舗が登録されていません</div>
          )}
          {!showNewStore ? (
            <button
              onClick={() => setShowNewStore(true)}
              style={{ marginTop: 8, fontSize: 12, color: 'var(--gold)', fontWeight: 700, fontFamily: 'sans-serif', letterSpacing: '0.05em' }}
            >
              ＋ 新しい店舗を登録
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <input
                type="text" value={newStoreName} onChange={e => setNewStoreName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddStore()}
                placeholder="店舗名" autoFocus
                style={{ flex: 1, padding: '10px 12px', background: 'var(--bg-card)', border: '1px solid var(--gold)', borderRadius: 6, fontSize: 14, color: 'var(--text-main)', fontFamily: 'sans-serif' }}
              />
              <button onClick={handleAddStore} style={{ padding: '10px 14px', borderRadius: 6, background: 'linear-gradient(135deg,#CC2200,#FF4400)', color: '#FFF5A0', fontSize: 13, fontWeight: 700, fontFamily: 'sans-serif', border: '1px solid rgba(255,100,0,0.4)' }}>登録</button>
              <button onClick={() => { setShowNewStore(false); setNewStoreName(''); }} style={{ padding: '10px 12px', borderRadius: 6, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-sub)', fontSize: 13, fontFamily: 'sans-serif' }}>×</button>
            </div>
          )}
        </div>

        {/* 種目 */}
        <div style={{ marginBottom: 14 }}>
          <SectionLabel>種 目</SectionLabel>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  flexShrink: 0, padding: '8px 14px', borderRadius: 4,
                  fontSize: 13, fontWeight: 700, fontFamily: 'sans-serif', letterSpacing: '0.05em',
                  background: category === cat ? 'linear-gradient(135deg,#CC2200,#FF4400)' : 'var(--bg-card)',
                  color: category === cat ? '#FFF5A0' : 'var(--text-sub)',
                  border: category === cat ? '1px solid rgba(255,100,0,0.4)' : '1px solid rgba(255,215,0,0.12)',
                  boxShadow: category === cat ? '0 0 10px rgba(204,34,0,0.35)' : 'none',
                }}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* 日時 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          {([['日 付', 'date', date, setDate], ['時 刻', 'time', time, setTime]] as const).map(([label, type, val, setter]) => (
            <div key={label}>
              <SectionLabel>{label}</SectionLabel>
              <input
                type={type} value={val} onChange={e => (setter as (v: string) => void)(e.target.value)}
                style={{ width: '100%', padding: '11px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 14, color: 'var(--text-main)', colorScheme: 'dark', fontFamily: 'sans-serif' }}
              />
            </div>
          ))}
        </div>

        {/* メモ */}
        <div style={{ marginBottom: 16 }}>
          <SectionLabel>メ モ（任意）</SectionLabel>
          <textarea
            value={memo} onChange={e => setMemo(e.target.value)} placeholder="台の種類、状況など..." rows={2}
            style={{ width: '100%', padding: '11px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 14, color: 'var(--text-main)', resize: 'none', fontFamily: 'sans-serif' }}
          />
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(255,51,51,0.08)', border: '1px solid rgba(255,51,51,0.3)', borderRadius: 6, fontSize: 13, color: 'var(--loss)', marginBottom: 12, fontFamily: 'sans-serif' }}>
            {error}
          </div>
        )}
      </div>

      {/* Save button */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480, padding: '14px 16px 26px',
        background: 'linear-gradient(transparent,#080810 40%)', pointerEvents: 'none',
      }}>
        <button
          onClick={handleSave} disabled={saving}
          style={{
            width: '100%', padding: '17px', borderRadius: 6,
            fontSize: 18, fontWeight: 900, letterSpacing: '0.2em',
            background: saving ? 'rgba(180,150,0,0.3)' : 'linear-gradient(135deg,#B22200 0%,#FF3300 40%,#FFD700 100%)',
            color: '#FFF5A0',
            boxShadow: saving ? 'none' : '0 4px 24px rgba(200,50,0,0.5)',
            border: '1px solid rgba(255,200,0,0.3)',
            pointerEvents: 'all', fontFamily: '"Hiragino Mincho ProN",serif',
            textShadow: '0 1px 4px rgba(0,0,0,0.6)',
          }}
        >
          {saving ? '記録中...' : '◆ 保存する ◆'}
        </button>
      </div>
    </div>
  );
}
