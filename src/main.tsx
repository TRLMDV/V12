import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { I18nProvider } from './context/I18nProvider';
import { DataProvider } from "@/context/DataContext.tsx"; // Use alias for consistent import

createRoot(document.getElementById("root")!).render(
  <React.StrictMode> {/* Wrap App with StrictMode for development checks */}
    <I18nProvider>
      <App />
    </I18nProvider>
  </React.StrictMode>
);