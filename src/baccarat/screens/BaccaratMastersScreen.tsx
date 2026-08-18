import { useState } from 'react';
import type { MasterKind } from '../types';
import { MASTER_LABELS } from '../types';
import { getMasters, addMasterItem, removeMasterItem } from '../storage';
import { GOLD, GOLDB, RED, REDB, CARD, BDR, TEXT, SUB, BRUSH, FELTD, NAV_H } from '../theme';
import { setAppMode } from '../../appMode';

interface Props {
  onDataChange: () => void;
  onSwitchToPersonal: () => void;
}

const KINDS: MasterKind[] = ['dealers', 'shuffles', 'tables', 'customers'];

function MasterList({ kind, values, onChange }: { kind: MasterKind; values: string[]; onChange: () => void }) {
  const [newVal, setNewVal] = useState('');
  const [confirmVal, setConfirmVal] = useState<string | null>(null);

  const add = () => {
    const v = newVal.trim();
    if (!v) return;
    addMasterItem(kind, v);
    setNewVal('');
    onChange();
  };

  return (
    <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, fontFamily: BRUSH, marginBottom: 10, letterSpacing: '0.08em' }}>
        {MASTER_LABELS[kind]}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: values.length ? 12 : 0 }}>
        {values.map(v => (
          <span key={v} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 12, padding: '5px 10px', borderRadius: 14,
            background: `${GOLD}14`, border: `1px solid ${GOLD}33`, color: TEXT, fontFamily: BRUSH,
          }}>
            {v}
            {confirmVal === v ? (
              <button onClick={() => { removeMasterItem(kind, v); setConfirmVal(null); onChange(); }} style={{
                background: 'none', border: 'none', color: REDB, cursor: 'pointer', fontSize: 12, padding: 0,
              }}>削除?</button>
            ) : (
              <button onClick={() => setConfirmVal(v)} style={{
                background: 'none', border: 'none', color: SUB, cursor: 'pointer', fontSize: 12, padding: 0,
              }}>×</button>
            )}
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="text" value={newVal}
          onChange={e => setNewVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder={`${MASTER_LABELS[kind]}を追加`}
          style={{
            flex: 1, padding: '9px 12px', background: '#0a0f0c', border: `1px solid ${BDR}`, borderRadius: 6,
            fontSize: 13, color: TEXT, fontFamily: BRUSH, outline: 'none', boxSizing: 'border-box',
          }}
        />
        <button onClick={add} style={{
          padding: '9px 16px', borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: BRUSH,
          background: GOLD, color: '#0A0900', border: 'none', cursor: 'pointer',
        }}>追加</button>
      </div>
    </div>
  );
}

export function BaccaratMastersScreen({ onDataChange, onSwitchToPersonal }: Props) {
  const [masters, setMasters] = useState(getMasters);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = () => { setMasters(getMasters()); onDataChange(); };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const canShare = typeof navigator !== 'undefined' && 'share' in navigator && 'canShare' in navigator;

  const handleExport = async () => {
    const { exportXLSX, getXLSXFile } = await import('../xlsxExport');
    const { blob, filename } = getXLSXFile();
    const file = new File([blob], filename, { type: blob.type });
    try {
      if (canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'バカラ卓 運用データ' });
      } else {
        exportXLSX();
      }
      showToast('エクセルを出力しました');
    } catch {
      exportXLSX();
    }
  };

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#07100C' }}>
      <div style={{ flexShrink: 0, background: `linear-gradient(180deg,${FELTD},#07100C)`, borderBottom: `1px solid ${BDR}` }}>
        <div style={{ padding: '14px 20px 12px', textAlign: 'center' }}>
          <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '0.2em', color: GOLD, fontFamily: BRUSH }}>マスタ設定</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: NAV_H + 16 }}>
        <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: SUB, fontFamily: BRUSH, lineHeight: 1.7, marginBottom: 10 }}>
            記録データをエクセル（.xlsx）で{canShare ? '送信' : '保存'}できます。サマリー・入力ログ・ディーラー別・シャッフル方式別・客別来店履歴の5シート構成です。
          </div>
          <button onClick={handleExport} style={{
            width: '100%', padding: '13px', borderRadius: 8, fontSize: 14, fontWeight: 700, fontFamily: BRUSH,
            background: `linear-gradient(135deg,#1D6F42 0%,#2E9E5B 100%)`,
            border: `1px solid #2E9E5B88`, color: '#EAFBF1', cursor: 'pointer', letterSpacing: '0.05em',
          }}>
            {canShare ? '📤 ' : '💾 '}エクセルで{canShare ? '送信' : '保存'}
          </button>
        </div>

        {KINDS.map(kind => (
          <MasterList key={kind} kind={kind} values={masters[kind]} onChange={refresh} />
        ))}

        <button
          onClick={() => { setAppMode('personal'); onSwitchToPersonal(); }}
          style={{
            width: '100%', padding: '12px', borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: BRUSH,
            background: 'transparent', border: `1px solid ${RED}44`, color: '#FF7A5C', cursor: 'pointer', marginTop: 8,
          }}
        >
          個人用アプリ（ゼニ帳）に切り替え
        </button>
      </div>

      {toast && (
        <div style={{
          position: 'fixed', bottom: NAV_H + 16, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(14,23,18,0.96)', border: `1px solid ${GOLD}44`, borderRadius: 8, padding: '10px 20px',
          fontSize: 13, fontFamily: BRUSH, color: GOLDB, zIndex: 500, whiteSpace: 'nowrap',
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
