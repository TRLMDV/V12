"use client";

import React from 'react';
import ExcelImportButton from '@/components/ExcelImportButton';
import SellOrdersMultiSheetExportButton from '@/components/SellOrdersMultiSheetExportButton';
import { toast } from 'sonner';
import { SellOrder, Customer, Warehouse, Product, Settings } from '@/types';
import { MOCK_CURRENT_DATE } from '@/data/initialData';

interface SellOrdersImportExportProps {
  sellOrders: SellOrder[];
  setSellOrders: React.Dispatch<React.SetStateAction<SellOrder[]>>;
  customers: Customer[];
  warehouses: Warehouse[];
  productMap: { [key: number]: Product };
  customerMap: { [key: number]: Customer };
  warehouseMap: { [key: number]: Warehouse };
  settings: Settings;
  getNextId: (key: 'sellOrders') => number;
  setNextIdForCollection: (key: 'sellOrders', nextId: number) => void;
  showAlertModal: (title: string, message: string) => void;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

const SellOrdersImportExport: React.FC<SellOrdersImportExportProps> = ({
  sellOrders, setSellOrders, customers, warehouses, productMap,
  customerMap, warehouseMap, settings, getNextId, setNextIdForCollection,
  showAlertModal, t
}) => {
  const handleImportSellOrders = (data: any[]) => {
    const newSellOrders: SellOrder[] = [];
    const errors: string[] = [];

    data.forEach((row: any, index: number) => {
      const customer = customers.find(c => c.name === String(row['Customer Name']));
      const warehouse = warehouses.find(w => w.name === String(row['Warehouse Name']));

      if (!customer) {
        errors.push(`Row ${index + 2}: Customer "${row['Customer Name']}" not found.`);
        return;
      }
      if (!warehouse) {
        errors.push(`Row ${index + 2}: Warehouse "${row['Warehouse Name']}" not found.`);
        return;
      }

      if (!row['Order Date'] || !row['Status'] || !row['VAT (%)'] || !row['Total (AZN)']) {
        errors.push(`Row ${index + 2}: Missing required fields (Order Date, Status, VAT (%), Total (AZN)).`);
        return;
      }

      const newOrder: SellOrder = {
        id: getNextId('sellOrders'),
        contactId: customer.id,
        orderDate: String(row['Order Date']),
        warehouseId: warehouse.id,
        status: row['Status'] as SellOrder['status'],
        items: [],
        vatPercent: parseFloat(row['VAT (%)'] || '0'),
        total: parseFloat(row['Total (AZN)'] || '0'),
        currency: settings.mainCurrency,
      };
      newSellOrders.push(newOrder);
    });

    if (errors.length > 0) {
      toast.error(t('excelImportError'), {
        description: `${t('importErrorsFound')}: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`,
        duration: 10000,
      });
    }

    setSellOrders(prev => {
      const allOrders = [...prev, ...newSellOrders];
      const maxId = allOrders.reduce((max, o) => Math.max(max, o.id), 0);
      setNextIdForCollection('sellOrders', maxId + 1);
      return allOrders;
    });

    if (newSellOrders.length > 0) {
      toast.success(t('excelImportSuccess'), { description: `${newSellOrders.length} ${t('sellOrders')} ${t('importedSuccessfully')}. ${t('itemsNotImportedWarning')}` });
    }
  };

  return (
    <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4">{t('sellOrders')}</h2>
      <p className="text-gray-600 dark:text-slate-400 mb-4">
        {t('sellOrdersImportExportDescription')}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ExcelImportButton
          buttonLabel={t('importExcelFile')}
          description={t('importSellOrdersDescription')}
          onImport={handleImportSellOrders}
          requiredColumns={['Customer Name', 'Warehouse Name', 'Order Date', 'Status', 'VAT (%)', 'Total (AZN)']}
        />
        <SellOrdersMultiSheetExportButton
          buttonLabel={t('exportExcelFileDetailed')}
          sellOrders={sellOrders}
          productMap={productMap}
          customerMap={customerMap}
          warehouseMap={warehouseMap}
        />
      </div>
    </div>
  );
};

export default SellOrdersImportExport;