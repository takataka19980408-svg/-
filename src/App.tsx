import { useState } from 'react';
import './index.css';
import type { MainScreen } from './types';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './screens/HomeScreen';
import { RecordScreen } from './screens/RecordScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { AnalysisScreen } from './screens/AnalysisScreen';
import { SettingsScreen } from './screens/SettingsScreen';

export default function App() {
  const [screen, setScreen] = useState<MainScreen>('home');
  const [showRecord, setShowRecord] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSaved = () => {
    setRefreshKey(k => k + 1);
    setShowRecord(false);
  };

  if (showRecord) {
    return <RecordScreen onBack={() => setShowRecord(false)} onSaved={handleSaved} />;
  }

  return (
    <>
      {screen === 'home'     && <HomeScreen refreshKey={refreshKey} />}
      {screen === 'history'  && <HistoryScreen refreshKey={refreshKey} />}
      {screen === 'analysis' && <AnalysisScreen refreshKey={refreshKey} />}
      {screen === 'settings' && <SettingsScreen onDataChange={() => setRefreshKey(k => k + 1)} />}
      <BottomNav active={screen} onChange={setScreen} onRecord={() => setShowRecord(true)} />
    </>
  );
}
