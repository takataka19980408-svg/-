import { useState } from 'react';
import type { BaccaratScreen, BaccaratRecord } from './types';
import { BaccaratBottomNav } from './components/BaccaratBottomNav';
import { BaccaratRecordScreen } from './screens/BaccaratRecordScreen';
import { BaccaratHistoryScreen } from './screens/BaccaratHistoryScreen';
import { BaccaratSummaryScreen } from './screens/BaccaratSummaryScreen';
import { BaccaratMastersScreen } from './screens/BaccaratMastersScreen';

export function BaccaratApp() {
  const [screen, setScreen] = useState<BaccaratScreen>('summary');
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingRecord, setEditingRecord] = useState<BaccaratRecord | null>(null);

  const handleDataChange = () => setRefreshKey(k => k + 1);

  // 入力画面は他の画面に切り替えても入力途中の内容を消さないため、タブ移動
  // だけではeditingRecordをクリアしない（保存・キャンセル時のみクリアする）。
  const handleNavChange = (s: BaccaratScreen) => setScreen(s);

  return (
    <>
      <div style={{ display: screen === 'record' ? 'block' : 'none' }}>
        <BaccaratRecordScreen
          key={editingRecord?.id ?? 'new'}
          editRecord={editingRecord}
          onCancel={editingRecord ? () => { setEditingRecord(null); setScreen('history'); } : undefined}
          onSaved={() => { handleDataChange(); setEditingRecord(null); setScreen('history'); }}
          onEditRecord={record => setEditingRecord(record)}
        />
      </div>
      {screen === 'history' && (
        <BaccaratHistoryScreen
          refreshKey={refreshKey}
          onDataChange={handleDataChange}
          onEdit={record => { setEditingRecord(record); setScreen('record'); }}
        />
      )}
      {screen === 'summary' && <BaccaratSummaryScreen refreshKey={refreshKey} />}
      {screen === 'masters' && <BaccaratMastersScreen onDataChange={handleDataChange} />}
      <BaccaratBottomNav active={screen} onChange={handleNavChange} />
    </>
  );
}
