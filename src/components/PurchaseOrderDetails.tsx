"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import OrderDetailsExcelExportButton from '@/components/OrderDetailsExcelExportButton';
import { t } from '@/utils/i18n';
import { PurchaseOrder, Product, Supplier, Warehouse, CurrencyRates, PackingUnit, Currency } from '@/types'; // Import PackingUnit and Currency
import { Input } from '@/components/ui/input'; // Import Input for search
import { Label } from '@/components/ui/label'; // Import Label for search
import { ArrowUpDown } from 'lucide-react'; // Import ArrowUpDown for sort indicator

interface PurchaseOrderDetailsProps {
  order: PurchaseOrder;
  supplierMap: { [key: number]: Supplier };
  warehouseMap: { [key: number]: Warehouse };
  productMap: { [key: number]: Product };
  packingUnitMap: { [key: number]: PackingUnit }; // New: Pass packingUnitMap
  currencyRates: CurrencyRates;
}

type SortConfig = {
  key: 'productName' | 'sku' | 'qty' | 'price' | 'landedCostPerUnit' | 'itemTotalLandedAZN';
  direction: 'ascending' | 'descending';
};

const PurchaseOrderDetails: React.FC<PurchaseOrderDetailsProps> = ({
  order,
  supplierMap,
  warehouseMap,
  productMap,
  packingUnitMap, // Destructure new prop
  currencyRates,
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'productName', direction: 'ascending' });
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Recalculate for display in native currency for consistency with form
  const productsSubtotalNative = order.items?.reduce((sum, item) => sum + (item.price * item.qty), 0) || 0;
  const orderNativeToAznRate = order.currency === 'AZN' ? 1 : (order.exchangeRate || currencyRates[order.currency] || 1);

  const convertFeeToOrderNativeCurrency = (amount: number, feeCurrency: Currency, feeExchangeRate?: number) => { // Changed feeCurrency to Currency, added feeExchangeRate
    if (amount === 0) return 0;
    const effectiveFeeRateToAZN = (feeCurrency === 'AZN' ? 1 : (feeExchangeRate || currencyRates[feeCurrency] || 1));
    const feeInAzn = amount * effectiveFeeRateToAZN;
    return feeInAzn / orderNativeToAznRate;
  };

  let totalFeesNative = 0;
  totalFeesNative += convertFeeToOrderNativeCurrency(order.fees ?? 0, order.feesCurrency, order.feesExchangeRate);

  const totalValueNative = productsSubtotalNative + totalFeesNative;

  const sortedAndFilteredItems = useMemo(() => {
    let items = (order.items || []).map(item => {
      const product = productMap[item.productId];
      const itemTotalLandedAZN = (item.landedCostPerUnit || 0) * item.qty;
      const packingUnit = item.packingUnitId ? packingUnitMap[item.packingUnitId] : undefined;
      const displayQty = packingUnit && item.packingQuantity !== undefined
        ? `${item.packingQuantity} ${packingUnit.name}`
        : `${item.qty} ${t('piece')}`;

      return {
        ...item,
        productName: product?.name || 'N/A',
        sku: product?.sku || 'N/A',
        itemTotalLandedAZN,
        displayQty,
      };
    });

    // Apply search filter
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.productName.toLowerCase().includes(lowercasedQuery) ||
        item.sku.toLowerCase().includes(lowercasedQuery)
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      items.sort((a, b) => {
        const key = sortConfig.key;
        let valA: any;
        let valB: any;

        switch (key) {
          case 'productName':
          case 'sku':
            valA = a[key];
            valB = b[key];
            break;
          case 'qty':
            valA = a.qty;
            valB = b.qty;
            break;
          case 'price':
            valA = a.price;
            valB = b.price;
            break;
          case 'landedCostPerUnit':
            valA = a.landedCostPerUnit || 0;
            valB = b.landedCostPerUnit || 0;
            break;
          case 'itemTotalLandedAZN':
            valA = a.itemTotalLandedAZN;
            valB = b.itemTotalLandedAZN;
            break;
          default:
            valA = a[key];
            valB = b[key];
            break;
        }

        let comparison = 0;
        if (typeof valA === 'string' || typeof valB === 'string') {
          comparison = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
        } else {
          if (valA < valB) comparison = -1;
          if (valA > valB) comparison = 1;
        }
        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }
    return items;
  }, [order.items, productMap, packingUnitMap, searchQuery, sortConfig, order.currency, order.exchangeRate, currencyRates]);

  const requestSort = useCallback((key: SortConfig['key']) => {
    let direction: SortConfig['direction'] = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  }, [sortConfig]);

  const getSortIndicator = useCallback((key: SortConfig['key']) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    }
    return '';
  }, [sortConfig]);

  return (
    <div className="grid gap-4 py-4 text-gray-800 dark:text-slate-300">
      <p><strong>{t('supplier')}:</strong> {supplierMap[order.contactId]?.name || 'N/A'}</p>
      <p><strong>{t('warehouse')}:</strong> {warehouseMap[order.warehouseId]?.name || 'N/A'}</p>
      <p><strong>{t('orderDate')}:</strong> {order.orderDate}</p>
      <p><strong>{t('status')}:</strong> {t(order.status.toLowerCase() as keyof typeof t)}</p>
      <p><strong>{t('orderCurrency')}:</strong> {order.currency}</p>
      {order.currency !== 'AZN' && order.exchangeRate && (
        <p><strong>{t('exchangeRateToAZN')}:</strong> {order.exchangeRate}</p>
      )}
      {order.comment && (
        <p><strong>{t('comment')}:</strong> {order.comment}</p>
      )}
      
      <h3 className="font-semibold mt-4 mb-2">{t('orderItems')}</h3>
      <div className="flex justify-end mb-4">
        <div className="w-full max-w-xs">
          <Label htmlFor="product-search" className="sr-only">{t('searchBySku')}</Label>
          <Input
            id="product-search"
            type="text"
            placeholder={t('searchProductBySku')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-100 dark:bg-slate-700">
            <TableHead className="p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={() => requestSort('productName')}>
              {t('product')} {getSortIndicator('productName')}
            </TableHead>
            <TableHead className="p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={() => requestSort('sku')}>
              {t('sku')} {getSortIndicator('sku')}
            </TableHead>
            <TableHead className="p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={() => requestSort('qty')}>
              {t('qty')} {getSortIndicator('qty')}
            </TableHead>
            <TableHead className="p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={() => requestSort('price')}>
              {t('price')} {getSortIndicator('price')}
            </TableHead>
            <TableHead className="p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={() => requestSort('landedCostPerUnit')}>
              {t('landedCostPerUnit')} {getSortIndicator('landedCostPerUnit')}
            </TableHead>
            <TableHead className="p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={() => requestSort('itemTotalLandedAZN')}>
              {t('totalValue')} {getSortIndicator('itemTotalLandedAZN')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedAndFilteredItems.length > 0 ? (
            sortedAndFilteredItems.map((item, index) => (
              <TableRow key={index} className="border-b dark:border-slate-600">
                <TableCell className="p-2">{item.productName}</TableCell>
                <TableCell className="p-2">{item.sku}</TableCell>
                <TableCell className="p-2">{item.displayQty}</TableCell>
                <TableCell className="p-2">{item.price?.toFixed(2)} {item.currency || order.currency}</TableCell>
                <TableCell className="p-2">{item.landedCostPerUnit?.toFixed(2)} AZN</TableCell>
                <TableCell className="p-2">{item.itemTotalLandedAZN.toFixed(2)} AZN</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="p-4 text-center text-gray-500 dark:text-slate-400">
                {t('noItemsFound')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        <TableFooter>
          <TableRow className="bg-gray-100 dark:bg-slate-700 font-bold">
            <TableCell colSpan={5} className="p-2 text-right">{t('productsSubtotal')} ({order.currency}):</TableCell>
            <TableCell className="p-2">{productsSubtotalNative.toFixed(2)} {order.currency}</TableCell>
          </TableRow>
          <TableRow className="bg-gray-100 dark:bg-slate-700">
            <TableCell colSpan={5} className="p-2 text-right">{t('fees')} ({order.feesCurrency}):</TableCell>
            <TableCell className="p-2">{(order.fees ?? 0).toFixed(2)} {order.feesCurrency}</TableCell>
          </TableRow>
          {order.feesCurrency !== 'AZN' && order.feesExchangeRate && (
            <TableRow className="bg-gray-100 dark:bg-slate-700">
              <TableCell colSpan={5} className="p-2 text-right">{t('feesExchangeRateToAZN')}:</TableCell>
              <TableCell className="p-2">{order.feesExchangeRate}</TableCell>
            </TableRow>
          )}
          <TableRow className="bg-gray-200 dark:bg-slate-600 font-bold">
            <TableCell colSpan={5} className="p-2 text-right">{t('total')} ({order.currency}):</TableCell>
            <TableCell className="p-2 text-sky-600 dark:text-sky-400">{totalValueNative.toFixed(2)} {order.currency}</TableCell>
          </TableRow>
          <TableRow className="bg-gray-200 dark:bg-slate-600 font-bold">
            <TableCell colSpan={5} className="p-2 text-right">{t('totalLandedCost')} (AZN):</TableCell>
            <TableCell className="p-2 text-sky-600 dark:text-sky-400">{order.total.toFixed(2)} AZN</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
      <OrderDetailsExcelExportButton
        order={order}
        orderType="purchase"
        productMap={productMap}
        customerMap={{}} // Not needed for PO
        supplierMap={supplierMap}
        warehouseMap={warehouseMap}
        currencyRates={currencyRates}
      />
    </div>
  );
};

export default PurchaseOrderDetails;