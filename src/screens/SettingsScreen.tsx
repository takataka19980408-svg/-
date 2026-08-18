import { useEffect, useRef, useState } from 'react';
import type { AppSettings } from '../types';
import {
  getSettings, saveSettings, importCSV,
  exportBackup, restoreBackup, getBackupJson,
} from '../storage';

interface Props { onDataChange: () => void; onSwitchToBaccarat: () => void; }

const NAV_H = 60;
const GOLD  = '#C9A227';
const GOLDB = '#F5D060';
const RED   = '#9B1C10';
const REDB  = '#FF3300';
const CARD  = '#0F0E0A';
const BDR   = '#222018';
const TEXT  = '#EDE3C0';
const SUB   = '#524938';
const BRUSH = '"Shippori Mincho B1","Hiragino Mincho ProN","Yu Mincho",serif';

function SectionTitle({ label }: { label: string }) {
  return (
    <div style={{
      fontSize: 11, letterSpacing: '0.2em', color: GOLD,
      marginBottom: 10, borderLeft: `3px solid ${RED}`, paddingLeft: 8,
      fontFamily: BRUSH,
    }}>
      {label}
    </div>
  );
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: CARD, border: `1px solid ${BDR}`,
      borderRadius: 10, padding: '14px 16px', marginBottom: 16,
    }}>
      {children}
    </div>
  );
}

function ActionBtn({
  label, sub, color = GOLD, bg = `${GOLD}0D`, border: bd = `${GOLD}33`,
  onClick,
}: {
  label: string; sub?: string; color?: string; bg?: string; border?: string;
  onClick: () => void;
}) {
  return (
    <div>
      <button
        onClick={onClick}
        style={{
          width: '100%', padding: '12px', borderRadius: 8,
          fontSize: 14, fontWeight: 700, fontFamily: BRUSH,
          background: bg, border: `1px solid ${bd}`, color,
          cursor: 'pointer', letterSpacing: '0.05em',
        }}
      >
        {label}
      </button>
      {sub && (
        <div style={{ fontSize: 11, color: SUB, fontFamily: BRUSH, paddingLeft: 4, marginTop: 5 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

export function SettingsScreen({ onDataChange, onSwitchToBaccarat }: Props) {
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [toast, setToast] = useState<string | null>(null);
  const [restoreConfirm, setRestoreConfirm] = useState(false);
  const csvImportRef   = useRef<HTMLInputElement>(null);
  const backupImportRef = useRef<HTMLInputElement>(null);

  const canShare = typeof navigator !== 'undefined' && 'share' in navigator && 'canShare' in navigator;

  useEffect(() => { setSettings(getSettings()); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleBoundaryChange = (hour: number) => {
    const next = { ...settings, dayBoundaryHour: hour };
    setSettings(next);
    saveSettings(next);
    showToast(`日付切替時刻を ${hour}:00 に変更しました`);
  };

  const handleShareBackup = async () => {
    const { json, filename } = getBackupJson();
    const file = new File([json], filename, { type: 'application/json' });
    try {
      if (canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'ゼニ帳バックアップ' });
      } else {
        exportBackup();
      }
    } catch {
      exportBackup();
    }
  };

  const handleShareCSV = async () => {
    const records = (await import('../storage')).getRecords();
    const { CATEGORY_LABELS } = await import('../types');
    const header = '日付,時刻,店舗名,種目,IN,OUT,収支,メモ';
    const rows = records.map(r =>
      [r.date, r.time ?? '', r.storeName,
        CATEGORY_LABELS[r.category] ?? r.category,
        r.inAmount, r.outAmount, r.profit, r.memo ?? '',
      ].join(',')
    );
    const csv = '﻿' + [header, ...rows].join('\r\n');
    const today = new Date().toISOString().split('T')[0];
    const filename = `zenicho_${today}.csv`;
    const file = new File([csv], filename, { type: 'text/csv;charset=utf-8;' });
    try {
      if (canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'ゼニ帳データ' });
      } else {
        (await import('../storage')).exportCSV();
      }
    } catch {
      (await import('../storage')).exportCSV();
    }
  };

  const handleShareXLSX = async () => {
    const { exportXLSX, getXLSXFile } = await import('../xlsxExport');
    const { blob, filename } = getXLSXFile();
    const file = new File([blob], filename, { type: blob.type });
    try {
      if (canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'ゼニ帳データ' });
      } else {
        exportXLSX();
      }
    } catch {
      exportXLSX();
    }
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = importCSV(ev.target?.result as string);
      onDataChange();
      showToast(`${result.added}件のレコードをインポートしました`);
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      restoreBackup(ev.target?.result as string);
      onDataChange();
      setRestoreConfirm(false);
      showToast('バックアップを復元しました');
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const HOURS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#0A0905' }}>

      {/* Header */}
      <div style={{ flexShrink: 0, background: 'linear-gradient(180deg,#0E0D08,#0A0905)', borderBottom: `1px solid ${BDR}` }}>
        <div style={{ height: 4, background: `linear-gradient(90deg,${RED},${GOLD} 30%,${GOLDB} 50%,${GOLD} 70%,${RED})` }} />
        <div style={{ padding: '14px 20px 12px', textAlign: 'center' }}>
          <span style={{
            fontSize: 17, fontWeight: 800, letterSpacing: '0.25em',
            color: GOLD, fontFamily: BRUSH, textShadow: `0 0 16px ${GOLD}66`,
          }}>
            設定
          </span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: NAV_H + 16 }}>

        {/* ── データを共有 ── */}
        <SectionTitle label="データを共有" />
        <SettingsCard>
          <div style={{ fontSize: 12, color: SUB, fontFamily: BRUSH, lineHeight: 1.7, marginBottom: 12 }}>
            バックアップやエクセル・CSVを{canShare ? 'AirDrop・LINE・メール等で直接送信できます。' : 'ファイルとして保存できます。'}
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <button
              onClick={handleShareXLSX}
              style={{
                flex: 1, padding: '14px 8px', borderRadius: 8,
                fontSize: 13, fontWeight: 700, fontFamily: BRUSH,
                background: `linear-gradient(135deg,#1D6F42 0%,#2E9E5B 100%)`,
                border: `1px solid #2E9E5B88`, color: '#EAFBF1',
                cursor: 'pointer', letterSpacing: '0.05em',
              }}
            >
              {canShare ? '📤 ' : '💾 '}エクセル{canShare ? '\n送信' : '保存'}
            </button>
            <button
              onClick={handleShareBackup}
              style={{
                flex: 1, padding: '14px 8px', borderRadius: 8,
                fontSize: 13, fontWeight: 700, fontFamily: BRUSH,
                background: `linear-gradient(135deg,${GOLD}18,${GOLD}0A)`,
                border: `1px solid ${GOLD}55`, color: GOLDB,
                cursor: 'pointer', letterSpacing: '0.05em',
              }}
            >
              {canShare ? '📤 ' : '💾 '}バックアップ{canShare ? '\n送信' : '保存'}
            </button>
            <button
              onClick={handleShareCSV}
              style={{
                flex: 1, padding: '14px 8px', borderRadius: 8,
                fontSize: 13, fontWeight: 700, fontFamily: BRUSH,
                background: `${GOLD}0A`,
                border: `1px solid ${GOLD}33`, color: GOLD,
                cursor: 'pointer', letterSpacing: '0.05em',
              }}
            >
              {canShare ? '📤 ' : '💾 '}CSV{canShare ? '\n送信' : '保存'}
            </button>
          </div>
          <div style={{ fontSize: 11, color: SUB, fontFamily: BRUSH, lineHeight: 1.7 }}>
            エクセルは「サマリー」「記録」「店舗別」「種目別」「月別」の5シート構成で、そのままExcelやGoogleスプレッドシートで開けます。
          </div>
        </SettingsCard>

        {/* ── データを取り込む ── */}
        <SectionTitle label="データを取り込む" />
        <SettingsCard>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <ActionBtn
              label="バックアップから復元"
              sub="全データをJSONファイルから上書き復元します"
              color={REDB} bg={`${RED}0D`} border={`${RED}33`}
              onClick={() => setRestoreConfirm(true)}
            />
            {restoreConfirm && (
              <div style={{
                background: `${RED}0A`, border: `1px solid ${RED}44`,
                borderRadius: 8, padding: 12,
              }}>
                <div style={{ fontSize: 12, color: REDB, fontFamily: BRUSH, marginBottom: 10, lineHeight: 1.7 }}>
                  現在のデータは全て上書きされます。本当に復元しますか？
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => backupImportRef.current?.click()}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 6,
                      fontSize: 13, fontWeight: 700, fontFamily: BRUSH,
                      background: REDB, color: '#fff', border: 'none', cursor: 'pointer',
                    }}
                  >
                    ファイルを選択して復元
                  </button>
                  <button
                    onClick={() => setRestoreConfirm(false)}
                    style={{
                      padding: '10px 16px', borderRadius: 6,
                      fontSize: 13, fontFamily: BRUSH,
                      background: CARD, color: SUB,
                      border: `1px solid ${BDR}`, cursor: 'pointer',
                    }}
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
            <ActionBtn
              label="CSVをインポート"
              sub="CSVファイルからレコードを追加します（既存データは保持）"
              onClick={() => csvImportRef.current?.click()}
            />
            <input ref={csvImportRef}    type="file" accept=".csv"  style={{ display: 'none' }} onChange={handleImportCSV} />
            <input ref={backupImportRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportBackup} />
          </div>
        </SettingsCard>

        {/* ── 日付切替時刻 ── */}
        <SectionTitle label="日付切替時刻" />
        <SettingsCard>
          <div style={{ fontSize: 12, color: SUB, fontFamily: BRUSH, marginBottom: 12, lineHeight: 1.7 }}>
            深夜営業など日をまたぐ場合の境目。現在:{' '}
            <span style={{ color: GOLDB, fontWeight: 700 }}>{settings.dayBoundaryHour}:00</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {HOURS.map(h => (
              <button
                key={h}
                onClick={() => handleBoundaryChange(h)}
                style={{
                  width: 48, height: 36, borderRadius: 6,
                  fontFamily: BRUSH, fontSize: 13, fontWeight: 700,
                  background: settings.dayBoundaryHour === h ? `${GOLD}18` : 'transparent',
                  border: `1px solid ${settings.dayBoundaryHour === h ? GOLD : `${GOLD}22`}`,
                  color: settings.dayBoundaryHour === h ? GOLDB : SUB,
                  cursor: 'pointer',
                }}
              >
                {h}:00
              </button>
            ))}
          </div>
        </SettingsCard>

        {/* ── 使い方ガイド ── */}
        <SectionTitle label="使い方ガイド" />
        <SettingsCard>
          <div style={{ fontSize: 13, color: SUB, fontFamily: BRUSH, lineHeight: 1.9 }}>
            <div style={{ marginBottom: 8, color: TEXT, fontWeight: 700 }}>ゼニ帳 の使い方</div>
            <div>① 下タブ中央「記録」ボタンから戦績を入力</div>
            <div>② 店舗・IN金額・OUT金額を入力して保存</div>
            <div>③ 履歴タブで過去の記録を確認・メモ・削除</div>
            <div>④ 分析タブで月別・種目別・曜日別の集計を確認</div>
            <div>⑤ 設定タブの「データを共有」でエクセル・CSV・バックアップを他端末へ転送</div>
          </div>
        </SettingsCard>

        <button
          onClick={onSwitchToBaccarat}
          style={{
            width: '100%', padding: '12px', borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: BRUSH,
            background: 'transparent', border: `1px solid ${BDR}`, color: SUB, cursor: 'pointer', marginBottom: 16,
          }}
        >
          店舗用（バカラ卓 運用記録）に切り替え
        </button>

        <div style={{ textAlign: 'center', fontSize: 10, color: `${TEXT}22`, fontFamily: BRUSH, paddingTop: 4 }}>
          ゼニ帳 v1.0
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: NAV_H + 16, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(15,14,10,0.96)', border: `1px solid ${GOLD}44`,
          borderRadius: 8, padding: '10px 20px',
          fontSize: 13, fontFamily: BRUSH, color: GOLDB,
          boxShadow: `0 4px 20px rgba(0,0,0,0.6)`,
          zIndex: 500, whiteSpace: 'nowrap',
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
