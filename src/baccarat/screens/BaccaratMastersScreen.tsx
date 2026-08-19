import { useState } from 'react';
import type { MasterKind } from '../types';
import { MASTER_LABELS } from '../types';
import { getMasters, addMasterItem, removeMasterItem, getRecords, clearRecords } from '../storage';
import { GOLD, GOLDB, REDB, CARD, BDR, TEXT, SUB, BRUSH, FELTD, NAV_H } from '../theme';

interface Props {
  onDataChange: () => void;
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
          onKeyDown={e => e.key === 'Enter' && !e.nativeEvent.isComposing && add()}
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

export function BaccaratMastersScreen({ onDataChange }: Props) {
  const [masters, setMasters] = useState(getMasters);
  const [toast, setToast] = useState<string | null>(null);
  const [seedConfirm, setSeedConfirm] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);

  const refresh = () => { setMasters(getMasters()); onDataChange(); };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const handleSeed = async () => {
    const { generateMockData } = await import('../mockData');
    generateMockData(1000);
    setSeedConfirm(false);
    refresh();
    showToast('サンプルデータを1000件生成しました');
  };

  const handleClear = () => {
    clearRecords();
    setClearConfirm(false);
    refresh();
    showToast('記録を全て削除しました');
  };

  const canShare = typeof navigator !== 'undefined' && 'share' in navigator && 'canShare' in navigator;

  const handleExport = async () => {
    // Inside a capability-enabled artifact view, real file downloads and
    // Web Share aren't available — offer the data via the downloads
    // capability instead. Elsewhere (the real deployed app) this branch
    // is skipped entirely.
    const claudeApi = (window as unknown as { claude?: { use?: (name: string) => Promise<unknown> } }).claude;
    if (claudeApi?.use) {
      const downloads = (await claudeApi.use('downloads')) as {
        save: (req: { filename: string; data: string }) => Promise<unknown>;
      } | null;
      if (downloads) {
        const { getCSVText, getCSVFilename } = await import('../csvExport');
        const csv = getCSVText();
        const filename = getCSVFilename();
        try {
          await downloads.save({ filename, data: csv });
          showToast('CSVをダウンロードしました');
        } catch (err) {
          const code = (err as { code?: string })?.code;
          if (code === 'rejected_extension' || code === 'extension_not_enabled') {
            try {
              await downloads.save({ filename: filename.replace(/\.csv$/, '.txt'), data: csv });
              showToast('テキストファイルとしてダウンロードしました');
            } catch {
              showToast('ダウンロードできませんでした');
            }
          } else if (code !== 'declined') {
            showToast('ダウンロードできませんでした');
          }
        }
        return;
      }
    }

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

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px', paddingBottom: NAV_H + 16 }}>
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

        <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: SUB, fontFamily: BRUSH, lineHeight: 1.7, marginBottom: 10 }}>
            現在の記録件数：{getRecords().length.toLocaleString()}件（テスト用）
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setSeedConfirm(true)} style={{
              flex: 1, padding: '11px', borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: BRUSH,
              background: `${GOLD}0A`, border: `1px solid ${GOLD}33`, color: GOLD, cursor: 'pointer',
            }}>
              サンプルデータを1000件生成
            </button>
            <button onClick={() => setClearConfirm(true)} style={{
              flex: 1, padding: '11px', borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: BRUSH,
              background: 'transparent', border: `1px solid ${BDR}`, color: SUB, cursor: 'pointer',
            }}>
              記録を全て削除
            </button>
          </div>
          {seedConfirm && (
            <div style={{ marginTop: 10, padding: 12, background: `${GOLD}0A`, border: `1px solid ${GOLD}33`, borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: TEXT, fontFamily: BRUSH, marginBottom: 10, lineHeight: 1.7 }}>
                ディーラー・シャッフル方式・卓・客IDのマスタも合わせてランダム生成し、既存の記録に追加します。動作確認用です。
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleSeed} style={{
                  flex: 1, padding: '9px', borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: BRUSH,
                  background: GOLD, color: '#0A0900', border: 'none', cursor: 'pointer',
                }}>生成する</button>
                <button onClick={() => setSeedConfirm(false)} style={{
                  padding: '9px 16px', borderRadius: 6, fontSize: 12, fontFamily: BRUSH,
                  background: 'transparent', color: SUB, border: `1px solid ${BDR}`, cursor: 'pointer',
                }}>取消</button>
              </div>
            </div>
          )}
          {clearConfirm && (
            <div style={{ marginTop: 10, padding: 12, background: `${REDB}14`, border: `1px solid ${REDB}44`, borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: REDB, fontFamily: BRUSH, marginBottom: 10, lineHeight: 1.7 }}>
                記録を全て削除します（マスタ一覧は残ります）。元に戻せません。
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleClear} style={{
                  flex: 1, padding: '9px', borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: BRUSH,
                  background: REDB, color: '#fff', border: 'none', cursor: 'pointer',
                }}>削除する</button>
                <button onClick={() => setClearConfirm(false)} style={{
                  padding: '9px 16px', borderRadius: 6, fontSize: 12, fontFamily: BRUSH,
                  background: 'transparent', color: SUB, border: `1px solid ${BDR}`, cursor: 'pointer',
                }}>取消</button>
              </div>
            </div>
          )}
        </div>

        {KINDS.map(kind => (
          <MasterList key={kind} kind={kind} values={masters[kind]} onChange={refresh} />
        ))}
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
