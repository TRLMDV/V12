import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { DataProvider } from "@/context/DataContext.tsx"; // Use alias for consistent import

createRoot(document.getElementById("root")!).render(
  <React.StrictMode> {/* Wrap App with StrictMode for development checks */}
    <DataProvider>
      <App />
    </DataProvider>
  </React.StrictMode>
);