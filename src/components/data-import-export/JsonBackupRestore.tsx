"use client";

import React, { useRef, useId } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { MOCK_CURRENT_DATE } from '@/data/initialData';
import {
  Product, Supplier, Customer, Warehouse, PurchaseOrder, SellOrder, Payment, ProductMovement,
  Settings, CurrencyRates, UtilizationOrder
} from '@/types';

interface JsonBackupRestoreProps {
  products: Product[];
  suppliers: Supplier[];
  customers: Customer[];
  warehouses: Warehouse[];
  purchaseOrders: PurchaseOrder[];
  sellOrders: SellOrder[];
  incomingPayments: Payment[];
  outgoingPayments: Payment[];
  productMovements: ProductMovement[];
  utilizationOrders: UtilizationOrder[]; // New: utilizationOrders
  settings: Settings;
  currencyRates: CurrencyRates;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  setWarehouses: React.Dispatch<React.SetStateAction<Warehouse[]>>;
  setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  setSellOrders: React.Dispatch<React.SetStateAction<SellOrder[]>>;
  setIncomingPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  setOutgoingPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  setProductMovements: React.Dispatch<React.SetStateAction<ProductMovement[]>>;
  setUtilizationOrders: React.Dispatch<React.SetStateAction<UtilizationOrder[]>>; // New: setUtilizationOrders
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  setCurrencyRates: React.Dispatch<React.SetStateAction<CurrencyRates>>;
  showConfirmationModal: (title: string, message: string, onConfirm: () => void, actionLabel?: string) => void; // Corrected signature here
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

const JsonBackupRestore: React.FC<JsonBackupRestoreProps> = ({
  products, suppliers, customers, warehouses, purchaseOrders, sellOrders,
  incomingPayments, outgoingPayments, productMovements, utilizationOrders, settings, currencyRates,
  setProducts, setSuppliers, setCustomers, setWarehouses, setPurchaseOrders,
  setSellOrders, setIncomingPayments, setOutgoingPayments, setProductMovements,
  setUtilizationOrders, setSettings, setCurrencyRates, showConfirmationModal, t
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uniqueId = useId(); // Generate a unique ID for this component instance

  const importInputId = `import-file-${uniqueId}`; // Use uniqueId in the ID

  const handleExportData = () => {
    const dataToExport = {
      products,
      suppliers,
      customers,
      warehouses,
      purchaseOrders,
      sellOrders,
      incomingPayments,
      outgoingPayments,
      productMovements,
      utilizationOrders, // New: utilizationOrders
      settings,
      currencyRates,
    };

    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `erp_data_backup_${MOCK_CURRENT_DATE.toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(t('success'), { description: t('backupData') + ' exported successfully to JSON.' });
  };

  const handleImportButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast.error(t('restoreError'), { description: 'No file selected.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string;
        const importedData = JSON.parse(data);

        if (typeof importedData !== 'object' || importedData === null) {
          toast.error(t('restoreError'), { description: 'Invalid JSON structure in backup file.' });
          return;
        }

        showConfirmationModal(
          t('restoreData'),
          t('restoreWarning'),
          () => {
            setProducts(importedData.products || []);
            setSuppliers(importedData.suppliers || []);
            setCustomers(importedData.customers || []);
            setWarehouses(importedData.warehouses || []);
            setPurchaseOrders(importedData.purchaseOrders || []);
            setSellOrders(importedData.sellOrders || []);
            setIncomingPayments(importedData.incomingPayments || []);
            setOutgoingPayments(importedData.outgoingPayments || []);
            setProductMovements(importedData.productMovements || []);
            setUtilizationOrders(importedData.utilizationOrders || []); // New: setUtilizationOrders
            setSettings(importedData.settings || {});
            setCurrencyRates(importedData.currencyRates || currencyRates);
            toast.success(t('restoreSuccess'));
            setTimeout(() => window.location.reload(), 1000);
          },
          t('restore') // Pass action label
        );

      } catch (error) {
        console.error("Error importing data:", error);
        toast.error(t('restoreError'), { description: 'Failed to parse backup JSON file.' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4">{t('backupRestore')}</h2>
      <p className="text-gray-600 dark:text-slate-400 mb-4">
        {t('exportDataToJson')}
      </p>
      <Button onClick={handleExportData} className="bg-sky-500 hover:bg-sky-600 text-white w-full mb-4">
        <Download className="w-4 h-4 mr-2" />
        {t('exportJsonFile')}
      </Button>
      <div className="mt-4">
        <p className="text-gray-600 dark:text-slate-400 mb-4">
          {t('restoreWarning')}
        </p>
        <div className="flex flex-col space-y-4">
          <Input
            id={importInputId}
            type="file"
            accept=".json"
            onChange={handleImportData}
            ref={fileInputRef}
            className="hidden"
            aria-label={t('importJsonFile')} // Add aria-label
          />
          <Button onClick={handleImportButtonClick} className="bg-sky-500 hover:bg-sky-600 text-white w-full">
            <UploadCloud className="w-4 h-4 mr-2" />
            {t('importJsonFile')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JsonBackupRestore;