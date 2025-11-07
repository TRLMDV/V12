import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { DataProvider } from "./context/DataContext.tsx"; // Import DataProvider

createRoot(document.getElementById("root")!).render(
  <DataProvider> {/* Wrap App with DataProvider */}
    <App />
  </DataProvider>
);