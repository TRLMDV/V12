import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Suppliers from "./pages/Suppliers";
import Customers from "./pages/Customers";
import Warehouses from "./pages/Warehouses";
import IncomingPayments from "./pages/IncomingPayments";
import OutgoingPayments from "./pages/OutgoingPayments";
import ProductMovement from "./pages/ProductMovement";
import PurchaseOrders from "./pages/PurchaseOrders";
import SellOrders from "./pages/SellOrders";
import Finance from "./pages/Finance";
import Profitability from "./pages/Profitability";
import DataImportExport from "./pages/DataImportExport";
import SettingsPage from "./pages/Settings";
import Bank from "./pages/Bank";
import Utilization from "./pages/Utilization";
import ExpeditorsReport from "./pages/ExpeditorsReport";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import AuthGuard from "./components/AuthGuard";
import Help from "./pages/Help";
// MOCK_CURRENT_DATE is not used directly in App.tsx, removing import

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="bottom-left" /> {/* Changed position to bottom-left */}
      <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<AuthGuard><MainLayout><Dashboard /></MainLayout></AuthGuard>} />
            <Route path="/products" element={<AuthGuard><MainLayout><Products /></MainLayout></AuthGuard>} />
            <Route path="/purchase-orders" element={<AuthGuard><MainLayout><PurchaseOrders /></MainLayout></AuthGuard>} />
            <Route path="/sell-orders" element={<AuthGuard><MainLayout><SellOrders /></MainLayout></AuthGuard>} />
            <Route path="/suppliers" element={<AuthGuard><MainLayout><Suppliers /></MainLayout></AuthGuard>} />
            <Route path="/customers" element={<AuthGuard><MainLayout><Customers /></MainLayout></AuthGuard>} />
            <Route path="/incoming-payments" element={<AuthGuard><MainLayout><IncomingPayments /></MainLayout></AuthGuard>} />
            <Route path="/outgoing-payments" element={<AuthGuard><MainLayout><OutgoingPayments /></MainLayout></AuthGuard>} />
            <Route path="/warehouses" element={<AuthGuard><MainLayout><Warehouses /></MainLayout></AuthGuard>} />
            <Route path="/product-movement" element={<AuthGuard><MainLayout><ProductMovement /></MainLayout></AuthGuard>} />
            <Route path="/finance" element={<AuthGuard><MainLayout><Finance /></MainLayout></AuthGuard>} />
            <Route path="/profitability" element={<AuthGuard><MainLayout><Profitability /></MainLayout></AuthGuard>} />
            <Route path="/data-import-export" element={<AuthGuard><MainLayout><DataImportExport /></MainLayout></AuthGuard>} />
            <Route path="/settings" element={<AuthGuard><MainLayout><SettingsPage /></MainLayout></AuthGuard>} />
            <Route path="/bank" element={<AuthGuard><MainLayout><Bank /></MainLayout></AuthGuard>} />
            <Route path="/utilization" element={<AuthGuard><MainLayout><Utilization /></MainLayout></AuthGuard>} />
            <Route path="/expeditors-report" element={<AuthGuard><MainLayout><ExpeditorsReport /></MainLayout></AuthGuard>} />
            <Route path="/help" element={<AuthGuard><MainLayout><Help /></MainLayout></AuthGuard>} />
            <Route path="*" element={<AuthGuard><NotFound /></AuthGuard>} />
          </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;