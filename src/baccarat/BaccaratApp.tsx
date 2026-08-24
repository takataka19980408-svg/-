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

  const handleNavChange = (s: BaccaratScreen) => {
    if (s !== 'record') setEditingRecord(null);
    setScreen(s);
  };

  return (
    <>
      {screen === 'record'  && (
        <BaccaratRecordScreen
          key={editingRecord?.id ?? 'new'}
          editRecord={editingRecord}
          onCancel={editingRecord ? () => { setEditingRecord(null); setScreen('history'); } : undefined}
          onSaved={() => { handleDataChange(); setEditingRecord(null); setScreen('history'); }}
          onEditRecord={record => setEditingRecord(record)}
        />
      )}
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
