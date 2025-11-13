"use client";

import React from 'react';
import ExcelImportButton from '@/components/ExcelImportButton';
import ExcelExportButton from '@/components/ExcelExportButton';
import { toast } from 'sonner';
import { Payment, PurchaseOrder } from '@/types';

interface OutgoingPaymentsImportExportProps {
  outgoingPayments: Payment[];
  setOutgoingPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  purchaseOrders: PurchaseOrder[];
  suppliers: { [key: number]: any }; // Use any for supplierMap
  currencyRates: { [key: string]: number };
  getNextId: (key: 'outgoingPayments') => number;
  setNextIdForCollection: (key: 'outgoingPayments', nextId: number) => void;
  showAlertModal: (title: string, message: string) => void;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

const OutgoingPaymentsImportExport: React.FC<OutgoingPaymentsImportExportProps> = ({
  outgoingPayments, setOutgoingPayments, purchaseOrders, suppliers, currencyRates,
  getNextId, setNextIdForCollection, showAlertModal, t
}) => {
  const handleImportOutgoingPayments = (data: any[]) => {
    const newPayments: Payment[] = [];
    const errors: string[] = [];

    data.forEach((row: any, index: number) => {
      const orderId = parseInt(row['Linked Order ID'] || '0');
      const paymentCategory = row['Payment Category'] as Payment['paymentCategory'] || 'manual';
      const paymentCurrency = row['Payment Currency'] as Payment['paymentCurrency'] || 'AZN';

      if (orderId !== 0) {
        const order = purchaseOrders.find(o => o.id === orderId);
        if (!order) {
          errors.push(`Row ${index + 2}: Linked Purchase Order ID "${orderId}" not found.`);
          return;
        }
      }

      if (!row['Payment Date'] || !row['Amount Paid'] || !row['Method']) {
        errors.push(`Row ${index + 2}: Missing required fields (Payment Date, Amount Paid, Method).`);
        return;
      }
      if (paymentCategory === 'manual' && !row['Manual Description']) {
        errors.push(`Row ${index + 2}: Manual Expense requires a description.`);
        return;
      }

      const newPayment: Payment = {
        id: getNextId('outgoingPayments'),
        orderId: orderId,
        paymentCategory: paymentCategory,
        manualDescription: row['Manual Description'] || undefined,
        date: String(row['Payment Date']),
        amount: parseFloat(row['Amount Paid'] || '0'),
        paymentCurrency: paymentCurrency,
        paymentExchangeRate: parseFloat(row['Exchange Rate to AZN'] || '0') || undefined,
        method: String(row['Method'] || ''),
        bankAccountId: 0, // Placeholder, bank account ID cannot be imported directly without mapping
      };
      newPayments.push(newPayment);
    });

    if (errors.length > 0) {
      toast.error(t('excelImportError'), {
        description: `${t('importErrorsFound')}: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`,
        duration: 10000,
      });
    }

    setOutgoingPayments(prev => {
      const allPayments = [...prev, ...newPayments];
      const maxId = allPayments.reduce((max, p) => Math.max(max, p.id), 0);
      setNextIdForCollection('outgoingPayments', maxId + 1);
      return allPayments;
    });

    if (newPayments.length > 0) {
      toast.success(t('excelImportSuccess'), { description: `${newPayments.length} ${t('outgoingPayments')} ${t('importedSuccessfully')}.` });
    }
  };

  return (
    <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4">{t('outgoingPayments')}</h2>
      <p className="text-gray-600 dark:text-slate-400 mb-4">
        {t('outgoingPaymentsImportExportDescription')}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ExcelImportButton
          buttonLabel={t('importExcelFile')}
          description={t('importOutgoingPaymentsDescription')}
          onImport={handleImportOutgoingPayments}
          requiredColumns={['Payment Date', 'Amount Paid', 'Method', 'Payment Currency']}
        />
        <ExcelExportButton
          buttonLabel={t('exportExcelFile')}
          data={outgoingPayments.map(p => {
            let linkedOrderDisplay = '';
            if (p.orderId === 0) {
              linkedOrderDisplay = t('manualExpense');
            } else {
              const order = purchaseOrders.find(o => o.id === p.orderId);
              const supplierName = order ? suppliers[order.contactId]?.name || 'Unknown' : 'N/A';
              const categoryText = p.paymentCategory === 'products' ? t('paymentForProducts') : (p.paymentCategory === 'fees' ? t('paymentForFees') : '');
              linkedOrderDisplay = `${t('orderId')} #${p.orderId} (${supplierName}) ${categoryText}`;
            }
            return {
              ...p,
              linkedOrderDisplay,
              paymentCategoryDisplay: p.paymentCategory || 'manual',
            };
          })}
          fileName="outgoing_payments_export"
          sheetName="Outgoing Payments"
          columns={[
            { header: 'ID', accessor: 'id' },
            { header: 'Linked Order ID', accessor: 'orderId' },
            { header: 'Payment Category', accessor: 'paymentCategoryDisplay' },
            { header: 'Manual Description', accessor: 'manualDescription' },
            { header: 'Payment Date', accessor: 'date' },
            { header: 'Amount Paid', accessor: 'amount' },
            { header: 'Payment Currency', accessor: 'paymentCurrency' },
            { header: 'Exchange Rate to AZN', accessor: 'paymentExchangeRate' },
            { header: 'Method', accessor: 'method' },
          ]}
        />
      </div>
    </div>
  );
};

export default OutgoingPaymentsImportExport;