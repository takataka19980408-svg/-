import { useCallback, useState } from 'react';
import { getMasters, addMasterItem, saveRecord, updateRecord, generateId, today, formatYen } from '../storage';
import type { BaccaratRecord } from '../types';
import { MasterPicker } from '../components/MasterPicker';
import { MultiMasterPicker } from '../components/MultiMasterPicker';
import { AmountField } from '../components/AmountField';
import { GOLD, GOLDB, RED, REDB, BDR, TEXT, SUB, BRUSH, FELT, FELTD, NAV_SAFE_BOTTOM } from '../theme';

interface Props {
  onSaved: () => void;
  editRecord?: BaccaratRecord | null;
  onCancel?: () => void;
}

export function BaccaratRecordScreen({ onSaved, editRecord, onCancel }: Props) {
  const [masters, setMasters] = useState(getMasters);
  const [date, setDate] = useState(editRecord?.date ?? today());
  const [table, setTable] = useState(editRecord?.table ?? '');
  const [dealerIds, setDealerIds] = useState<string[]>(editRecord?.dealerIds ?? []);
  const [shuffle, setShuffle] = useState(editRecord?.shuffle ?? '');
  const [customerIds, setCustomerIds] = useState<string[]>(editRecord?.customerIds ?? []);
  const [customerProfits, setCustomerProfits] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(editRecord?.customerProfits ?? {}).map(([k, v]) => [k, String(Math.abs(v))])));
  // customerProfitsは店収支の符号で保存されるため、客の勝敗（＋＝客が勝った）に
  // 直すには符号を反転させて復元する。
  const [customerProfitSigns, setCustomerProfitSigns] = useState<Record<string, '+' | '-'>>(() =>
    Object.fromEntries(Object.entries(editRecord?.customerProfits ?? {}).map(([k, v]) => [k, v < 0 ? '+' : '-'])));
  const [startAmount, setStartAmount] = useState(editRecord?.startAmount ?? 0);
  const [endAmount, setEndAmount] = useState(editRecord?.endAmount ?? 0);
  const [memo, setMemo] = useState(editRecord?.memo ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const storeProfit = endAmount - startAmount;
  // 客の勝敗として入力（＋＝客が勝った）。店収支として保存する際は符号を反転する。
  const getCustomerOwnAmount = (id: string) => {
    const mag = Number(customerProfits[id]) || 0;
    return customerProfitSigns[id] === '-' ? -mag : mag;
  };
  const allocatedSum = customerIds.reduce((s, id) => s + getCustomerOwnAmount(id), 0);
  const requiredSum = -storeProfit;

  const addStart = useCallback((n: number) => setStartAmount(v => v + n), []);
  const addEnd = useCallback((n: number) => setEndAmount(v => v + n), []);

  const refreshMasters = () => setMasters(getMasters());

  const handleSave = () => {
    setError('');
    if (dealerIds.length === 0) { setError('ディーラーを選択してください'); return; }
    if (!shuffle) { setError('シャッフル方式を選択してください'); return; }
    if (startAmount === 0 && endAmount === 0) { setError('スタートまたはエンドを入力してください'); return; }
    if (customerIds.length > 1) {
      if (customerIds.some(id => !customerProfits[id]?.trim())) {
        setError('客ごとの収支配分をすべて入力してください');
        return;
      }
      if (allocatedSum !== requiredSum) {
        setError(`客の勝敗の合計（${formatYen(allocatedSum)}円）が店収支と符号反対の額（${formatYen(requiredSum)}円）と一致していません`);
        return;
      }
    }
    setSaving(true);
    const record: BaccaratRecord = {
      id: editRecord?.id ?? generateId(), date, table, dealerIds, shuffle,
      customerIds: customerIds.length ? customerIds : undefined,
      customerProfits: customerIds.length > 1
        ? Object.fromEntries(customerIds.map(id => [id, -getCustomerOwnAmount(id)]))
        : undefined,
      startAmount, endAmount, profit: endAmount - startAmount,
      memo: memo.trim() || undefined,
      createdAt: editRecord?.createdAt ?? new Date().toISOString(),
    };
    if (editRecord) {
      updateRecord(record);
    } else {
      saveRecord(record);
    }
    setTimeout(() => {
      setSaving(false);
      if (!editRecord) {
        setTable(''); setDealerIds([]); setShuffle(''); setCustomerIds([]);
        setCustomerProfits({}); setCustomerProfitSigns({});
        setStartAmount(0); setEndAmount(0); setMemo('');
      }
      onSaved();
    }, 250);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#07100C' }}>
      <div style={{ flexShrink: 0, background: `linear-gradient(180deg,${FELTD},#07100C)`, borderBottom: `1px solid ${BDR}` }}>
        <div style={{ height: 4, background: `linear-gradient(90deg,${FELT},${GOLD} 50%,${FELT})` }} />
        <div style={{ padding: '14px 20px 12px', textAlign: 'center' }}>
          <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '0.2em', color: GOLD, fontFamily: BRUSH }}>
            {editRecord ? 'バカラ卓 記録編集' : 'バカラ卓 記録入力'}
          </span>
        </div>
        {editRecord && onCancel && (
          <div style={{ textAlign: 'center', paddingBottom: 10 }}>
            <button onClick={onCancel} style={{
              fontSize: 12, fontWeight: 700, color: SUB, fontFamily: BRUSH,
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}>
              ← 編集をキャンセルして履歴に戻る
            </button>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: `16px 16px calc(110px + ${NAV_SAFE_BOTTOM})` }}>
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
        <MultiMasterPicker label="ディーラー" options={masters.dealers} values={dealerIds}
          onChange={setDealerIds} onAdd={v => { addMasterItem('dealers', v); refreshMasters(); }} />
        <MasterPicker label="シャッフル方式" options={masters.shuffles} value={shuffle}
          onChange={setShuffle} onAdd={v => { addMasterItem('shuffles', v); refreshMasters(); }} />
        <MultiMasterPicker label="客ID" options={masters.customers} values={customerIds} optional
          onChange={setCustomerIds} onAdd={v => { addMasterItem('customers', v); refreshMasters(); }} />

        {customerIds.length > 1 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.1em', fontFamily: BRUSH, marginBottom: 6 }}>
              客ごとの勝敗（手入力・＋＝客の勝ち／－＝客の負け）
            </div>
            {customerIds.map(id => {
              const sign = customerProfitSigns[id] ?? '+';
              return (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{
                    fontSize: 13, color: TEXT, fontFamily: BRUSH, flex: 1,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {id}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCustomerProfitSigns(cs => ({ ...cs, [id]: sign === '-' ? '+' : '-' }))}
                    style={{
                      width: 34, height: 36, borderRadius: 6, fontSize: 16, fontWeight: 800, fontFamily: BRUSH,
                      flexShrink: 0, cursor: 'pointer',
                      background: sign === '-' ? `${REDB}22` : `${GOLD}18`,
                      color: sign === '-' ? REDB : GOLDB,
                      border: `1px solid ${sign === '-' ? REDB : GOLD}55`,
                    }}
                  >
                    {sign === '-' ? '－' : '＋'}
                  </button>
                  <input
                    type="number" inputMode="numeric" min="0" value={customerProfits[id] ?? ''}
                    onChange={e => setCustomerProfits(cp => ({ ...cp, [id]: e.target.value.replace(/-/g, '') }))}
                    placeholder="0"
                    style={{
                      width: 100, padding: '9px 10px', background: '#0E1712', border: `1px solid ${BDR}`,
                      borderRadius: 6, fontSize: 14, color: TEXT, fontFamily: BRUSH, textAlign: 'right', boxSizing: 'border-box',
                    }}
                  />
                  <span style={{ fontSize: 12, color: SUB, fontFamily: BRUSH }}>円</span>
                </div>
              );
            })}
            <div style={{
              fontSize: 11, fontFamily: BRUSH, textAlign: 'right',
              color: allocatedSum === requiredSum ? SUB : REDB,
            }}>
              客の勝敗合計 {formatYen(allocatedSum)}円 ／ 必要な額 {formatYen(requiredSum)}円（店収支の符号反対）
              {allocatedSum !== requiredSum && '（一致するまで保存できません）'}
            </div>
          </div>
        )}

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
        position: 'fixed', bottom: NAV_SAFE_BOTTOM, left: 0, right: 0, margin: '0 auto',
        width: '100%', maxWidth: 480, padding: '14px 16px 14px',
        background: 'linear-gradient(transparent,#07100C 40%)', pointerEvents: 'none',
      }}>
        <button
          onClick={handleSave} disabled={saving}
          style={{
            width: '100%', padding: '17px', borderRadius: 6, fontSize: 17, fontWeight: 800, letterSpacing: '0.15em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', boxSizing: 'border-box',
            background: saving ? `${GOLD}44` : `linear-gradient(135deg,${FELT} 0%,${GOLD} 60%,${GOLDB} 100%)`,
            color: saving ? GOLD : '#08120D',
            boxShadow: saving ? 'none' : `0 4px 24px ${FELT}AA`,
            border: `1px solid ${GOLD}44`, pointerEvents: 'all', fontFamily: BRUSH, cursor: 'pointer',
          }}
        >
          {saving ? (editRecord ? '更新中...' : '記録中...') : (editRecord ? '◆ 更新する ◆' : '◆ 記録する ◆')}
        </button>
      </div>
    </div>
  );
}
