import React from 'react';
import ReactDOM from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import App from './App';
import './index.css';
import { Storage } from './services/storage';
import { SETTINGS_KEY, STORAGE_KEY, TRANSLATION_HISTORY_KEY } from './config/constants';

async function bootstrap() {
  // Load known persisted keys into the synchronous-cache layer before React mounts.
  await Storage.hydrate([
    SETTINGS_KEY,
    STORAGE_KEY,
    TRANSLATION_HISTORY_KEY,
    'lingualens_theme',
  ]);

  if (Capacitor.isNativePlatform()) {
    // Configure status bar inline. Imported lazily so web builds don't ship native plugin code.
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    try {
      await StatusBar.setStyle({ style: Style.Default });
    } catch {
      // StatusBar plugin not available — non-fatal
    }
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void bootstrap();
