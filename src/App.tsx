import { useState } from 'react';
import './index.css';
import { HomeScreen } from './screens/HomeScreen';
import { RecordScreen } from './screens/RecordScreen';

type Screen = 'home' | 'record';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSaved = () => {
    setRefreshKey(k => k + 1);
    setScreen('home');
  };

  return (
    <>
      {screen === 'home' && (
        <HomeScreen
          onRecord={() => setScreen('record')}
          refreshKey={refreshKey}
        />
      )}
      {screen === 'record' && (
        <RecordScreen
          onBack={() => setScreen('home')}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
