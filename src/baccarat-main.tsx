import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './baccarat/index.css';
import { BaccaratApp } from './baccarat/BaccaratApp';
import { BaccaratAuthGate } from './baccarat/BaccaratAuthGate';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BaccaratAuthGate>
      <BaccaratApp />
    </BaccaratAuthGate>
  </StrictMode>,
);
