"use client";

import React from 'react';
import ExcelImportButton from '@/components/ExcelImportButton';
import PurchaseOrdersMultiSheetExportButton from '@/components/PurchaseOrdersMultiSheetExportButton';
import { toast } from 'sonner';
import { PurchaseOrder, Supplier, Warehouse, Product, CurrencyRates } from '@/types';
import { MOCK_CURRENT_DATE } from '@/data/initialData';

interface PurchaseOrdersImportExportProps {
  purchaseOrders: PurchaseOrder[];
  setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  suppliers: Supplier[];
  warehouses: Warehouse[];
  productMap: { [key: number]: Product };
  supplierMap: { [key: number]: Supplier };
  warehouseMap: { [key: number]: Warehouse };
  currencyRates: CurrencyRates;
  getNextId: (key: 'purchaseOrders') => number;
  setNextIdForCollection: (key: 'purchaseOrders', nextId: number) => void;
  showAlertModal: (title: string, message: string) => void;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

const PurchaseOrdersImportExport: React.FC<PurchaseOrdersImportExportProps> = ({
  purchaseOrders, setPurchaseOrders, suppliers, warehouses, productMap,
  supplierMap, warehouseMap, currencyRates, getNextId, setNextIdForCollection,
  showAlertModal, t
}) => {
  const handleImportPurchaseOrders = (data: any[]) => {
    const newPurchaseOrders: PurchaseOrder[] = [];
    const errors: string[] = [];

    data.forEach((row: any, index: number) => {
      const supplier = suppliers.find(s => s.name === String(row['Supplier Name']));
      const warehouse = warehouses.find(w => w.name === String(row['Warehouse Name']));

      if (!supplier) {
        errors.push(`Row ${index + 2}: Supplier "${row['Supplier Name']}" not found.`);
        return;
      }
      if (!warehouse) {
        errors.push(`Row ${index + 2}: Warehouse "${row['Warehouse Name']}" not found.`);
        return;
      }

      if (!row['Order Date'] || !row['Status'] || !row['Currency'] || !row['Total (AZN)']) {
        errors.push(`Row ${index + 2}: Missing required fields (Order Date, Status, Currency, Total (AZN)).`);
        return;
      }

      const newOrder: PurchaseOrder = {
        id: getNextId('purchaseOrders'),
        contactId: supplier.id,
        orderDate: String(row['Order Date']),
        warehouseId: warehouse.id,
        status: row['Status'] as PurchaseOrder['status'],
        items: [],
        currency: row['Currency'] as PurchaseOrder['currency'],
        exchangeRate: parseFloat(row['Exchange Rate to AZN'] || '0') || undefined,
        transportationFees: parseFloat(row['Transportation Fees'] || '0'),
        transportationFeesCurrency: row['Transportation Fees Currency'] as PurchaseOrder['transportationFeesCurrency'] || 'AZN',
        customFees: parseFloat(row['Custom Fees'] || '0'),
        customFeesCurrency: row['Custom Fees Currency'] as PurchaseOrder['customFeesCurrency'] || 'AZN',
        additionalFees: parseFloat(row['Additional Fees'] || '0'),
        additionalFeesCurrency: row['Additional Fees Currency'] as PurchaseOrder['additionalFeesCurrency'] || 'AZN',
        total: parseFloat(row['Total (AZN)'] || '0'),
      };
      newPurchaseOrders.push(newOrder);
    });

    if (errors.length > 0) {
      toast.error(t('excelImportError'), {
        description: `${t('importErrorsFound')}: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`,
        duration: 10000,
      });
    }

    setPurchaseOrders(prev => {
      const allOrders = [...prev, ...newPurchaseOrders];
      const maxId = allOrders.reduce((max, o) => Math.max(max, o.id), 0);
      setNextIdForCollection('purchaseOrders', maxId + 1);
      return allOrders;
    });

    if (newPurchaseOrders.length > 0) {
      toast.success(t('excelImportSuccess'), { description: `${newPurchaseOrders.length} ${t('purchaseOrders')} ${t('importedSuccessfully')}. ${t('itemsNotImportedWarning')}` });
    }
  };

  return (
    <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4">{t('purchaseOrders')}</h2>
      <p className="text-gray-600 dark:text-slate-400 mb-4">
        {t('purchaseOrdersImportExportDescription')}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ExcelImportButton
          buttonLabel={t('importExcelFile')}
          description={t('importPurchaseOrdersDescription')}
          onImport={handleImportPurchaseOrders}
          requiredColumns={['Supplier Name', 'Warehouse Name', 'Order Date', 'Status', 'Currency', 'Total (AZN)']}
        />
        <PurchaseOrdersMultiSheetExportButton
          buttonLabel={t('exportExcelFileDetailed')}
          purchaseOrders={purchaseOrders}
          productMap={productMap}
          supplierMap={supplierMap}
          warehouseMap={warehouseMap}
          currencyRates={currencyRates}
        />
      </div>
    </div>
  );
};

export default PurchaseOrdersImportExport;