"use client";

import React, { useRef, useId } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { MOCK_CURRENT_DATE } from '@/data/initialData';
import {
  Product, Supplier, Customer, Warehouse, PurchaseOrder, SellOrder, Payment, ProductMovement,
  Settings, CurrencyRates, UtilizationOrder, RecycleBinItem
} from '@/types';
import { initialSettings, defaultCurrencyRates } from '@/data/initialData'; // Import initial settings and currency rates

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
  utilizationOrders: UtilizationOrder[];
  settings: Settings;
  currencyRates: CurrencyRates;
  nextIds: { [key: string]: number }; // Add nextIds
  recycleBin: RecycleBinItem[]; // Add recycleBin
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  setWarehouses: React.Dispatch<React.SetStateAction<Warehouse[]>>;
  setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  setSellOrders: React.Dispatch<React.SetStateAction<SellOrder[]>>;
  setIncomingPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  setOutgoingPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  setProductMovements: React.Dispatch<React.SetStateAction<ProductMovement[]>>;
  setUtilizationOrders: React.Dispatch<React.SetStateAction<UtilizationOrder[]>>;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  setCurrencyRates: React.Dispatch<React.SetStateAction<CurrencyRates>>;
  setNextIds: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>; // Add setNextIds
  setRecycleBin: React.Dispatch<React.SetStateAction<RecycleBinItem[]>>; // Add setRecycleBin
  showConfirmationModal: (title: string, message: string, onConfirm: () => void, actionLabel?: string) => void;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

const JsonBackupRestore: React.FC<JsonBackupRestoreProps> = ({
  products, suppliers, customers, warehouses, purchaseOrders, sellOrders,
  incomingPayments, outgoingPayments, productMovements, utilizationOrders, settings, currencyRates,
  nextIds, recycleBin, // Destructure new props
  setProducts, setSuppliers, setCustomers, setWarehouses, setPurchaseOrders,
  setSellOrders, setIncomingPayments, setOutgoingPayments, setProductMovements,
  setUtilizationOrders, setSettings, setCurrencyRates, setNextIds, setRecycleBin, // Destructure new setters
  showConfirmationModal, t
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uniqueId = useId();

  const importInputId = `import-file-${uniqueId}`;

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
      utilizationOrders,
      settings,
      currencyRates,
      nextIds, // Include nextIds in export
      recycleBin, // Include recycleBin in export
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
    toast.success(t('success'), { description: `${t('backupData')} exported successfully to JSON.` });
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
            // Directly write to localStorage for all top-level collections
            // This ensures data is persisted BEFORE reload, bypassing useEffect's async nature.
            localStorage.setItem('products', JSON.stringify(importedData.products || []));
            localStorage.setItem('suppliers', JSON.stringify(importedData.suppliers || []));
            localStorage.setItem('customers', JSON.stringify(importedData.customers || []));
            localStorage.setItem('warehouses', JSON.stringify(importedData.warehouses || []));
            localStorage.setItem('purchaseOrders', JSON.stringify(importedData.purchaseOrders || []));
            localStorage.setItem('sellOrders', JSON.stringify(importedData.sellOrders || []));
            localStorage.setItem('incomingPayments', JSON.stringify(importedData.incomingPayments || []));
            localStorage.setItem('outgoingPayments', JSON.stringify(importedData.outgoingPayments || []));
            localStorage.setItem('productMovements', JSON.stringify(importedData.productMovements || []));
            localStorage.setItem('bankAccounts', JSON.stringify(importedData.bankAccounts || [])); // Crucial fix for bank accounts
            localStorage.setItem('utilizationOrders', JSON.stringify(importedData.utilizationOrders || []));
            localStorage.setItem('settings', JSON.stringify(importedData.settings || initialSettings));
            localStorage.setItem('currencyRates', JSON.stringify(importedData.currencyRates || defaultCurrencyRates));
            localStorage.setItem('nextIds', JSON.stringify(importedData.nextIds || {})); // Also restore nextIds
            localStorage.setItem('recycleBin', JSON.stringify(importedData.recycleBin || [])); // Also restore recycleBin

            // Ensure the 'initialized' flag is set to true after a successful import
            // This prevents useAppInitialization from trying to re-populate empty arrays with initialData.
            localStorage.setItem('initialized', 'true');

            toast.success(t('restoreSuccess'));
            window.location.reload(); // Reload immediately after synchronous writes
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