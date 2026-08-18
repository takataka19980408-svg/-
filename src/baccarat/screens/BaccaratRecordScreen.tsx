import { useCallback, useState } from 'react';
import { getMasters, addMasterItem, saveRecord, generateId, today, formatYen } from '../storage';
import { MasterPicker } from '../components/MasterPicker';
import { MultiMasterPicker } from '../components/MultiMasterPicker';
import { AmountField } from '../components/AmountField';
import { GOLD, GOLDB, RED, REDB, BDR, TEXT, SUB, BRUSH, FELT, FELTD, NAV_H } from '../theme';

interface Props {
  onSaved: () => void;
}

export function BaccaratRecordScreen({ onSaved }: Props) {
  const [masters, setMasters] = useState(getMasters);
  const [date, setDate] = useState(today());
  const [table, setTable] = useState('');
  const [dealer, setDealer] = useState('');
  const [shuffle, setShuffle] = useState('');
  const [customerIds, setCustomerIds] = useState<string[]>([]);
  const [startAmount, setStartAmount] = useState(0);
  const [endAmount, setEndAmount] = useState(0);
  const [memo, setMemo] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const storeProfit = endAmount - startAmount;

  const addStart = useCallback((n: number) => setStartAmount(v => v + n), []);
  const addEnd = useCallback((n: number) => setEndAmount(v => v + n), []);

  const refreshMasters = () => setMasters(getMasters());

  const handleSave = () => {
    setError('');
    if (!dealer) { setError('ディーラーを選択してください'); return; }
    if (!shuffle) { setError('シャッフル方式を選択してください'); return; }
    if (startAmount === 0 && endAmount === 0) { setError('スタートまたはエンドを入力してください'); return; }
    setSaving(true);
    saveRecord({
      id: generateId(), date, table, dealer, shuffle,
      customerIds: customerIds.length ? customerIds : undefined,
      startAmount, endAmount, profit: endAmount - startAmount,
      memo: memo.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
    setTimeout(() => {
      setSaving(false);
      setTable(''); setDealer(''); setShuffle(''); setCustomerIds([]);
      setStartAmount(0); setEndAmount(0); setMemo('');
      onSaved();
    }, 250);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#07100C' }}>
      <div style={{ flexShrink: 0, background: `linear-gradient(180deg,${FELTD},#07100C)`, borderBottom: `1px solid ${BDR}` }}>
        <div style={{ height: 4, background: `linear-gradient(90deg,${FELT},${GOLD} 50%,${FELT})` }} />
        <div style={{ padding: '14px 20px 12px', textAlign: 'center' }}>
          <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '0.2em', color: GOLD, fontFamily: BRUSH }}>
            バカラ卓 記録入力
          </span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: `16px 16px ${110 + NAV_H}px` }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.1em', fontFamily: BRUSH, marginBottom: 6 }}>
            日付
          </div>
          <input
            type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{
              width: '100%', padding: '12px 10px', background: '#0E1712',
              border: `1px solid ${BDR}`, borderRadius: 6, fontSize: 15, color: TEXT,
              fontFamily: BRUSH, colorScheme: 'dark', boxSizing: 'border-box',
            }}
          />
        </div>

        <MasterPicker label="卓" options={masters.tables} value={table}
          onChange={setTable} onAdd={v => { addMasterItem('tables', v); refreshMasters(); }} />
        <MasterPicker label="ディーラー" options={masters.dealers} value={dealer}
          onChange={setDealer} onAdd={v => { addMasterItem('dealers', v); refreshMasters(); }} />
        <MasterPicker label="シャッフル方式" options={masters.shuffles} value={shuffle}
          onChange={setShuffle} onAdd={v => { addMasterItem('shuffles', v); refreshMasters(); }} />
        <MultiMasterPicker label="客ID" options={masters.customers} values={customerIds} optional
          onChange={setCustomerIds} onAdd={v => { addMasterItem('customers', v); refreshMasters(); }} />

        <AmountField label="スタート（店の開始額）" amount={startAmount} onAdd={addStart} onReset={() => setStartAmount(0)} accent={GOLD} />
        <AmountField label="エンド（店の終了額）" amount={endAmount} onAdd={addEnd} onReset={() => setEndAmount(0)} accent="#00C896" />

        <div style={{
          padding: '13px 16px', borderRadius: 8, marginBottom: 20, textAlign: 'center',
          background: storeProfit > 0 ? `${GOLD}0A` : storeProfit < 0 ? `${RED}14` : '#0E1712',
          border: `1px solid ${storeProfit > 0 ? `${GOLD}44` : storeProfit < 0 ? `${RED}44` : BDR}`,
        }}>
          <span style={{ fontSize: 12, color: SUB, fontFamily: BRUSH }}>店収支 </span>
          <span style={{
            fontSize: 22, fontWeight: 800, fontFamily: BRUSH,
            color: storeProfit > 0 ? GOLDB : storeProfit < 0 ? REDB : SUB,
          }}>
            {formatYen(storeProfit)}円
          </span>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.1em', fontFamily: BRUSH, marginBottom: 6 }}>
            メモ（任意）
          </div>
          <textarea
            value={memo} onChange={e => setMemo(e.target.value)} rows={2}
            style={{
              width: '100%', padding: '10px 12px', background: '#0E1712', border: `1px solid ${BDR}`,
              borderRadius: 6, fontSize: 14, color: TEXT, fontFamily: BRUSH, resize: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', background: `${RED}14`, border: `1px solid ${RED}44`, borderRadius: 6,
            fontSize: 13, color: REDB, marginBottom: 12, fontFamily: BRUSH,
          }}>
            {error}
          </div>
        )}
      </div>

      <div style={{
        position: 'fixed', bottom: NAV_H, left: 0, right: 0, margin: '0 auto',
        width: '100%', maxWidth: 480, padding: '14px 16px 14px',
        background: 'linear-gradient(transparent,#07100C 40%)', pointerEvents: 'none',
      }}>
        <button
          onClick={handleSave} disabled={saving}
          style={{
            width: '100%', padding: '17px', borderRadius: 6, fontSize: 17, fontWeight: 800, letterSpacing: '0.15em',
            background: saving ? `${GOLD}44` : `linear-gradient(135deg,${FELT} 0%,${GOLD} 60%,${GOLDB} 100%)`,
            color: saving ? GOLD : '#08120D',
            boxShadow: saving ? 'none' : `0 4px 24px ${FELT}AA`,
            border: `1px solid ${GOLD}44`, pointerEvents: 'all', fontFamily: BRUSH, cursor: 'pointer',
          }}
        >
          {saving ? '記録中...' : '◆ 記録する ◆'}
        </button>
      </div>
    </div>
  );
}
