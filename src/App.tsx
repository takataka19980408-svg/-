import { useState } from 'react';
import type { AppMode } from './appMode';
import { getAppMode, setAppMode } from './appMode';
import PersonalApp from './PersonalApp';
import { BaccaratApp } from './baccarat/BaccaratApp';

export default function App() {
  const [mode, setMode] = useState<AppMode>(getAppMode);

  if (mode === 'baccarat') {
    return <BaccaratApp onSwitchToPersonal={() => { setAppMode('personal'); setMode('personal'); }} />;
  }
  return <PersonalApp onSwitchToBaccarat={() => { setAppMode('baccarat'); setMode('baccarat'); }} />;
}
