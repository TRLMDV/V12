"use client";

import React from 'react';
import ExcelImportButton from '@/components/ExcelImportButton';
import ExcelExportButton from '@/components/ExcelExportButton';
import { toast } from 'sonner';
import { ProductMovement, Warehouse, Product } from '@/types';
import { MOCK_CURRENT_DATE } from '@/data/initialData';

interface ProductMovementsImportExportProps {
  productMovements: ProductMovement[];
  setProductMovements: React.Dispatch<React.SetStateAction<ProductMovement[]>>;
  warehouses: Warehouse[];
  productMap: { [key: number]: Product };
  warehouseMap: { [key: number]: Warehouse };
  getNextId: (key: 'productMovements') => number;
  setNextIdForCollection: (key: 'productMovements', nextId: number) => void;
  showAlertModal: (title: string, message: string) => void;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

const ProductMovementsImportExport: React.FC<ProductMovementsImportExportProps> = ({
  productMovements, setProductMovements, warehouses, productMap, warehouseMap,
  getNextId, setNextIdForCollection, showAlertModal, t
}) => {
  const formatMovementItems = (items: { productId: number; quantity: number }[] | undefined, productMap: { [key: number]: Product }) => {
    if (!items || items.length === 0) return '';
    return items.map(item => {
      const product = productMap[item.productId];
      const productName = product?.name || 'Unknown Product';
      return `${productName} (x${item.quantity})`;
    }).join('; ');
  };

  const handleImportProductMovements = (data: any[]) => {
    const newMovements: ProductMovement[] = [];
    const errors: string[] = [];

    data.forEach((row: any, index: number) => {
      const sourceWarehouse = warehouses.find(w => w.name === String(row['Source Warehouse Name']));
      const destWarehouse = warehouses.find(w => w.name === String(row['Destination Warehouse Name']));

      if (!sourceWarehouse) {
        errors.push(`Row ${index + 2}: Source Warehouse "${row['Source Warehouse Name']}" not found.`);
        return;
      }
      if (!destWarehouse) {
        errors.push(`Row ${index + 2}: Destination Warehouse "${row['Destination Warehouse Name']}" not found.`);
        return;
      }

      if (!row['Movement Date']) {
        errors.push(`Row ${index + 2}: Missing required field (Movement Date).`);
        return;
      }

      const newMovement: ProductMovement = {
        id: getNextId('productMovements'),
        sourceWarehouseId: sourceWarehouse.id,
        destWarehouseId: destWarehouse.id,
        items: [], // Items are not imported via Excel for movements, must be added manually
        date: String(row['Movement Date']),
      };
      newMovements.push(newMovement);
    });

    if (errors.length > 0) {
      toast.error(t('excelImportError'), {
        description: `${t('importErrorsFound')}: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`,
        duration: 10000,
      });
    }

    setProductMovements(prev => {
      const allMovements = [...prev, ...newMovements];
      const maxId = allMovements.reduce((max, m) => Math.max(max, m.id), 0);
      setNextIdForCollection('productMovements', maxId + 1);
      return allMovements;
    });

    if (newMovements.length > 0) {
      toast.success(t('excelImportSuccess'), { description: `${newMovements.length} ${t('productMovement')} ${t('importedSuccessfully')}. ${t('itemsNotImportedWarning')}` });
    }
  };

  return (
    <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4">{t('productMovement')}</h2>
      <p className="text-gray-600 dark:text-slate-400 mb-4">
        {t('productMovementsImportExportDescription')}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ExcelImportButton
          buttonLabel={t('importExcelFile')}
          description={t('importProductMovementsDescription')}
          onImport={handleImportProductMovements}
          requiredColumns={['Source Warehouse Name', 'Destination Warehouse Name', 'Movement Date']}
        />
        <ExcelExportButton
          buttonLabel={t('exportExcelFile')}
          data={productMovements.map(pm => ({
            ...pm,
            sourceWarehouseName: warehouseMap[pm.sourceWarehouseId]?.name || 'N/A',
            destWarehouseName: warehouseMap[pm.destWarehouseId]?.name || 'N/A',
            itemsString: formatMovementItems(pm.items, productMap),
          }))}
          fileName="product_movements_export"
          sheetName="Product Movements"
          columns={[
            { header: 'ID', accessor: 'id' },
            { header: 'Source Warehouse Name', accessor: 'sourceWarehouseName' },
            { header: 'Destination Warehouse Name', accessor: 'destWarehouseName' },
            { header: 'Movement Date', accessor: 'date' },
            { header: 'Items', accessor: 'itemsString' },
          ]}
        />
      </div>
    </div>
  );
};

export default ProductMovementsImportExport;