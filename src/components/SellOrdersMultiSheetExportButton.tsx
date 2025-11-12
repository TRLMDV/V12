"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { useTranslation } from '@/hooks/useTranslation'; // Updated import
import { SellOrder, Product, Customer, Warehouse, PackingUnit } from '@/types';
import { useData } from '@/context/DataContext'; // Import useData to get packingUnitMap

interface SellOrdersMultiSheetExportButtonProps {
  sellOrders: SellOrder[];
  productMap: { [key: number]: Product };
  customerMap: { [key: number]: Customer };
  warehouseMap: { [key: number]: Warehouse };
  buttonLabel: string; // New prop
}

const SellOrdersMultiSheetExportButton: React.FC<SellOrdersMultiSheetExportButtonProps> = ({
  sellOrders,
  productMap,
  customerMap,
  warehouseMap,
  buttonLabel,
}) => {
  const { packingUnitMap } = useData(); // Access packingUnitMap
  const { t } = useTranslation(); // Use the new hook

  const handleExport = () => {
    if (!sellOrders || sellOrders.length === 0) {
      toast.info(t('excelExportInfo'), { description: t('noDataToExport') });
      return;
    }

    const wb = XLSX.utils.book_new();

    sellOrders.forEach(order => {
      const sheetName = `SO#${order.id}`;
      const data: any[] = [];

      // --- Order Summary ---
      data.push([{ v: t('orderSummary'), s: { font: { bold: true, sz: 14 } } }]);
      data.push([t('orderId'), order.id]);
      data.push([t('customer'), customerMap[order.contactId]?.name || 'N/A']);
      data.push([t('warehouse'), warehouseMap[order.warehouseId]?.name || 'N/A']);
      data.push([t('orderDate'), order.orderDate]);
      data.push([t('orderStatus'), t(order.status.toLowerCase() as any)]); // Cast to any for dynamic key
      data.push([t('vatPercent'), `${order.vatPercent}%`]);
      data.push([t('totalRevenueExVat'), `${(order.total / (1 + order.vatPercent / 100)).toFixed(2)} AZN`]);
      data.push([t('totalVat'), `${(order.total - (order.total / (1 + order.vatPercent / 100))).toFixed(2)} AZN`]);
      data.push([t('total'), `${order.total.toFixed(2)} AZN`]);
      data.push([]); // Spacer

      // --- Order Items ---
      data.push([{ v: t('orderItems'), s: { font: { bold: true, sz: 12 } } }]);
      const itemHeaders = [
        t('productName'),
        t('sku'),
        t('packingUnit'), // New header
        t('packingQuantity'), // New header
        t('qty') + ` (${t('baseUnit')})`, // Base unit quantity
        `${t('price')} (AZN)`,
        `${t('itemTotal')} (AZN)`,
        t('landedCost'),
        t('cleanProfit'),
      ];
      data.push(itemHeaders);

      order.items.forEach(item => {
        const product = productMap[item.productId];
        const productLandedCost = product?.averageLandedCost || 0;
        const cleanProfit = (item.price - productLandedCost) * item.qty;
        const packingUnit = item.packingUnitId ? packingUnitMap[item.packingUnitId] : undefined;

        data.push([
          product?.name || 'N/A',
          product?.sku || 'N/A',
          packingUnit?.name || t('piece'), // Display packing unit name
          item.packingQuantity !== undefined ? item.packingQuantity : item.qty, // Display packing quantity if available, else base qty
          item.qty, // Base unit quantity
          item.price.toFixed(2),
          (item.qty * item.price).toFixed(2),
          productLandedCost.toFixed(2),
          cleanProfit.toFixed(2),
        ]);
      });
      data.push([]); // Spacer

      const ws = XLSX.utils.aoa_to_sheet(data);

      // Set column widths (example, adjust as needed)
      const colWidths = [
        { wch: 25 }, // Product Name
        { wch: 15 }, // SKU
        { wch: 15 }, // Packing Unit
        { wch: 15 }, // Packing Quantity
        { wch: 10 }, // Qty (Base Unit)
        { wch: 15 }, // Price
        { wch: 15 }, // Item Total
        { wch: 15 }, // Landed Cost
        { wch: 15 }, // Clean Profit
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    XLSX.writeFile(wb, `sell_orders_details_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success(t('success'), { description: `${t('sellOrders')} ${t('exportedSuccessfully')}.` });
  };

  return (
    <Button onClick={handleExport} className="bg-sky-500 hover:bg-sky-600 text-white w-full">
      <Download className="w-4 h-4 mr-2" />
      {buttonLabel}
    </Button>
  );
};

export default SellOrdersMultiSheetExportButton;