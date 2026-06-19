import { useState, useEffect } from 'react';
import './index.css';
import type { MainScreen } from './types';
import { getRecords } from './storage';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './screens/HomeScreen';
import { RecordScreen } from './screens/RecordScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { AnalysisScreen } from './screens/AnalysisScreen';
import { RankingScreen } from './screens/RankingScreen';
import { SettingsScreen } from './screens/SettingsScreen';

const SEEDED_KEY = 'zenicho_seeded';

export default function App() {
  const [screen, setScreen] = useState<MainScreen>('home');
  const [showRecord, setShowRecord] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (localStorage.getItem(SEEDED_KEY)) return;
    if (getRecords().length > 0) { localStorage.setItem(SEEDED_KEY, '1'); return; }
    fetch('./seed_data.json')
      .then(r => r.json())
      .then(data => {
        localStorage.setItem('zenicho_records',  JSON.stringify(data.records));
        localStorage.setItem('zenicho_stores',   JSON.stringify(data.stores ?? []));
        localStorage.setItem(SEEDED_KEY, '1');
        setRefreshKey(k => k + 1);
      })
      .catch(() => {});
  }, []);

  const handleSaved = () => {
    setRefreshKey(k => k + 1);
    setShowRecord(false);
  };

  if (showRecord) {
    return <RecordScreen onBack={() => setShowRecord(false)} onSaved={handleSaved} />;
  }

  return (
    <>
      {screen === 'home'     && <HomeScreen onRecord={() => setShowRecord(true)} refreshKey={refreshKey} />}
      {screen === 'history'  && <HistoryScreen refreshKey={refreshKey} />}
      {screen === 'analysis' && <AnalysisScreen refreshKey={refreshKey} />}
      {screen === 'ranking'  && <RankingScreen refreshKey={refreshKey} />}
      {screen === 'settings' && <SettingsScreen onDataChange={() => setRefreshKey(k => k + 1)} />}
      <BottomNav active={screen} onChange={setScreen} />
    </>
  );
}
