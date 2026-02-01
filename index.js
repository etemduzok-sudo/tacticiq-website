import React from 'react';
import { registerRootComponent } from 'expo';
import { I18nextProvider } from 'react-i18next';
import i18n from './src/i18n';
import App from './App';

// I18nextProvider - dil degisikliginin tum uygulamaya yansimasi icin
function AppWithI18n() {
  return (
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  );
}

registerRootComponent(AppWithI18n);
