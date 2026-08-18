import { useState } from 'react';
import type { BaccaratScreen } from './types';
import { BaccaratBottomNav } from './components/BaccaratBottomNav';
import { BaccaratRecordScreen } from './screens/BaccaratRecordScreen';
import { BaccaratHistoryScreen } from './screens/BaccaratHistoryScreen';
import { BaccaratSummaryScreen } from './screens/BaccaratSummaryScreen';
import { BaccaratMastersScreen } from './screens/BaccaratMastersScreen';

interface Props {
  onSwitchToPersonal: () => void;
}

export function BaccaratApp({ onSwitchToPersonal }: Props) {
  const [screen, setScreen] = useState<BaccaratScreen>('record');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDataChange = () => setRefreshKey(k => k + 1);

  return (
    <>
      {screen === 'record'  && <BaccaratRecordScreen onSaved={() => { handleDataChange(); setScreen('history'); }} />}
      {screen === 'history' && <BaccaratHistoryScreen refreshKey={refreshKey} onDataChange={handleDataChange} />}
      {screen === 'summary' && <BaccaratSummaryScreen refreshKey={refreshKey} />}
      {screen === 'masters' && <BaccaratMastersScreen onDataChange={handleDataChange} onSwitchToPersonal={onSwitchToPersonal} />}
      <BaccaratBottomNav active={screen} onChange={setScreen} />
    </>
  );
}
