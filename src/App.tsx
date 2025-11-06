import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DataProvider } from "./context/DataContext";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Suppliers from "./pages/Suppliers"; // Import Suppliers page
import Customers from "./pages/Customers"; // Import Customers page
import Warehouses from "./pages/Warehouses"; // Import Warehouses page
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <DataProvider>
          <Routes>
            <Route path="/" element={<MainLayout><Dashboard /></MainLayout>} />
            <Route path="/products" element={<MainLayout><Products /></MainLayout>} />
            <Route path="/suppliers" element={<MainLayout><Suppliers /></MainLayout>} /> {/* New Suppliers Route */}
            <Route path="/customers" element={<MainLayout><Customers /></MainLayout>} /> {/* New Customers Route */}
            <Route path="/warehouses" element={<MainLayout><Warehouses /></MainLayout>} /> {/* New Warehouses Route */}
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </DataProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;