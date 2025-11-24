"use client";

import React, { useMemo } from 'react';
import FormModal from '@/components/FormModal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useData } from '@/context/DataContext';
import { t } from '@/utils/i18n';
import { Product, PurchaseOrder, SellOrder, Supplier, Customer, Currency } from '@/types';

interface ProductTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number;
}

const ProductTransactionsModal: React.FC<ProductTransactionsModalProps> = ({ isOpen, onClose, productId }) => {
  const { products, purchaseOrders, sellOrders, suppliers, customers, currencyRates, settings } = useData();
  const mainCurrency = settings.mainCurrency;

  const product = useMemo(() => products.find(p => p.id === productId), [products, productId]);
  const supplierMap = useMemo(() => suppliers.reduce((acc, s) => ({ ...acc, [s.id]: s }), {} as { [key: number]: Supplier }), [suppliers]);
  const customerMap = useMemo(() => customers.reduce((acc, c) => ({ ...acc, [c.id]: c }), {} as { [key: number]: Customer }), [customers]);

  const relevantPurchaseOrders = useMemo(() => {
    if (!product) return [];

    return purchaseOrders
      .filter(order => order.items.some(item => item.productId === productId))
      .map(order => {
        const orderItem = order.items.find(item => item.productId === productId);
        const supplier = supplierMap[order.contactId];

        const orderCurrency = order.currency;
        const priceInOrderCurrency = orderItem?.price || 0;
        const quantity = orderItem?.qty || 0;

        // Get the exchange rate for the order's currency to the main currency
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
        };
      })
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()); // Sort by date descending
  }, [product, purchaseOrders, supplierMap, mainCurrency, currencyRates, productId]);

  const relevantSellOrders = useMemo(() => {
    if (!product) return [];

    return sellOrders
      .filter(order => order.items.some(item => item.productId === productId))
      .map(order => {
        const orderItem = order.items.find(item => item.productId === productId);
        const customer = customerMap[order.contactId];

        const quantity = orderItem?.qty || 0;
        const pricePerBaseUnit = orderItem?.price || 0; // Price per base unit in main currency

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
      })
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()); // Sort by date descending
  }, [product, sellOrders, customerMap, productId]);

  if (!product) return null;

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t('productTransactions')}: ${product.name} (${product.sku})`}
      description={t('productTransactionsDescription')}
    >
      <div className="space-y-8">
        {/* Purchase Orders Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-300 mb-4">{t('purchaseOrdersWithProduct')}</h3>
          <div className="overflow-x-auto">
            {relevantPurchaseOrders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100 dark:bg-slate-700">
                    <TableHead className="p-3">{t('orderId')}</TableHead>
                    <TableHead className="p-3">{t('orderDate')}</TableHead>
                    <TableHead className="p-3">{t('supplier')}</TableHead>
                    <TableHead className="p-3">{t('qty')}</TableHead>
                    <TableHead className="p-3">{t('priceInOrderCurrency')}</TableHead>
                    <TableHead className="p-3">{t('currencyRateToMainCurrency', { mainCurrency })}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relevantPurchaseOrders.map((po, index) => (
                    <TableRow key={po.orderId} className="border-b dark:border-slate-700 text-gray-800 dark:text-slate-300">
                      <TableCell className="p-3 font-semibold">#{po.orderId}</TableCell>
                      <TableCell className="p-3">{po.orderDate}</TableCell>
                      <TableCell className="p-3">{po.supplierName}</TableCell>
                      <TableCell className="p-3">{po.quantity}</TableCell>
                      <TableCell className="p-3">{po.priceInOrderCurrency.toFixed(2)} {po.orderCurrency}</TableCell>
                      <TableCell className="p-3">1 {po.orderCurrency} = {po.rateToMainCurrency.toFixed(4)} {mainCurrency}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="p-4 text-center text-gray-500 dark:text-slate-400">
                {t('noPurchaseOrdersFoundForProduct')}
              </p>
            )}
          </div>
        </div>

        {/* Sales Orders Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-300 mb-4">{t('salesOrdersWithProduct')}</h3>
          <div className="overflow-x-auto">
            {relevantSellOrders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100 dark:bg-slate-700">
                    <TableHead className="p-3">{t('orderId')}</TableHead>
                    <TableHead className="p-3">{t('customer')}</TableHead>
                    <TableHead className="p-3">{t('saleDate')}</TableHead>
                    <TableHead className="p-3">{t('qty')}</TableHead>
                    <TableHead className="p-3">{t('priceExclVat')}</TableHead>
                    <TableHead className="p-3">{t('priceInclVat')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relevantSellOrders.map((so, index) => (
                    <TableRow key={so.orderId} className="border-b dark:border-slate-700 text-gray-800 dark:text-slate-300">
                      <TableCell className="p-3 font-semibold">#{so.orderId}</TableCell>
                      <TableCell className="p-3">{so.customerName}</TableCell>
                      <TableCell className="p-3">{so.orderDate}</TableCell>
                      <TableCell className="p-3">{so.quantity}</TableCell>
                      <TableCell className="p-3">{so.priceExclVat.toFixed(2)} {mainCurrency}</TableCell>
                      <TableCell className="p-3">{so.priceInclVat.toFixed(2)} {mainCurrency}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="p-4 text-center text-gray-500 dark:text-slate-400">
                {t('noSalesOrdersFoundForProduct')}
              </p>
            )}
          </div>
        </div>
      </div>
    </FormModal>
  );
};

export default ProductTransactionsModal;