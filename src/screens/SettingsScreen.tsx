import { useEffect, useRef, useState } from 'react';
import type { AppSettings } from '../types';
import { getSettings, saveSettings, exportCSV, importCSV, exportBackup, restoreBackup } from '../storage';

interface Props { onDataChange: () => void; }

const NAV_H = 60;

function SectionTitle({ label }: { label: string }) {
  return (
    <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--gold)', marginBottom: 10, borderLeft: '3px solid var(--red)', paddingLeft: 8 }}>
      {label}
    </div>
  );
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
      {children}
    </div>
  );
}

export function SettingsScreen({ onDataChange }: Props) {
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [toast, setToast] = useState<string | null>(null);
  const [restoreConfirm, setRestoreConfirm] = useState(false);
  const csvImportRef = useRef<HTMLInputElement>(null);
  const backupImportRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

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

  const handleExportCSV = () => {
    exportCSV();
    showToast('CSVをエクスポートしました');
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = importCSV(text);
      onDataChange();
      showToast(`${result.added}件のレコードをインポートしました`);
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const handleExportBackup = () => {
    exportBackup();
    showToast('バックアップを作成しました');
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const json = ev.target?.result as string;
      restoreBackup(json);
      onDataChange();
      setRestoreConfirm(false);
      showToast('バックアップを復元しました');
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const HOURS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(180deg,#0a0020,#080810)', flexShrink: 0 }}>
        <div style={{ height: 3, background: 'linear-gradient(90deg,var(--red),var(--gold),var(--red))' }} />
        <div style={{ padding: '14px 20px 12px', textAlign: 'center', borderBottom: '1px solid rgba(255,215,0,0.12)' }}>
          <span style={{ fontSize: 17, fontWeight: 900, letterSpacing: '0.25em', color: 'var(--gold)', textShadow: '0 0 16px rgba(255,215,0,0.4)', fontFamily: '"Hiragino Mincho ProN",serif' }}>
            設定
          </span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: NAV_H + 16 }}>

        {/* Day boundary */}
        <SectionTitle label="日付切替時刻" />
        <SettingsCard>
          <div style={{ fontSize: 12, color: 'var(--text-sub)', marginBottom: 12, fontFamily: 'sans-serif', lineHeight: 1.6 }}>
            深夜営業など日をまたぐ場合に、何時を「1日の境目」にするかを設定します。
            現在: <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{settings.dayBoundaryHour}:00</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {HOURS.map(h => (
              <button
                key={h}
                onClick={() => handleBoundaryChange(h)}
                style={{
                  width: 48, height: 36, borderRadius: 6, fontFamily: 'sans-serif', fontSize: 13, fontWeight: 700,
                  background: settings.dayBoundaryHour === h ? 'rgba(255,215,0,0.15)' : 'transparent',
                  border: `1px solid ${settings.dayBoundaryHour === h ? 'var(--gold)' : 'rgba(255,215,0,0.2)'}`,
                  color: settings.dayBoundaryHour === h ? 'var(--gold)' : 'var(--text-sub)',
                }}
              >
                {h}:00
              </button>
            ))}
          </div>
        </SettingsCard>

        {/* CSV */}
        <SectionTitle label="データ管理（CSV）" />
        <SettingsCard>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={handleExportCSV}
              style={{
                padding: '12px', borderRadius: 8, fontSize: 14, fontWeight: 700, fontFamily: 'sans-serif',
                background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.25)', color: 'var(--gold)',
              }}
            >
              CSV エクスポート
            </button>
            <div style={{ fontSize: 11, color: 'var(--text-sub)', fontFamily: 'sans-serif', paddingLeft: 4 }}>
              全レコードをCSVファイルとしてダウンロードします
            </div>

            <button
              onClick={() => csvImportRef.current?.click()}
              style={{
                padding: '12px', borderRadius: 8, fontSize: 14, fontWeight: 700, fontFamily: 'sans-serif',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,215,0,0.2)', color: 'var(--text-sub)',
              }}
            >
              CSV インポート
            </button>
            <div style={{ fontSize: 11, color: 'var(--text-sub)', fontFamily: 'sans-serif', paddingLeft: 4 }}>
              CSVファイルからレコードを読み込みます（既存データに追加）
            </div>
            <input ref={csvImportRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImportCSV} />
          </div>
        </SettingsCard>

        {/* Backup */}
        <SectionTitle label="バックアップ" />
        <SettingsCard>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={handleExportBackup}
              style={{
                padding: '12px', borderRadius: 8, fontSize: 14, fontWeight: 700, fontFamily: 'sans-serif',
                background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.25)', color: 'var(--gold)',
              }}
            >
              バックアップ作成
            </button>
            <div style={{ fontSize: 11, color: 'var(--text-sub)', fontFamily: 'sans-serif', paddingLeft: 4 }}>
              全データをJSONファイルとして保存します
            </div>

            {!restoreConfirm ? (
              <button
                onClick={() => setRestoreConfirm(true)}
                style={{
                  padding: '12px', borderRadius: 8, fontSize: 14, fontWeight: 700, fontFamily: 'sans-serif',
                  background: 'rgba(255,51,51,0.06)', border: '1px solid rgba(255,51,51,0.25)', color: 'var(--loss)',
                }}
              >
                バックアップ復元
              </button>
            ) : (
              <div style={{ background: 'rgba(255,51,51,0.08)', border: '1px solid rgba(255,51,51,0.3)', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--loss)', fontFamily: 'sans-serif', marginBottom: 10, lineHeight: 1.6 }}>
                  ⚠️ 現在のデータは全て上書きされます。本当に復元しますか？
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => backupImportRef.current?.click()}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 6, fontSize: 13, fontWeight: 700, fontFamily: 'sans-serif',
                      background: 'var(--loss)', color: '#fff', border: 'none',
                    }}
                  >
                    ファイルを選択して復元
                  </button>
                  <button
                    onClick={() => setRestoreConfirm(false)}
                    style={{
                      padding: '10px 16px', borderRadius: 6, fontSize: 13, fontFamily: 'sans-serif',
                      background: 'var(--bg-card)', color: 'var(--text-sub)', border: '1px solid var(--border)',
                    }}
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
            <input ref={backupImportRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleRestoreBackup} />
          </div>
        </SettingsCard>

        {/* Help */}
        <SectionTitle label="使い方ガイド" />
        <SettingsCard>
          <div style={{ fontSize: 13, color: 'var(--text-sub)', fontFamily: 'sans-serif', lineHeight: 1.8 }}>
            <div style={{ marginBottom: 8, color: 'var(--text-main)', fontWeight: 700 }}>ゼニ帳 の使い方</div>
            <div>① ホーム画面の「記録する」から戦績を入力</div>
            <div>② 店舗・種目・IN金額・OUT金額を入力して保存</div>
            <div>③ 履歴画面で過去の記録を確認・削除</div>
            <div>④ 分析画面で月別・種目別・曜日別の集計を確認</div>
            <div>⑤ ランキング画面で勝率の高い戦場をチェック</div>
          </div>
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(255,215,0,0.1)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-sub)', fontFamily: 'sans-serif' }}>
              ご意見・ご要望は開発者までお問い合わせください
            </div>
          </div>
        </SettingsCard>

        {/* App info */}
        <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(245,238,216,0.2)', fontFamily: 'sans-serif', paddingTop: 8 }}>
          ゼニ帳 v1.0
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: NAV_H + 16, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(15,15,24,0.95)', border: '1px solid rgba(255,215,0,0.3)',
          borderRadius: 8, padding: '10px 20px',
          fontSize: 13, fontFamily: 'sans-serif', color: 'var(--gold)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          zIndex: 500, whiteSpace: 'nowrap',
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
