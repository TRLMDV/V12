"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { t } from '@/utils/i18n';
import { SellOrder, Customer, Warehouse } from '@/types';

interface SellOrdersTableProps {
  orders: (SellOrder & {
    customerName: string;
    warehouseName: string;
    totalItems: number;
    totalValueAZN: number;
    paymentStatus: 'Paid' | 'Partially Paid' | 'Unpaid';
    totalInclVat: number; // New prop
    totalExclVat: number; // New prop
  })[];
  handleEditOrder: (id: number) => void;
  handleDeleteOrder: (id: number) => void;
  viewOrderDetails: (id: number) => void;
  sortConfig: { key: string; direction: 'ascending' | 'descending' };
  handleSortClick: (key: string) => () => void;
  getSortIndicator: (key: string) => string;
}

const SellOrdersTable: React.FC<SellOrdersTableProps> = ({
  orders,
  handleEditOrder,
  handleDeleteOrder,
  viewOrderDetails,
  sortConfig,
  handleSortClick,
  getSortIndicator,
}) => {
  const totalSumExclVat = orders.reduce((sum, order) => sum + order.totalExclVat, 0);
  const totalSumInclVat = orders.reduce((sum, order) => sum + order.totalInclVat, 0);

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-100 dark:bg-slate-700">
            <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={handleSortClick('id')}>
              {t('orderId')} {getSortIndicator('id')}
            </TableHead>
            <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={handleSortClick('customerName')}>
              {t('customer')} {getSortIndicator('customerName')}
            </TableHead>
            <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={handleSortClick('orderDate')}>
              {t('orderDate')} {getSortIndicator('orderDate')}
            </TableHead>
            <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={handleSortClick('warehouseName')}>
              {t('warehouse')} {getSortIndicator('warehouseName')}
            </TableHead>
            <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={handleSortClick('status')}>
              {t('orderStatus')} {getSortIndicator('status')}
            </TableHead>
            <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={handleSortClick('paymentStatus')}>
              {t('paymentStatus')} {getSortIndicator('paymentStatus')}
            </TableHead>
            <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={handleSortClick('totalExclVat')}>
              {t('total')} (Excl. VAT) {getSortIndicator('totalExclVat')}
            </TableHead>
            <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={handleSortClick('totalInclVat')}>
              {t('total')} (Incl. VAT) {getSortIndicator('totalInclVat')}
            </TableHead>
            <TableHead className="p-3">{t('actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length > 0 ? (
            orders.map(order => (
              <TableRow key={order.id} className="border-b dark:border-slate-700 text-gray-800 dark:text-slate-300">
                <TableCell className="p-3 font-semibold">#{order.id}</TableCell>
                <TableCell className="p-3">{order.customerName}</TableCell>
                <TableCell className="p-3">{order.orderDate}</TableCell>
                <TableCell className="p-3">{order.warehouseName}</TableCell>
                <TableCell className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === 'Shipped' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    order.status === 'Confirmed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {t(order.status.toLowerCase() as keyof typeof t)}
                  </span>
                </TableCell>
                <TableCell className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    order.paymentStatus === 'Partially Paid' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {t(order.paymentStatus.toLowerCase().replace(' ', '') as keyof typeof t)}
                  </span>
                </TableCell>
                <TableCell className="p-3 font-bold text-gray-700 dark:text-slate-300">{order.totalExclVat.toFixed(2)} AZN</TableCell>
                <TableCell className="p-3 font-bold text-sky-600 dark:text-sky-400">{order.totalInclVat.toFixed(2)} AZN</TableCell>
                <TableCell className="p-3">
                  <Button variant="link" onClick={() => viewOrderDetails(order.id)} className="mr-2 p-0 h-auto">
                    {t('view')}
                  </Button>
                  <Button variant="link" onClick={() => handleEditOrder(order.id)} className="mr-2 p-0 h-auto">
                    {t('edit')}
                  </Button>
                  <Button variant="link" onClick={() => handleDeleteOrder(order.id)} className="text-red-500 p-0 h-auto">
                    {t('delete')}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={9} className="p-4 text-center text-gray-500 dark:text-slate-400">
                {t('noItemsFound')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        <TableFooter>
          <TableRow className="bg-gray-100 dark:bg-slate-700 font-bold">
            <TableCell colSpan={6} className="p-3 text-right text-lg">{t('totals')}:</TableCell><TableCell className="p-3 text-lg text-gray-700 dark:text-slate-300">{totalSumExclVat.toFixed(2)} AZN</TableCell><TableCell className="p-3 text-lg text-sky-600 dark:text-sky-400">{totalSumInclVat.toFixed(2)} AZN</TableCell><TableCell className="p-3"></TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};

export default SellOrdersTable;