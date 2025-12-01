"use client";

import React, { useMemo, useState } from 'react';
import FormModal from '@/components/FormModal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useData } from '@/context/DataContext';
import { t } from '@/utils/i18n';
import { Product, PurchaseOrder, SellOrder, Supplier, Customer, Currency } from '@/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';
import PaginationControls from '@/components/PaginationControls';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parseISO, format } from 'date-fns'; // Import format

interface ProductTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number;
}

type SortConfig = {
  key: 'orderDate' | 'orderId' | 'supplierName' | 'customerName' | 'quantity' | 'priceInOrderCurrency' | 'priceExclVat' | 'priceInclVat' | 'landedCostPerUnit';
  direction: 'ascending' | 'descending';
};

const ITEMS_PER_PAGE = 100;

const ProductTransactionsModal: React.FC<ProductTransactionsModalProps> = ({ isOpen, onClose, productId }) => {
  const { products, purchaseOrders, sellOrders, suppliers, customers, currencyRates, settings } = useData();
  const mainCurrency = settings.mainCurrency;

  const [isPurchaseOrdersOpen, setIsPurchaseOrdersOpen] = useState(false);
  const [isSalesOrdersOpen, setIsSalesOrdersOpen] = useState(false);

  // Date filters for Purchase Orders
  const [poStartDateFilter, setPoStartDateFilter] = useState<string>('');
  const [poEndDateFilter, setPoEndDateFilter] = useState<string>('');

  // Date filters for Sales Orders
  const [soStartDateFilter, setSoStartDateFilter] = useState<string>('');
  const [soEndDateFilter, setSoEndDateFilter] = useState<string>('');

  // Sorting and Pagination states for Purchase Orders
  const [purchaseOrderSortConfig, setPurchaseOrderSortConfig] = useState<SortConfig>({ key: 'orderDate', direction: 'descending' });
  const [purchaseOrderCurrentPage, setPurchaseOrderCurrentPage] = useState(1);

  // Sorting and Pagination states for Sales Orders
  const [salesOrderSortConfig, setSalesOrderSortConfig] = useState<SortConfig>({ key: 'orderDate', direction: 'descending' });
  const [salesOrderCurrentPage, setSalesOrderCurrentPage] = useState(1);

  const product = useMemo(() => products.find(p => p.id === productId), [products, productId]);
  const supplierMap = useMemo(() => suppliers.reduce((acc, s) => ({ ...acc, [s.id]: s }), {} as { [key: number]: Supplier }), [suppliers]);
  const customerMap = useMemo(() => customers.reduce((acc, c) => ({ ...acc, [c.id]: c }), {} as { [key: number]: Customer }), [customers]);

  // Helper for sorting logic
  const applySorting = (items: any[], sortConfig: SortConfig) => {
    if (!sortConfig.key) return items;

    return [...items].sort((a, b) => {
      const key = sortConfig.key;
      let valA: any = a[key];
      let valB: any = b[key];

      if (key === 'orderDate') {
        valA = parseISO(String(valA)).getTime(); // Parse ISO string
        valB = parseISO(String(valB)).getTime(); // Parse ISO string
      }

      let comparison = 0;
      if (typeof valA === 'string' && typeof valB === 'string') {
        comparison = valA.localeCompare(valB);
      } else if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      } else {
        comparison = String(valA).localeCompare(String(valB));
      }

      return sortConfig.direction === 'ascending' ? comparison : -comparison;
    });
  };

  // Helper for getting sort indicator
  const getSortIndicator = (currentKey: SortConfig['key'], sortConfig: SortConfig) => {
    if (sortConfig.key === currentKey) {
      return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    }
    return '';
  };

  // Helper for handling sort click
  const handleSortClick = (key: SortConfig['key'], currentSortConfig: SortConfig, setSortConfig: React.Dispatch<React.SetStateAction<SortConfig>>, setCurrentPage: React.Dispatch<React.SetStateAction<number>>) => () => {
    let direction: SortConfig['direction'] = 'ascending';
    if (currentSortConfig.key === key && currentSortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const relevantPurchaseOrders = useMemo(() => {
    if (!product) return [];

    let filteredOrders = purchaseOrders
      .filter(order => order.items.some(item => item.productId === productId));

    // Apply date filters
    if (poStartDateFilter) {
      filteredOrders = filteredOrders.filter(order => parseISO(order.orderDate) >= parseISO(poStartDateFilter)); // Parse ISO string
    }
    if (poEndDateFilter) {
      filteredOrders = filteredOrders.filter(order => parseISO(order.orderDate) <= parseISO(poEndDateFilter)); // Parse ISO string
    }

    const rawOrders = filteredOrders.map(order => {
        const orderItem = order.items.find(item => item.productId === productId);
        const supplier = supplierMap[order.contactId];

        const orderCurrency = order.currency;
        const priceInOrderCurrency = orderItem?.price || 0;
        const quantity = orderItem?.qty || 0;
        const landedCostPerUnit = orderItem?.landedCostPerUnit || 0;

        const rateToMainCurrency = orderCurrency === mainCurrency
          ? 1
          : (order.exchangeRate || currencyRates[orderCurrency] || 1) / (currencyRates[mainCurrency] || 1);

        return {
          orderId: order.id,
          orderDate: order.orderDate,
          supplierName: supplier?.name || 'N/A',
          quantity: quantity,
          priceInOrderCurrency: priceInOrderCurrency,
          orderCurrency: orderCurrency,
          rateToMainCurrency: rateToMainCurrency,
          landedCostPerUnit: landedCostPerUnit,
        };
      });

    const sortedOrders = applySorting(rawOrders, purchaseOrderSortConfig);
    const startIndex = (purchaseOrderCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return sortedOrders.slice(startIndex, endIndex);
  }, [product, purchaseOrders, supplierMap, mainCurrency, currencyRates, productId, purchaseOrderSortConfig, purchaseOrderCurrentPage, poStartDateFilter, poEndDateFilter]);

  const totalPurchaseOrders = useMemo(() => {
    if (!product) return 0;
    let filtered = purchaseOrders.filter(order => order.items.some(item => item.productId === productId));
    if (poStartDateFilter) {
      filtered = filtered.filter(order => parseISO(order.orderDate) >= parseISO(poStartDateFilter)); // Parse ISO string
    }
    if (poEndDateFilter) {
      filtered = filtered.filter(order => parseISO(order.orderDate) <= parseISO(poEndDateFilter)); // Parse ISO string
    }
    return filtered.length;
  }, [product, purchaseOrders, productId, poStartDateFilter, poEndDateFilter]);

  const relevantSellOrders = useMemo(() => {
    if (!product) return [];

    let filteredOrders = sellOrders
      .filter(order => order.items.some(item => item.productId === productId));

    // Apply date filters
    if (soStartDateFilter) {
      filteredOrders = filteredOrders.filter(order => parseISO(order.orderDate) >= parseISO(soStartDateFilter)); // Parse ISO string
    }
    if (soEndDateFilter) {
      filteredOrders = filteredOrders.filter(order => parseISO(order.orderDate) <= parseISO(soEndDateFilter)); // Parse ISO string
    }

    const rawOrders = filteredOrders.map(order => {
        const orderItem = order.items.find(item => item.productId === productId);
        const customer = customerMap[order.contactId];

        const quantity = orderItem?.qty || 0;
        const pricePerBaseUnit = orderItem?.price || 0;

        const itemTotalExclVat = quantity * pricePerBaseUnit;
        const itemTotalInclVat = itemTotalExclVat * (1 + (order.vatPercent / 100));

        return {
          orderId: order.id,
          orderDate: order.orderDate,
          customerName: customer?.name || 'N/A',
          quantity: quantity,
          priceExclVat: itemTotalExclVat,
          priceInclVat: itemTotalInclVat,
        };
      });

    const sortedOrders = applySorting(rawOrders, salesOrderSortConfig);
    const startIndex = (salesOrderCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return sortedOrders.slice(startIndex, endIndex);
  }, [product, sellOrders, customerMap, productId, salesOrderSortConfig, salesOrderCurrentPage, soStartDateFilter, soEndDateFilter]);

  const totalSellOrders = useMemo(() => {
    if (!product) return 0;
    let filtered = sellOrders.filter(order => order.items.some(item => item.productId === productId));
    if (soStartDateFilter) {
      filtered = filtered.filter(order => parseISO(order.orderDate) >= parseISO(soStartDateFilter)); // Parse ISO string
    }
    if (soEndDateFilter) {
      filtered = filtered.filter(order => parseISO(order.orderDate) <= parseISO(soEndDateFilter)); // Parse ISO string
    }
    return filtered.length;
  }, [product, sellOrders, productId, soStartDateFilter, soEndDateFilter]);

  if (!product) return null;

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t('productTransactions')}: ${product.name} (${product.sku})`}
      description={product.barcode ? `${t('barcode')}: ${product.barcode}` : t('productTransactionsDescription')}
    >
      <div className="space-y-8">
        <div className="mb-4 text-gray-700 dark:text-slate-300">
          <p className="text-md font-medium">
            <strong>{t('avgLandedCost')}:</strong> {product.averageLandedCost.toFixed(2)} {mainCurrency}
          </p>
        </div>

        {/* Purchase Orders Section */}
        <Collapsible open={isPurchaseOrdersOpen} onOpenChange={setIsPurchaseOrdersOpen}>
          <CollapsibleTrigger asChild>
            <button className="flex justify-between items-center w-full text-lg font-semibold text-gray-700 dark:text-slate-300 mb-4 focus:outline-none">
              {t('purchaseOrdersWithProduct')}
              {isPurchaseOrdersOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mb-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg shadow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                  <Label htmlFor="po-start-date-filter" className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('startDate')}</Label>
                  <Input
                    type="date"
                    id="po-start-date-filter"
                    value={poStartDateFilter}
                    onChange={(e) => {
                      setPoStartDateFilter(e.target.value);
                      setPurchaseOrderCurrentPage(1);
                    }}
                    className="mt-1 w-full p-2 border rounded-md shadow-sm bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="po-end-date-filter" className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('endDate')}</Label>
                  <Input
                    type="date"
                    id="po-end-date-filter"
                    value={poEndDateFilter}
                    onChange={(e) => {
                      setPoEndDateFilter(e.target.value);
                      setPurchaseOrderCurrentPage(1);
                    }}
                    className="mt-1 w-full p-2 border rounded-md shadow-sm bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              {relevantPurchaseOrders.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-100 dark:bg-slate-700">
                        <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={handleSortClick('orderId', purchaseOrderSortConfig, setPurchaseOrderSortConfig, setPurchaseOrderCurrentPage)}>
                          {t('orderId')} {getSortIndicator('orderId', purchaseOrderSortConfig)}
                        </TableHead>
                        <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={handleSortClick('orderDate', purchaseOrderSortConfig, setPurchaseOrderSortConfig, setPurchaseOrderCurrentPage)}>
                          {t('orderDate')} {getSortIndicator('orderDate', purchaseOrderSortConfig)}
                        </TableHead>
                        <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={handleSortClick('supplierName', purchaseOrderSortConfig, setPurchaseOrderSortConfig, setPurchaseOrderCurrentPage)}>
                          {t('supplier')} {getSortIndicator('supplierName', purchaseOrderSortConfig)}
                        </TableHead>
                        <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={handleSortClick('quantity', purchaseOrderSortConfig, setPurchaseOrderSortConfig, setPurchaseOrderCurrentPage)}>
                          {t('qty')} {getSortIndicator('quantity', purchaseOrderSortConfig)}
                        </TableHead>
                        <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={handleSortClick('priceInOrderCurrency', purchaseOrderSortConfig, setPurchaseOrderSortConfig, setPurchaseOrderCurrentPage)}>
                          {t('priceInOrderCurrency')} {getSortIndicator('priceInOrderCurrency', purchaseOrderSortConfig)}
                        </TableHead>
                        <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={handleSortClick('landedCostPerUnit', purchaseOrderSortConfig, setPurchaseOrderSortConfig, setPurchaseOrderCurrentPage)}>
                          {t('landedCostPerUnit')} {getSortIndicator('landedCostPerUnit', purchaseOrderSortConfig)}
                        </TableHead>
                        <TableHead className="p-3">{t('currencyRateToMainCurrency', { mainCurrency })}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relevantPurchaseOrders.map((po) => (
                        <TableRow key={po.orderId} className="border-b dark:border-slate-700 text-gray-800 dark:text-slate-300">
                          <TableCell className="p-3 font-semibold">#{po.orderId}</TableCell>
                          <TableCell className="p-3">{format(parseISO(po.orderDate), 'yyyy-MM-dd HH:mm')}</TableCell> {/* Format with time */}
                          <TableCell className="p-3">{po.supplierName}</TableCell>
                          <TableCell className="p-3">{po.quantity}</TableCell>
                          <TableCell className="p-3">{po.priceInOrderCurrency.toFixed(2)} {po.orderCurrency}</TableCell>
                          <TableCell className="p-3">{po.landedCostPerUnit.toFixed(2)} {mainCurrency}</TableCell>
                          <TableCell className="p-3">1 {po.orderCurrency} = {po.rateToMainCurrency.toFixed(4)} {mainCurrency}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <PaginationControls
                    totalItems={totalPurchaseOrders}
                    itemsPerPage={ITEMS_PER_PAGE}
                    currentPage={purchaseOrderCurrentPage}
                    onPageChange={setPurchaseOrderCurrentPage}
                  />
                </>
              ) : (
                <p className="p-4 text-center text-gray-500 dark:text-slate-400">
                  {t('noPurchaseOrdersFoundForProduct')}
                </p>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Sales Orders Section */}
        <Collapsible open={isSalesOrdersOpen} onOpenChange={setIsSalesOrdersOpen}>
          <CollapsibleTrigger asChild>
            <button className="flex justify-between items-center w-full text-lg font-semibold text-gray-700 dark:text-slate-300 mb-4 focus:outline-none">
              {t('salesOrdersWithProduct')}
              {isSalesOrdersOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mb-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg shadow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                  <Label htmlFor="so-start-date-filter" className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('startDate')}</Label>
                  <Input
                    type="date"
                    id="so-start-date-filter"
                    value={soStartDateFilter}
                    onChange={(e) => {
                      setSoStartDateFilter(e.target.value);
                      setSalesOrderCurrentPage(1);
                    }}
                    className="mt-1 w-full p-2 border rounded-md shadow-sm bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="so-end-date-filter" className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('endDate')}</Label>
                  <Input
                    type="date"
                    id="so-end-date-filter"
                    value={soEndDateFilter}
                    onChange={(e) => {
                      setSoEndDateFilter(e.target.value);
                      setSalesOrderCurrentPage(1);
                    }}
                    className="mt-1 w-full p-2 border rounded-md shadow-sm bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              {relevantSellOrders.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-100 dark:bg-slate-700">
                        <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={handleSortClick('orderId', salesOrderSortConfig, setSalesOrderSortConfig, setSalesOrderCurrentPage)}>
                          {t('orderId')} {getSortIndicator('orderId', salesOrderSortConfig)}
                        </TableHead>
                        <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={handleSortClick('customerName', salesOrderSortConfig, setSalesOrderSortConfig, setSalesOrderCurrentPage)}>
                          {t('customer')} {getSortIndicator('customerName', salesOrderSortConfig)}
                        </TableHead>
                        <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={handleSortClick('orderDate', salesOrderSortConfig, setSalesOrderSortConfig, setSalesOrderCurrentPage)}>
                          {t('saleDate')} {getSortIndicator('orderDate', salesOrderSortConfig)}
                        </TableHead>
                        <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={handleSortClick('quantity', salesOrderSortConfig, setSalesOrderSortConfig, setSalesOrderCurrentPage)}>
                          {t('qty')} {getSortIndicator('quantity', salesOrderSortConfig)}
                        </TableHead>
                        <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={handleSortClick('priceExclVat', salesOrderSortConfig, setSalesOrderSortConfig, setSalesOrderCurrentPage)}>
                          {t('priceExclVat')} {getSortIndicator('priceExclVat', salesOrderSortConfig)}
                        </TableHead>
                        <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={handleSortClick('priceInclVat', salesOrderSortConfig, setSalesOrderSortConfig, setSalesOrderCurrentPage)}>
                          {t('priceInclVat')} {getSortIndicator('priceInclVat', salesOrderSortConfig)}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relevantSellOrders.map((so) => (
                        <TableRow key={so.orderId} className="border-b dark:border-slate-700 text-gray-800 dark:text-slate-300">
                          <TableCell className="p-3 font-semibold">#{so.orderId}</TableCell>
                          <TableCell className="p-3">{so.customerName}</TableCell>
                          <TableCell className="p-3">{format(parseISO(so.orderDate), 'yyyy-MM-dd HH:mm')}</TableCell> {/* Format with time */}
                          <TableCell className="p-3">{so.quantity}</TableCell>
                          <TableCell className="p-3">{so.priceExclVat.toFixed(2)} {mainCurrency}</TableCell>
                          <TableCell className="p-3">{so.priceInclVat.toFixed(2)} {mainCurrency}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <PaginationControls
                    totalItems={totalSellOrders}
                    itemsPerPage={ITEMS_PER_PAGE}
                    currentPage={salesOrderCurrentPage}
                    onPageChange={setSalesOrderCurrentPage}
                  />
                </>
              ) : (
                <p className="p-4 text-center text-gray-500 dark:text-slate-400">
                  {t('noSalesOrdersFoundForProduct')}
                </p>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </FormModal>
  );
};

export default ProductTransactionsModal;