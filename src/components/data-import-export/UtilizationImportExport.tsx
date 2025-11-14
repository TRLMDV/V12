"use client";

import React from 'react';
import ExcelImportButton from '@/components/ExcelImportButton';
import ExcelExportButton from '@/components/ExcelExportButton';
import { toast } from 'sonner';
import { UtilizationOrder, Warehouse, Product } from '@/types';
import { MOCK_CURRENT_DATE } from '@/data/initialData';

interface UtilizationImportExportProps {
  utilizationOrders: UtilizationOrder[];
  setUtilizationOrders: React.Dispatch<React.SetStateAction<UtilizationOrder[]>>;
  warehouses: Warehouse[];
  productMap: { [key: number]: Product };
  warehouseMap: { [key: number]: Warehouse };
  getNextId: (key: 'utilizationOrders') => number;
  setNextIdForCollection: (key: 'utilizationOrders', nextId: number) => void;
  showAlertModal: (title: string, message: string) => void;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

const UtilizationImportExport: React.FC<UtilizationImportExportProps> = ({
  utilizationOrders, setUtilizationOrders, warehouses, productMap, warehouseMap,
  getNextId, setNextIdForCollection, showAlertModal, t
}) => {
  const formatUtilizationItems = (items: { productId: number; quantity: number }[] | undefined, productMap: { [key: number]: Product }) => {
    if (!items || items.length === 0) return '';
    return items.map(item => {
      const product = productMap[item.productId];
      const productName = product?.name || 'Unknown Product';
      return `${productName} (x${item.quantity})`;
    }).join('; ');
  };

  const handleImportUtilizationOrders = (data: any[]) => {
    const newOrders: UtilizationOrder[] = [];
    const errors: string[] = [];

    data.forEach((row: any, index: number) => {
      const warehouse = warehouses.find(w => w.name === String(row['Warehouse Name']));

      if (!warehouse) {
        errors.push(`Row ${index + 2}: Warehouse "${row['Warehouse Name']}" not found.`);
        return;
      }

      if (!row['Date']) {
        errors.push(`Row ${index + 2}: Missing required field (Date).`);
        return;
      }

      const newOrder: UtilizationOrder = {
        id: getNextId('utilizationOrders'),
        warehouseId: warehouse.id,
        items: [], // Items are not imported via Excel for utilization, must be added manually
        date: String(row['Date']),
      };
      newOrders.push(newOrder);
    });

    if (errors.length > 0) {
      toast.error(t('excelImportError'), {
        description: `${t('importErrorsFound')}: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`,
        duration: 10000,
      });
    }

    setUtilizationOrders(prev => {
      const allOrders = [...prev, ...newOrders];
      const maxId = allOrders.reduce((max, o) => Math.max(max, o.id), 0);
      setNextIdForCollection('utilizationOrders', maxId + 1);
      return allOrders;
    });

    if (newOrders.length > 0) {
      toast.success(t('excelImportSuccess'), { description: `${newOrders.length} ${t('utilizationOrders')} ${t('importedSuccessfully')}. ${t('itemsNotImportedWarning')}` });
    }
  };

  return (
    <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4">{t('utilizationOrders')}</h2>
      <p className="text-gray-600 dark:text-slate-400 mb-4">
        {t('utilizationOrdersImportExportDescription')}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ExcelImportButton
          buttonLabel={t('importExcelFile')}
          description={t('importUtilizationOrdersDescription')}
          onImport={handleImportUtilizationOrders}
          requiredColumns={['Warehouse Name', 'Date']}
        />
        <ExcelExportButton
          buttonLabel={t('exportExcelFile')}
          data={utilizationOrders.map(uo => ({
            ...uo,
            warehouseName: warehouseMap[uo.warehouseId]?.name || 'N/A',
            itemsString: formatUtilizationItems(uo.items, productMap),
          }))}
          fileName="utilization_orders_export"
          sheetName="Utilization Orders"
          columns={[
            { header: 'ID', accessor: 'id' },
            { header: 'Warehouse Name', accessor: 'warehouseName' },
            { header: 'Date', accessor: 'date' },
            { header: 'Items', accessor: 'itemsString' },
          ]}
        />
      </div>
    </div>
  );
};

export default UtilizationImportExport;