// Web için özel entry point (Expo Router yok; package.json "web" ile kullanılır)
(function(){ if (typeof document !== 'undefined') { document.documentElement.style.backgroundColor = '#0F2A24'; if (document.body) document.body.style.backgroundColor = '#0F2A24'; else document.addEventListener('DOMContentLoaded', function(){ document.body.style.backgroundColor = '#0F2A24'; }); } })();
import React from 'react';
import { registerRootComponent } from 'expo';
import { I18nextProvider } from 'react-i18next';
import i18n from './src/i18n';
import App from './App';

function AppWithI18n() {
  return (
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  );
}

registerRootComponent(AppWithI18n);
