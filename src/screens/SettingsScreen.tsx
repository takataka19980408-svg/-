import { useRef, useState } from 'react';
import { getSettings, saveSettings, exportCSV, exportBackup, restoreBackup, clearAllData, getExpenses } from '../storage';
import { C, NAV_H } from '../theme';
import { Card, SectionTitle } from '../components/ui';

interface Props { onDataChange: () => void; }

export function SettingsScreen({ onDataChange }: Props) {
  const [settings, setSettings] = useState(getSettings());
  const [budgetInput, setBudgetInput] = useState(settings.monthlyBudget != null ? String(settings.monthlyBudget) : '');
  const [message, setMessage] = useState('');
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const applyBudget = () => {
    const n = parseInt(budgetInput.replace(/[^0-9]/g, ''), 10);
    const next = { ...settings, monthlyBudget: Number.isFinite(n) && n > 0 ? n : null };
    setSettings(next);
    saveSettings(next);
    setMessage('予算を保存しました');
    setTimeout(() => setMessage(''), 1500);
  };

  const toggleSaveReceipts = () => {
    const next = { ...settings, saveReceiptImages: !settings.saveReceiptImages };
    setSettings(next);
    saveSettings(next);
  };

  const handleRestore = async (file: File) => {
    try {
      const text = await file.text();
      restoreBackup(text);
      onDataChange();
      setMessage('データを復元しました');
    } catch {
      setMessage('復元に失敗しました。ファイルを確認してください。');
    }
    setTimeout(() => setMessage(''), 2000);
  };

  const handleClear = () => {
    if (!confirm('すべての記録を削除します。この操作は取り消せません。よろしいですか？')) return;
    clearAllData();
    onDataChange();
    setMessage('データを削除しました');
    setTimeout(() => setMessage(''), 1500);
  };

  const count = getExpenses().length;

  return (
    <div style={{ background: C.page, minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flexShrink: 0, background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '18px 16px 14px', textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>設定</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, paddingBottom: NAV_H + 20 }}>

        {message && (
          <div style={{ padding: '10px 14px', background: C.brandDim, border: `1px solid ${C.brandBorder}`, borderRadius: 8, fontSize: 12, color: C.brand, marginBottom: 14 }}>
            {message}
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <SectionTitle>月の予算</SectionTitle>
          <Card style={{ padding: 16 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: C.textMuted }}>¥</span>
                <input
                  type="number" inputMode="numeric" value={budgetInput}
                  onChange={e => setBudgetInput(e.target.value)}
                  placeholder="未設定"
                  style={{ width: '100%', padding: '10px 12px 10px 24px', background: C.card2, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text }}
                />
              </div>
              <button onClick={applyBudget} style={{ padding: '10px 18px', borderRadius: 8, background: C.brand, color: '#fff', fontSize: 13, fontWeight: 700 }}>
                保存
              </button>
            </div>
          </Card>
        </div>

        <div style={{ marginBottom: 20 }}>
          <SectionTitle>レシート画像</SectionTitle>
          <Card style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>記録にレシート画像を保存</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>端末内にのみ保存されます</div>
            </div>
            <ToggleSwitch checked={settings.saveReceiptImages} onChange={toggleSaveReceipts} />
          </Card>
        </div>

        <div style={{ marginBottom: 20 }}>
          <SectionTitle>データ（{count}件）</SectionTitle>
          <Card style={{ padding: 8, display: 'flex', flexDirection: 'column' }}>
            <SettingsRow label="CSVで書き出す" onClick={exportCSV} />
            <SettingsRow label="バックアップを書き出す（JSON）" onClick={exportBackup} />
            <SettingsRow label="バックアップから復元する" onClick={() => restoreInputRef.current?.click()} />
            <input
              ref={restoreInputRef} type="file" accept="application/json" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleRestore(f); e.target.value = ''; }}
            />
            <SettingsRow label="すべてのデータを削除する" onClick={handleClear} danger last />
          </Card>
        </div>
      </div>
    </div>
  );
}

function SettingsRow({ label, onClick, danger, last }: { label: string; onClick: () => void; danger?: boolean; last?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '13px 10px', textAlign: 'left', fontSize: 13, fontWeight: 600,
        color: danger ? C.danger : C.text,
        borderBottom: last ? 'none' : `1px solid ${C.border}`,
      }}
    >
      {label}
    </button>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: 44, height: 26, borderRadius: 13, flexShrink: 0,
        background: checked ? C.brand : C.baseline,
        display: 'flex', alignItems: 'center', padding: 3, justifyContent: checked ? 'flex-end' : 'flex-start',
        transition: 'background 0.15s ease',
      }}
    >
      <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', display: 'block' }} />
    </button>
  );
}
