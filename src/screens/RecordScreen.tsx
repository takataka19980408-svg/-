import { useState, useCallback } from 'react';
import type { GamblingCategory } from '../types';
import { CATEGORY_LABELS } from '../types';
import { getStores, saveStore, saveRecord, generateId, getSettings, getEffectiveToday } from '../storage';

interface Props {
  onBack: () => void;
  onSaved: () => void;
}

const QUICK = [1000, 5000, 10000, 30000, 50000, 100000];

const GOLD  = '#C9A227';
const GOLDB = '#F5D060';
const RED   = '#9B1C10';
const REDB  = '#FF3300';
const CARD  = '#0F0E0A';
const BDR   = '#222018';
const TEXT  = '#EDE3C0';
const SUB   = '#524938';
const BRUSH = '"Shippori Mincho B1","Hiragino Mincho ProN","Yu Mincho",serif';

const CATEGORIES: GamblingCategory[] = ['slot', 'pachinko', 'baccarat', 'horse', 'boat', 'cycle', 'mahjong', 'other'];

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
      <span style={{ color: RED, fontSize: 9 }}>◆</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.18em', fontFamily: BRUSH, opacity: 0.85 }}>
        {children}
      </span>
    </div>
  );
}

function AmountInput({
  label, amount, onAdd, onReset, accent,
}: {
  label: string; amount: number; onAdd: (n: number) => void; onReset: () => void; accent: string;
}) {
  const [showCustom, setShowCustom] = useState(false);
  const [customRaw, setCustomRaw]   = useState('');

  const applyCustom = () => {
    const n = parseInt(customRaw.replace(/[^0-9]/g, ''), 10) || 0;
    if (n > 0) onAdd(n);
    setCustomRaw('');
    setShowCustom(false);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <SectionLabel>{label}</SectionLabel>

      {/* Amount display */}
      <div style={{
        background: CARD, border: `2px solid ${BDR}`, borderRadius: 8,
        padding: '12px 14px', marginBottom: 8,
      }}>
        <div style={{ fontSize: 10, color: SUB, fontFamily: BRUSH, marginBottom: 4 }}>累計</div>
        <div style={{
          fontSize: 30, fontWeight: 800, fontFamily: BRUSH,
          color: amount > 0 ? TEXT : `${TEXT}33`,
        }}>
          ¥{fmt(amount)}
        </div>
      </div>

      {/* Quick buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 6 }}>
        {QUICK.map(a => (
          <button
            key={a}
            onClick={() => onAdd(a)}
            style={{
              padding: '10px 0', borderRadius: 5,
              fontSize: 14, fontWeight: 800, fontFamily: BRUSH,
              background: `${accent}0D`, border: `1px solid ${accent}30`,
              color: accent, cursor: 'pointer',
            }}
            onTouchStart={e => { e.currentTarget.style.background = `${accent}22`; }}
            onTouchEnd={e => { e.currentTarget.style.background = `${accent}0D`; }}
            onMouseDown={e => { e.currentTarget.style.background = `${accent}22`; }}
            onMouseUp={e => { e.currentTarget.style.background = `${accent}0D`; }}
          >
            {a >= 10000 ? `${a / 10000}万` : a.toLocaleString()}
          </button>
        ))}
      </div>

      {/* Custom + Reset */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={() => setShowCustom(v => !v)}
          style={{
            flex: 1, padding: '9px', borderRadius: 5,
            fontSize: 12, fontWeight: 700, fontFamily: BRUSH,
            background: showCustom ? `${accent}18` : CARD,
            border: `1px solid ${showCustom ? accent : BDR}`,
            color: showCustom ? accent : SUB, cursor: 'pointer',
          }}
        >
          その他の金額
        </button>
        <button
          onClick={onReset}
          style={{
            padding: '9px 16px', borderRadius: 5,
            fontSize: 12, fontWeight: 700, fontFamily: BRUSH,
            background: `${RED}14`, border: `1px solid ${RED}44`, color: REDB, cursor: 'pointer',
          }}
        >
          リセット
        </button>
      </div>

      {showCustom && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <input
            type="number" value={customRaw}
            onChange={e => setCustomRaw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.nativeEvent.isComposing && applyCustom()}
            placeholder="金額を入力" autoFocus
            style={{
              flex: 1, padding: '10px 12px', background: CARD,
              border: `1px solid ${accent}`, borderRadius: 6,
              fontSize: 16, color: TEXT, fontFamily: BRUSH, outline: 'none',
            }}
          />
          <button
            onClick={applyCustom}
            style={{
              padding: '10px 16px', borderRadius: 6,
              fontSize: 13, fontWeight: 700, fontFamily: BRUSH,
              background: `linear-gradient(135deg,${RED},${REDB})`,
              color: GOLDB, border: `1px solid ${RED}66`, cursor: 'pointer',
            }}
          >
            追加
          </button>
        </div>
      )}
    </div>
  );
}

export function RecordScreen({ onBack, onSaved }: Props) {
  const settings       = getSettings();
  const effectiveToday = getEffectiveToday(settings.dayBoundaryHour);

  const [inAmount,  setInAmount]  = useState(0);
  const [outAmount, setOutAmount] = useState(0);

  const [stores,       setStores]       = useState(getStores);
  const [storeId,      setStoreId]      = useState(() => getStores()[0]?.id ?? '');
  const [showNewStore, setShowNewStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreCat,  setNewStoreCat]  = useState<GamblingCategory>('slot');

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const profit = outAmount - inAmount;

  // Category is derived from the selected store
  const selectedStore  = stores.find(s => s.id === storeId);
  const recordCategory = selectedStore?.category ?? 'slot';

  const addIn  = useCallback((n: number) => setInAmount(v => v + n), []);
  const addOut = useCallback((n: number) => setOutAmount(v => v + n), []);

  const handleAddStore = () => {
    const name = newStoreName.trim();
    if (!name) return;
    const store = {
      id: generateId(), name, category: newStoreCat,
      createdAt: new Date().toISOString(),
    };
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
    if (!storeId || !selectedStore) { setError('店舗を選択または登録してください'); return; }
    setSaving(true);
    saveRecord({
      id: generateId(), date: effectiveToday, storeId,
      storeName: selectedStore.name, category: recordCategory,
      inAmount, outAmount, profit,
      createdAt: new Date().toISOString(),
    });
    setTimeout(() => { setSaving(false); onSaved(); }, 300);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#0A0905' }}>

      {/* Header */}
      <div style={{ flexShrink: 0, background: 'linear-gradient(180deg,#0E0D08,#0A0905)', borderBottom: `1px solid ${BDR}` }}>
        <div style={{ height: 4, background: `linear-gradient(90deg,${RED},${GOLD} 30%,${GOLDB} 50%,${GOLD} 70%,${RED})` }} />
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px' }}>
          <button onClick={onBack} style={{
            fontSize: 13, fontWeight: 700, color: GOLD, fontFamily: BRUSH,
            letterSpacing: '0.05em', background: 'none', border: 'none', cursor: 'pointer',
          }}>
            ← 戻る
          </button>
          <span style={{
            flex: 1, textAlign: 'center', fontSize: 17, fontWeight: 800,
            letterSpacing: '0.25em', color: GOLD, fontFamily: BRUSH,
            textShadow: `0 0 20px ${GOLD}55`,
          }}>
            戦績記録
          </span>
          <div style={{ width: 52 }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 100px' }}>

        {/* IN */}
        <AmountInput
          label="IN（投資額）"
          amount={inAmount}
          onAdd={addIn}
          onReset={() => setInAmount(0)}
          accent={GOLD}
        />

        {/* OUT */}
        <AmountInput
          label="OUT（回収額）"
          amount={outAmount}
          onAdd={addOut}
          onReset={() => setOutAmount(0)}
          accent="#00C896"
        />

        {/* 収支サマリ */}
        <div style={{
          padding: '13px 16px', borderRadius: 8, marginBottom: 20, textAlign: 'center',
          background: profit > 0 ? `${GOLD}0A` : profit < 0 ? `${RED}14` : CARD,
          border: `1px solid ${profit > 0 ? `${GOLD}44` : profit < 0 ? `${RED}44` : BDR}`,
        }}>
          <span style={{ fontSize: 12, color: SUB, fontFamily: BRUSH, letterSpacing: '0.1em' }}>収支　</span>
          <span style={{
            fontSize: 24, fontWeight: 800, fontFamily: BRUSH,
            color: profit > 0 ? GOLDB : profit < 0 ? REDB : SUB,
          }}>
            {profit > 0 ? '+' : profit < 0 ? '−' : '±'}{fmt(Math.abs(profit))}円
          </span>
        </div>

        <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${GOLD}22,transparent)`, marginBottom: 20 }} />

        {/* 店舗 */}
        <div style={{ marginBottom: 20 }}>
          <SectionLabel>店 舗</SectionLabel>

          {stores.length > 0 ? (
            <>
              <select
                value={storeId}
                onChange={e => setStoreId(e.target.value)}
                style={{
                  width: '100%', padding: '12px 14px', background: CARD,
                  border: `1px solid ${BDR}`, borderRadius: 6,
                  fontSize: 15, fontWeight: 600, color: TEXT,
                  fontFamily: BRUSH, appearance: 'none', WebkitAppearance: 'none', colorScheme: 'dark',
                  marginBottom: 8,
                }}
              >
                {stores.map(s => (
                  <option key={s.id} value={s.id} style={{ background: '#0a0905' }}>
                    {s.name}　{CATEGORY_LABELS[s.category ?? 'slot']}
                  </option>
                ))}
              </select>

              {/* Selected store's category badge */}
              {selectedStore && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, color: SUB, fontFamily: BRUSH }}>種目：</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 10px',
                    borderRadius: 10, fontFamily: BRUSH,
                    background: `${GOLD}14`, border: `1px solid ${GOLD}33`, color: GOLD,
                  }}>
                    {CATEGORY_LABELS[selectedStore.category ?? 'slot']}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: 12, color: SUB, padding: '6px 0', fontFamily: BRUSH }}>
              店舗が登録されていません
            </div>
          )}

          {/* New store registration */}
          {!showNewStore ? (
            <button
              onClick={() => setShowNewStore(true)}
              style={{
                marginTop: 10, fontSize: 12, color: GOLD, fontWeight: 700,
                fontFamily: BRUSH, letterSpacing: '0.05em',
                background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              ＋ 新しい店舗を登録
            </button>
          ) : (
            <div style={{
              marginTop: 12, padding: '14px', background: CARD,
              border: `1px solid ${GOLD}33`, borderRadius: 8,
            }}>
              {/* Store name */}
              <div style={{ fontSize: 10, color: SUB, fontFamily: BRUSH, marginBottom: 6 }}>店舗名</div>
              <input
                type="text" value={newStoreName}
                onChange={e => setNewStoreName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.nativeEvent.isComposing && handleAddStore()}
                placeholder="例：マルハン渋谷店" autoFocus
                style={{
                  width: '100%', padding: '10px 12px', background: '#0A0905',
                  border: `1px solid ${GOLD}55`, borderRadius: 6,
                  fontSize: 14, color: TEXT, fontFamily: BRUSH, outline: 'none',
                  boxSizing: 'border-box', marginBottom: 12,
                }}
              />

              {/* Category for this store */}
              <div style={{ fontSize: 10, color: SUB, fontFamily: BRUSH, marginBottom: 8 }}>種目</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setNewStoreCat(cat)}
                    style={{
                      padding: '6px 12px', borderRadius: 4,
                      fontSize: 12, fontWeight: 700, fontFamily: BRUSH,
                      background: newStoreCat === cat
                        ? `linear-gradient(135deg,${RED},${REDB})`
                        : '#0A0905',
                      color: newStoreCat === cat ? GOLDB : SUB,
                      border: newStoreCat === cat ? `1px solid ${RED}66` : `1px solid ${BDR}`,
                      boxShadow: newStoreCat === cat ? `0 0 8px ${RED}44` : 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={handleAddStore}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 6,
                    background: `linear-gradient(135deg,${RED},${REDB})`,
                    color: GOLDB, fontSize: 13, fontWeight: 700,
                    fontFamily: BRUSH, border: `1px solid ${RED}66`, cursor: 'pointer',
                  }}
                >
                  登録する
                </button>
                <button
                  onClick={() => { setShowNewStore(false); setNewStoreName(''); }}
                  style={{
                    padding: '10px 16px', borderRadius: 6, background: '#0A0905',
                    border: `1px solid ${BDR}`, color: SUB, fontSize: 13,
                    fontFamily: BRUSH, cursor: 'pointer',
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', background: `${RED}14`,
            border: `1px solid ${RED}44`, borderRadius: 6,
            fontSize: 13, color: REDB, marginBottom: 12, fontFamily: BRUSH,
          }}>
            {error}
          </div>
        )}
      </div>

      {/* Save button */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480, padding: '14px 16px 28px',
        background: `linear-gradient(transparent,#0A0905 40%)`, pointerEvents: 'none',
      }}>
        <button
          onClick={handleSave} disabled={saving}
          style={{
            width: '100%', padding: '17px', borderRadius: 6,
            fontSize: 18, fontWeight: 800, letterSpacing: '0.2em',
            background: saving
              ? `${GOLD}44`
              : `linear-gradient(135deg,${RED} 0%,${REDB} 40%,${GOLDB} 100%)`,
            color: saving ? GOLD : '#0A0900',
            boxShadow: saving ? 'none' : `0 4px 24px ${RED}88`,
            border: `1px solid ${GOLD}44`,
            pointerEvents: 'all', fontFamily: BRUSH, cursor: 'pointer',
          }}
        >
          {saving ? '記録中...' : '◆ 保存する ◆'}
        </button>
      </div>
    </div>
  );
}
