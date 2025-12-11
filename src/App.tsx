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
// MOCK_CURRENT_DATE is not used directly in App.tsx, removing import

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="bottom-left" /> {/* Changed position to bottom-left */}
      <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout><Dashboard /></MainLayout>} />
            <Route path="/products" element={<MainLayout><Products /></MainLayout>} />
            <Route path="/purchase-orders" element={<MainLayout><PurchaseOrders /></MainLayout>} />
            <Route path="/sell-orders" element={<MainLayout><SellOrders /></MainLayout>} />
            <Route path="/suppliers" element={<MainLayout><Suppliers /></MainLayout>} />
            <Route path="/customers" element={<MainLayout><Customers /></MainLayout>} />
            <Route path="/incoming-payments" element={<MainLayout><IncomingPayments /></MainLayout>} />
            <Route path="/outgoing-payments" element={<MainLayout><OutgoingPayments /></MainLayout>} />
            <Route path="/warehouses" element={<MainLayout><Warehouses /></MainLayout>} />
            <Route path="/product-movement" element={<MainLayout><ProductMovement /></MainLayout>} />
            <Route path="/finance" element={<MainLayout><Finance /></MainLayout>} />
            <Route path="/profitability" element={<MainLayout><Profitability /></MainLayout>} />
            <Route path="/data-import-export" element={<MainLayout><DataImportExport /></MainLayout>} />
            <Route path="/settings" element={<MainLayout><SettingsPage /></MainLayout>} />
            <Route path="/bank" element={<MainLayout><Bank /></MainLayout>} />
            <Route path="/utilization" element={<MainLayout><Utilization /></MainLayout>} />
            <Route path="/expeditors-report" element={<MainLayout><ExpeditorsReport /></MainLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;