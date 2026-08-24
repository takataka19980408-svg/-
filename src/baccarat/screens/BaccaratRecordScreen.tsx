import { useState } from 'react';
import {
  getMasters, addMasterItem, saveRecord, updateRecord, generateId, today,
  getLastEndAmountForDate, getRecordsForDateSorted, reflowDay, formatYen,
} from '../storage';
import type { BaccaratRecord } from '../types';
import { MasterPicker } from '../components/MasterPicker';
import { MultiMasterPicker } from '../components/MultiMasterPicker';
import { AmountField } from '../components/AmountField';
import { GOLD, GOLDB, RED, REDB, CARD, BDR, TEXT, SUB, BRUSH, FELT, FELTD, NAV_SAFE_BOTTOM } from '../theme';

interface Props {
  onSaved: () => void;
  editRecord?: BaccaratRecord | null;
  onCancel?: () => void;
  onEditRecord?: (record: BaccaratRecord) => void;
}

export function BaccaratRecordScreen({ onSaved, editRecord, onCancel, onEditRecord }: Props) {
  // 入力画面は他画面に切り替えてもマウントされたままになるため、マスタは
  // useStateにキャッシュせず毎回読み直す（マスタ画面での追加を即反映する）。
  // masterVersionはこの画面自身でマスタを追加したときの再描画用。
  const [, setMasterVersion] = useState(0);
  const masters = getMasters();
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
  // 同じ日はシュートが繋がっているため、新規入力時はその日の最後のエンド額を
  // スタート額の初期値として引き継ぐ（編集時は元の値をそのまま使う）。
  const [startAmount, setStartAmount] = useState(() =>
    editRecord ? editRecord.startAmount : (getLastEndAmountForDate(date) ?? 0));
  const [endAmount, setEndAmount] = useState(editRecord?.endAmount ?? 0);
  const [memo, setMemo] = useState(editRecord?.memo ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  // 抜けていたシュートを後から挿入する位置（新規入力時のみ）。'end'＝最後に
  // 追加、'start'＝先頭に挿入、それ以外はそのIDのシュートの直後に挿入する。
  const [insertAfter, setInsertAfter] = useState('end');

  const dayRecords = getRecordsForDateSorted(date);
  const otherDayRecords = dayRecords.filter(r => r.id !== editRecord?.id);

  const storeProfit = endAmount - startAmount;
  // 客の勝敗として入力（＋＝客が勝った）。店収支として保存する際は符号を反転する。
  const getCustomerOwnAmount = (id: string) => {
    const mag = Number(customerProfits[id]) || 0;
    return customerProfitSigns[id] === '-' ? -mag : mag;
  };
  const allocatedSum = customerIds.reduce((s, id) => s + getCustomerOwnAmount(id), 0);
  const requiredSum = -storeProfit;

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    // 日付を変更したら、その日の最後のエンド額にスタートを繋ぎ直す
    // （新規入力時のみ。編集時は元の値をそのまま使う）。
    if (!editRecord) {
      setInsertAfter('end');
      setStartAmount(getLastEndAmountForDate(newDate) ?? 0);
    }
  };

  const handleInsertAfterChange = (val: string) => {
    setInsertAfter(val);
    if (val === 'start') { setStartAmount(0); return; }
    if (val === 'end') { setStartAmount(dayRecords.length ? dayRecords[dayRecords.length - 1].endAmount : 0); return; }
    setStartAmount(dayRecords.find(r => r.id === val)?.endAmount ?? 0);
  };

  // 新規シュートのcreatedAtを、選んだ挿入位置に応じてその日の並びの中に
  // 収まるよう計算する（既存シュートのcreatedAtの間の時刻にする）。
  const computeInsertedCreatedAt = (): string => {
    if (dayRecords.length === 0 || insertAfter === 'end') return new Date().toISOString();
    if (insertAfter === 'start') {
      return new Date(new Date(dayRecords[0].createdAt).getTime() - 1000).toISOString();
    }
    const idx = dayRecords.findIndex(r => r.id === insertAfter);
    if (idx === -1 || idx === dayRecords.length - 1) return new Date().toISOString();
    const prevT = new Date(dayRecords[idx].createdAt).getTime();
    const nextT = new Date(dayRecords[idx + 1].createdAt).getTime();
    return new Date((prevT + nextT) / 2).toISOString();
  };

  const refreshMasters = () => setMasterVersion(v => v + 1);

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
      createdAt: editRecord?.createdAt ?? computeInsertedCreatedAt(),
    };
    if (editRecord) {
      updateRecord(record);
    } else {
      saveRecord(record);
    }
    // 抜けの挿入・エンド額の修正などで、この記録より後ろのシュートのスタート
    // 額がずれていれば連鎖的に繋ぎ直す。
    reflowDay(date, record.id);
    setTimeout(() => {
      setSaving(false);
      if (!editRecord) {
        setTable(''); setDealerIds([]); setShuffle(''); setCustomerIds([]);
        setCustomerProfits({}); setCustomerProfitSigns({});
        setInsertAfter('end');
        // 次のシュートは今保存したエンド額から繋げる。
        setStartAmount(endAmount); setEndAmount(0); setMemo('');
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
            type="date" value={date} onChange={e => handleDateChange(e.target.value)}
            style={{
              width: '100%', maxWidth: '100%', padding: '12px 10px', background: '#0E1712',
              border: `1px solid ${BDR}`, borderRadius: 6, fontSize: 15, color: TEXT,
              fontFamily: BRUSH, colorScheme: 'dark', boxSizing: 'border-box',
              WebkitAppearance: 'none', appearance: 'none', minWidth: 0,
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

        {!editRecord && dayRecords.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.1em', fontFamily: BRUSH, marginBottom: 6 }}>
              挿入位置（抜けていたシュートを後から入れる場合）
            </div>
            <select
              value={insertAfter} onChange={e => handleInsertAfterChange(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', background: '#0E1712', border: `1px solid ${BDR}`,
                borderRadius: 6, fontSize: 13, color: TEXT, fontFamily: BRUSH, outline: 'none',
                boxSizing: 'border-box', marginBottom: 10,
              }}
            >
              <option value="end">最後に追加（{dayRecords.length}シュートの後）</option>
              <option value="start">先頭に挿入（1シュートより前）</option>
              {dayRecords.map((r, i) => (
                i < dayRecords.length - 1 &&
                <option key={r.id} value={r.id}>{i + 1}シュートの後に挿入</option>
              ))}
            </select>
            <DayShootList records={dayRecords} />
            <div style={{ fontSize: 11, color: SUB, fontFamily: BRUSH, marginTop: 6, lineHeight: 1.6 }}>
              挿入すると、後ろのシュートのスタート額はこの記録のエンド額に自動で繋ぎ直されます。
            </div>
          </div>
        )}

        {editRecord && otherDayRecords.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.1em', fontFamily: BRUSH, marginBottom: 6 }}>
              この日の他のシュート
            </div>
            <DayShootList records={dayRecords} currentId={editRecord.id} onEditRecord={onEditRecord} />
            <div style={{ fontSize: 11, color: SUB, fontFamily: BRUSH, marginTop: 6, lineHeight: 1.6 }}>
              このシュートを更新すると、後ろのシュートのスタート額は自動で繋ぎ直されます。他のシュートをタップすると編集できます。
            </div>
          </div>
        )}

        <AmountField label="スタート（店の開始額）" amount={startAmount} onChange={setStartAmount} accent={GOLD} />
        <AmountField label="エンド（店の終了額）" amount={endAmount} onChange={setEndAmount} accent="#00C896" />

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

function DayShootList({ records, currentId, onEditRecord }: {
  records: BaccaratRecord[];
  currentId?: string;
  onEditRecord?: (record: BaccaratRecord) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {records.map((r, i) => {
        const profit = r.endAmount - r.startAmount;
        const isCurrent = r.id === currentId;
        const clickable = !isCurrent && !!onEditRecord;
        return (
          <div
            key={r.id}
            onClick={clickable ? () => onEditRecord(r) : undefined}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
              padding: '8px 10px', borderRadius: 6, fontSize: 12, fontFamily: BRUSH,
              background: isCurrent ? `${GOLD}14` : CARD, border: `1px solid ${isCurrent ? GOLD : BDR}`,
              cursor: clickable ? 'pointer' : 'default',
            }}
          >
            <span style={{ color: isCurrent ? GOLDB : TEXT, flexShrink: 0 }}>
              {i + 1}シュート{isCurrent && '（編集中）'}
            </span>
            <span style={{ color: SUB, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {r.startAmount.toLocaleString()} → {r.endAmount.toLocaleString()}
            </span>
            <span style={{ color: profit > 0 ? GOLDB : profit < 0 ? REDB : SUB, fontWeight: 700, flexShrink: 0 }}>
              {formatYen(profit)}円
            </span>
          </div>
        );
      })}
    </div>
  );
}
