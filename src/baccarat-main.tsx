import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './baccarat/index.css';
import { BaccaratApp } from './baccarat/BaccaratApp';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BaccaratApp />
  </StrictMode>,
);
