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
            {t('help.title')}
          </h1>
        </div>
        <p className="text-muted-foreground mt-1">
          {t('help.subtitle')}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          {t('help.screenshotNote')}
        </p>
      </div>

      <Tabs defaultValue="getting-started" className="w-full">
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="getting-started">{t('help.tabs.gettingStarted')}</TabsTrigger>
          <TabsTrigger value="products">{t('help.tabs.products')}</TabsTrigger>
          <TabsTrigger value="suppliers-customers">{t('help.tabs.suppliersCustomers')}</TabsTrigger>
          <TabsTrigger value="warehouses">{t('help.tabs.warehouses')}</TabsTrigger>
          <TabsTrigger value="orders">{t('help.tabs.orders')}</TabsTrigger>
          <TabsTrigger value="payments">{t('help.tabs.payments')}</TabsTrigger>
          <TabsTrigger value="stock">{t('help.tabs.stock')}</TabsTrigger>
          <TabsTrigger value="bank">{t('help.tabs.bank')}</TabsTrigger>
          <TabsTrigger value="finance">{t('help.tabs.finance')}</TabsTrigger>
          <TabsTrigger value="settings">{t('help.tabs.settings')}</TabsTrigger>
          <TabsTrigger value="dashboard">{t('help.tabs.dashboard')}</TabsTrigger>
          <TabsTrigger value="data">{t('help.tabs.data')}</TabsTrigger>
        </TabsList>

        <TabsContent value="getting-started" className="mt-16">
          <GettingStartedHelp />
        </TabsContent>

        <TabsContent value="products" className="mt-16">
          <ProductsHelp />
        </TabsContent>

        <TabsContent value="suppliers-customers" className="mt-16">
          <SuppliersCustomersHelp />
        </TabsContent>

        <TabsContent value="warehouses" className="mt-16">
          <WarehousesHelp />
        </TabsContent>

        <TabsContent value="orders" className="mt-16">
          <OrdersHelp />
        </TabsContent>

        <TabsContent value="payments" className="mt-16">
          <PaymentsHelp />
        </TabsContent>

        <TabsContent value="stock" className="mt-16">
          <StockHelp />
        </TabsContent>

        <TabsContent value="bank" className="mt-16">
          <BankHelp />
        </TabsContent>

        <TabsContent value="finance" className="mt-16">
          <FinanceHelp />
        </TabsContent>

        <TabsContent value="settings" className="mt-16">
          <SettingsHelp />
        </TabsContent>

        <TabsContent value="dashboard" className="mt-16">
          <DashboardHelp />
        </TabsContent>

        <TabsContent value="data" className="mt-16">
          <DataHelp />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Help;