"use client";

import React from 'react';
import ExcelImportButton from '@/components/ExcelImportButton';
import ExcelExportButton from '@/components/ExcelExportButton';
import { toast } from 'sonner';
import { Payment, SellOrder } from '@/types';

interface IncomingPaymentsImportExportProps {
  incomingPayments: Payment[];
  setIncomingPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  sellOrders: SellOrder[];
  customers: { [key: number]: any }; // Use any for customerMap
  currencyRates: { [key: string]: number };
  getNextId: (key: 'incomingPayments') => number;
  setNextIdForCollection: (key: 'incomingPayments', nextId: number) => void;
  showAlertModal: (title: string, message: string) => void;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

const IncomingPaymentsImportExport: React.FC<IncomingPaymentsImportExportProps> = ({
  incomingPayments, setIncomingPayments, sellOrders, customers, currencyRates,
  getNextId, setNextIdForCollection, showAlertModal, t
}) => {
  const handleImportIncomingPayments = (data: any[]) => {
    const newPayments: Payment[] = [];
    const errors: string[] = [];

    data.forEach((row: any, index: number) => {
      const orderId = parseInt(row['Linked Order ID'] || '0');
      const paymentCategory = row['Payment Category'] as Payment['paymentCategory'] || 'manual';
      const paymentCurrency = row['Payment Currency'] as Payment['paymentCurrency'] || 'AZN';

      if (orderId !== 0) {
        const order = sellOrders.find(o => o.id === orderId);
        if (!order) {
          errors.push(`Row ${index + 2}: Linked Sell Order ID "${orderId}" not found.`);
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
        id: getNextId('incomingPayments'),
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

    setIncomingPayments(prev => {
      const allPayments = [...prev, ...newPayments];
      const maxId = allPayments.reduce((max, p) => Math.max(max, p.id), 0);
      setNextIdForCollection('incomingPayments', maxId + 1);
      return allPayments;
    });

    if (newPayments.length > 0) {
      toast.success(t('excelImportSuccess'), { description: `${newPayments.length} ${t('incomingPayments')} ${t('importedSuccessfully')}.` });
    }
  };

  return (
    <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4">{t('incomingPayments')}</h2>
      <p className="text-gray-600 dark:text-slate-400 mb-4">
        {t('incomingPaymentsImportExportDescription')}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ExcelImportButton
          buttonLabel={t('importExcelFile')}
          description={t('importIncomingPaymentsDescription')}
          onImport={handleImportIncomingPayments}
          requiredColumns={['Payment Date', 'Amount Paid', 'Method', 'Payment Currency']}
        />
        <ExcelExportButton
          buttonLabel={t('exportExcelFile')}
          data={incomingPayments.map(p => {
            let linkedOrderDisplay = '';
            if (p.orderId === 0) {
              linkedOrderDisplay = t('manualExpense');
            } else {
              const order = sellOrders.find(o => o.id === p.orderId);
              const customerName = order ? customers[order.contactId]?.name || 'Unknown' : 'N/A';
              linkedOrderDisplay = `${t('orderId')} #${p.orderId} (${customerName})`;
            }
            return {
              ...p,
              linkedOrderDisplay,
              paymentCategoryDisplay: p.paymentCategory || 'manual',
            };
          })}
          fileName="incoming_payments_export"
          sheetName="Incoming Payments"
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

export default IncomingPaymentsImportExport;