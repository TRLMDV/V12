"use client";

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import OrderDetailsExcelExportButton from '@/components/OrderDetailsExcelExportButton';
import { t } from '@/utils/i18n';
import { SellOrder, Product, Customer, Warehouse, CurrencyRates, PackingUnit, Payment, ProductMovement, BankAccount } from '@/types';
import { useData } from '@/context/DataContext';
import { format, parseISO } from 'date-fns'; // Import format and parseISO

interface SellOrderDetailsProps {
  order: SellOrder;
  customerMap: { [key: number]: Customer };
  warehouseMap: { [key: number]: Warehouse };
  productMap: { [key: number]: Product };
  currencyRates: CurrencyRates;
}

const SellOrderDetails: React.FC<SellOrderDetailsProps> = ({
  order,
  customerMap,
  warehouseMap,
  productMap,
  currencyRates,
}) => {
  const { packingUnitMap, incomingPayments, productMovements, bankAccounts } = useData();

  // Find linked incoming payment by explicit ID or by orderId
  const linkedPayment: Payment | undefined =
    (order.incomingPaymentId ? incomingPayments.find(p => p.id === order.incomingPaymentId) : incomingPayments.find(p => p.orderId === order.id));
  const paymentBankAccountName =
    linkedPayment?.bankAccountId ? bankAccounts.find(ba => ba.id === linkedPayment.bankAccountId)?.name : undefined;

  // Find linked product movement by explicit ID or by sellOrderId
  const linkedMovement: ProductMovement | undefined =
    (order.productMovementId ? productMovements.find(m => m.id === order.productMovementId) : productMovements.find(m => m.sellOrderId === order.id));
  const movementTotalItems = linkedMovement ? (linkedMovement.items || []).reduce((sum, i) => sum + i.quantity, 0) : 0;

  return (
    <div className="grid gap-4 py-4 text-gray-800 dark:text-slate-300">
      <p><strong>{t('customer')}:</strong> {customerMap[order.contactId]?.name || 'N/A'}</p>
      <p><strong>{t('warehouse')}:</strong> {warehouseMap[order.warehouseId]?.name || 'N/A'}</p>
      <p><strong>{t('orderDate')}:</strong> {format(parseISO(order.orderDate), 'yyyy-MM-dd HH:mm')}</p>
      <p><strong>{t('orderStatus')}:</strong> {t(order.status.toLowerCase() as keyof typeof t)}</p>
      <p><strong>{t('vatPercent')}:</strong> {order.vatPercent}%</p>

      {(linkedMovement || linkedPayment) && (
        <div className="mt-2 grid gap-4">
          {linkedMovement && (
            <div className="rounded-md border p-3 bg-white dark:bg-slate-800">
              <h3 className="font-semibold mb-2">{t('productMovement')} #{linkedMovement.id}</h3>
              <div className="grid sm:grid-cols-2 gap-2 text-sm">
                <p><strong>{t('from')}:</strong> {warehouseMap[linkedMovement.sourceWarehouseId]?.name || 'N/A'}</p>
                <p><strong>{t('to')}:</strong> {warehouseMap[linkedMovement.destWarehouseId]?.name || 'N/A'}</p>
                <p><strong>{t('orderDate')}:</strong> {format(parseISO(linkedMovement.date), 'yyyy-MM-dd HH:mm')}</p>
                <p><strong>{t('totalItems')}:</strong> {movementTotalItems}</p>
              </div>
            </div>
          )}
          {linkedPayment && (
            <div className="rounded-md border p-3 bg-white dark:bg-slate-800">
              <h3 className="font-semibold mb-2">{t('incomingPayments')} #{linkedPayment.id}</h3>
              <div className="grid sm:grid-cols-2 gap-2 text-sm">
                <p><strong>{t('amount')}:</strong> {linkedPayment.amount.toFixed(2)} {linkedPayment.paymentCurrency}</p>
                <p><strong>{t('date')}:</strong> {format(parseISO(linkedPayment.date), 'yyyy-MM-dd HH:mm')}</p>
                <p><strong>{t('bankAccount')}:</strong> {paymentBankAccountName || 'N/A'}</p>
                <p><strong>{t('method')}:</strong> {linkedPayment.method || 'N/A'}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <h3 className="font-semibold mt-4 mb-2">{t('orderItems')}</h3>
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-100 dark:bg-slate-700">
            <TableHead className="p-2">{t('product')}</TableHead>
            <TableHead className="p-2">{t('qty')}</TableHead> {/* Now displays packing quantity */}
            <TableHead className="p-2">{t('price')}</TableHead>
            <TableHead className="p-2">{t('totalValue')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {order.items?.map((item, index) => {
            const product = productMap[item.productId];
            const itemTotal = item.price * item.qty;
            const packingUnit = item.packingUnitId ? packingUnitMap[item.packingUnitId] : undefined;
            const displayQty = packingUnit && item.packingQuantity !== undefined
              ? `${item.packingQuantity} ${packingUnit.name}`
              : `${item.qty} ${t('piece')}`; // Fallback to base unit

            return (
              <TableRow key={index} className="border-b dark:border-slate-600">
                <TableCell className="p-2">{product?.name || 'N/A'}</TableCell>
                <TableCell className="p-2">{displayQty}</TableCell>
                <TableCell className="p-2">{item.price?.toFixed(2)} AZN</TableCell>
                <TableCell className="p-2">{itemTotal.toFixed(2)} AZN</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <TableFooter>
          <TableRow className="bg-gray-100 dark:bg-slate-700 font-bold">
            <TableCell colSpan={3} className="p-2 text-right">{t('productsSubtotal')}:</TableCell>
            <TableCell className="p-2">{order.items?.reduce((sum, item) => sum + (item.price * item.qty), 0).toFixed(2)} AZN</TableCell>
          </TableRow>
          <TableRow className="bg-gray-100 dark:bg-slate-700">
            <TableCell colSpan={3} className="p-2 text-right">{t('vatPercent')} ({order.vatPercent}%):</TableCell>
            <TableCell className="p-2">{(order.total / (1 + order.vatPercent / 100) * (order.vatPercent / 100)).toFixed(2)} AZN</TableCell>
          </TableRow>
          <TableRow className="bg-gray-200 dark:bg-slate-600 font-bold">
            <TableCell colSpan={3} className="p-2 text-right">{t('total')}:</TableCell>
            <TableCell className="p-2 text-sky-600 dark:text-sky-400">{order.total.toFixed(2)} AZN</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
      <OrderDetailsExcelExportButton
        order={order}
        orderType="sell"
        productMap={productMap}
        customerMap={customerMap}
        supplierMap={{}}
        warehouseMap={warehouseMap}
        currencyRates={currencyRates}
      />
    </div>
  );
};

export default SellOrderDetails;