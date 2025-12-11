import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { I18nProvider } from './context/I18nProvider';
import './globals.css';
import { DataProvider } from '@/context/DataContext';
import AuthProvider from '@/context/AuthProvider';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <DataProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </DataProvider>
    </I18nProvider>
  </React.StrictMode>
);