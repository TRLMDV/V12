"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { t } from '@/utils/i18n';
import { HelpCircle } from 'lucide-react';

import GettingStartedHelp from '@/components/help/GettingStartedHelp';
import ProductsHelp from '@/components/help/ProductsHelp';
import SuppliersCustomersHelp from '@/components/help/SuppliersCustomersHelp';
import WarehousesHelp from '@/components/help/WarehousesHelp';
import OrdersHelp from '@/components/help/OrdersHelp';
import PaymentsHelp from '@/components/help/PaymentsHelp';
import StockHelp from '@/components/help/StockHelp';
import BankHelp from '@/components/help/BankHelp';
import FinanceHelp from '@/components/help/FinanceHelp';
import SettingsHelp from '@/components/help/SettingsHelp';
import DashboardHelp from '@/components/help/DashboardHelp';
import DataHelp from '@/components/help/DataHelp';

const Help: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-sky-600" />
          <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-200">
            {t('help') || 'Help & Tutorials'}
          </h1>
        </div>
        <p className="text-muted-foreground mt-1">
          {t('learnToUseApp') || 'Learn how to use every part of the app with step-by-step guides and illustrations.'}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Add your screenshots under public/help/... (e.g., /help/products/add-product.png). If a file is missing, a diagram will show instead.
        </p>
      </div>

      <Tabs defaultValue="getting-started" className="w-full">
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="suppliers-customers">Suppliers & Customers</TabsTrigger>
          <TabsTrigger value="warehouses">Warehouses</TabsTrigger>
          <TabsTrigger value="orders">Purchase & Sell Orders</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="stock">Stock & Movements</TabsTrigger>
          <TabsTrigger value="bank">Bank</TabsTrigger>
          <TabsTrigger value="finance">Finance & Profitability</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="data">Import/Export & Recycle Bin</TabsTrigger>
        </TabsList>

        <TabsContent value="getting-started" className="mt-4">
          <GettingStartedHelp />
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <ProductsHelp />
        </TabsContent>

        <TabsContent value="suppliers-customers" className="mt-4">
          <SuppliersCustomersHelp />
        </TabsContent>

        <TabsContent value="warehouses" className="mt-4">
          <WarehousesHelp />
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <OrdersHelp />
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <PaymentsHelp />
        </TabsContent>

        <TabsContent value="stock" className="mt-4">
          <StockHelp />
        </TabsContent>

        <TabsContent value="bank" className="mt-4">
          <BankHelp />
        </TabsContent>

        <TabsContent value="finance" className="mt-4">
          <FinanceHelp />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <SettingsHelp />
        </TabsContent>

        <TabsContent value="dashboard" className="mt-4">
          <DashboardHelp />
        </TabsContent>

        <TabsContent value="data" className="mt-4">
          <DataHelp />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Help;