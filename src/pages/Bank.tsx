"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { useData, MOCK_CURRENT_DATE } from '@/context/DataContext';
import { t } from '@/utils/i18n';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle } from 'lucide-react';
import FormModal from '@/components/FormModal';
import PaymentForm from '@/forms/PaymentForm';
import { Payment, Currency } from '@/types';
import { format } from 'date-fns';

interface Transaction {
  id: string; // Unique ID for transaction (payment.id + type)
  date: string;
  description: string;
  amount: number; // Always in mainCurrency
  type: 'incoming' | 'outgoing';
  originalPaymentId: number;
}

const Bank: React.FC = () => {
  const {
    incomingPayments,
    outgoingPayments,
    settings,
    saveItem,
    getNextId,
    convertCurrency,
    showAlertModal,
  } = useData();
  const mainCurrency = settings.mainCurrency;

  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<number | undefined>(undefined);
  const [paymentFormType, setPaymentFormType] = useState<'incoming' | 'outgoing'>('incoming');
  const [initialCapitalPaymentCategory, setInitialCapitalPaymentCategory] = useState<string | undefined>(undefined);

  const handleAddInitialCapital = () => {
    setEditingPaymentId(undefined);
    setPaymentFormType('incoming');
    setInitialCapitalPaymentCategory('initialCapital'); // Set specific category for initial capital
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingPaymentId(undefined);
    setInitialCapitalPaymentCategory(undefined); // Clear category after modal closes
  };

  const allTransactions = useMemo(() => {
    const transactions: Transaction[] = [];

    incomingPayments.forEach(p => {
      const amountInMainCurrency = convertCurrency(p.amount, p.paymentCurrency, mainCurrency);
      let description = p.manualDescription || '';
      if (p.orderId !== 0) {
        description = `${t('incomingPayment')} #${p.id} for ${t('orderId')} #${p.orderId}`;
      } else if (p.paymentCategory === 'initialCapital') {
        description = t('initialCapital');
      } else if (p.paymentCategory) {
        description = `${t(p.paymentCategory as keyof typeof t)}: ${p.manualDescription || ''}`;
      }

      transactions.push({
        id: `inc-${p.id}`,
        date: p.date,
        description: description,
        amount: amountInMainCurrency,
        type: 'incoming',
        originalPaymentId: p.id,
      });
    });

    outgoingPayments.forEach(p => {
      const amountInMainCurrency = convertCurrency(p.amount, p.paymentCurrency, mainCurrency);
      let description = p.manualDescription || '';
      if (p.orderId !== 0) {
        description = `${t('outgoingPayment')} #${p.id} for ${t('orderId')} #${p.orderId}`;
      } else if (p.paymentCategory) {
        description = `${t(p.paymentCategory as keyof typeof t)}: ${p.manualDescription || ''}`;
      }

      transactions.push({
        id: `out-${p.id}`,
        date: p.date,
        description: description,
        amount: amountInMainCurrency,
        type: 'outgoing',
        originalPaymentId: p.id,
      });
    });

    // Sort all transactions by date
    transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return transactions;
  }, [incomingPayments, outgoingPayments, mainCurrency, convertCurrency, t]);

  const filteredTransactions = useMemo(() => {
    let filtered = allTransactions;

    if (startDateFilter) {
      filtered = filtered.filter(t => t.date >= startDateFilter);
    }
    if (endDateFilter) {
      filtered = filtered.filter(t => t.date <= endDateFilter);
    }
    return filtered;
  }, [allTransactions, startDateFilter, endDateFilter]);

  const transactionsWithRunningBalance = useMemo(() => {
    const transactionsWithBalance: (Transaction & { runningBalance: number })[] = [];
    let currentBalance = 0;

    // Calculate initial balance from transactions *before* the filter start date
    const initialTransactions = allTransactions.filter(t => !startDateFilter || t.date < startDateFilter);
    initialTransactions.forEach(t => {
      currentBalance += (t.type === 'incoming' ? t.amount : -t.amount);
    });

    // Apply running balance to filtered transactions
    filteredTransactions.forEach(t => {
      currentBalance += (t.type === 'incoming' ? t.amount : -t.amount);
      transactionsWithBalance.push({ ...t, runningBalance: currentBalance });
    });

    return transactionsWithBalance;
  }, [allTransactions, filteredTransactions, startDateFilter]);

  const currentBankBalance = useMemo(() => {
    if (transactionsWithRunningBalance.length > 0) {
      return transactionsWithRunningBalance[transactionsWithRunningBalance.length - 1].runningBalance;
    }
    // If no transactions in the filtered view, but there are transactions before the filter,
    // calculate the balance up to the start date.
    if (startDateFilter && allTransactions.length > 0) {
      let balanceBeforeFilter = 0;
      allTransactions.filter(t => t.date < startDateFilter).forEach(t => {
        balanceBeforeFilter += (t.type === 'incoming' ? t.amount : -t.amount);
      });
      return balanceBeforeFilter;
    }
    return 0; // No transactions at all
  }, [allTransactions, transactionsWithRunningBalance, startDateFilter]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-200">{t('bankAccount')}</h1>
        <Button onClick={handleAddInitialCapital}>
          <PlusCircle className="w-4 h-4 mr-2" />
          {t('setInitialCapital')}
        </Button>
      </div>

      <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <Label htmlFor="bank-start-date-filter" className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('startDate')}</Label>
            <Input
              type="date"
              id="bank-start-date-filter"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="mt-1 w-full p-2 border rounded-md shadow-sm bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
          </div>
          <div>
            <Label htmlFor="bank-end-date-filter" className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('endDate')}</Label>
            <Input
              type="date"
              id="bank-end-date-filter"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="mt-1 w-full p-2 border rounded-md shadow-sm bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300">{t('currentBalance')}</h2>
            <p className={`text-3xl font-bold mt-2 ${currentBankBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {currentBankBalance.toFixed(2)} {mainCurrency}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md overflow-x-auto">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4">{t('transactionHistory')}</h2>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100 dark:bg-slate-700">
              <TableHead className="p-3">{t('date')}</TableHead>
              <TableHead className="p-3">{t('description')}</TableHead>
              <TableHead className="p-3 text-right">{t('incoming')}</TableHead>
              <TableHead className="p-3 text-right">{t('outgoing')}</TableHead>
              <TableHead className="p-3 text-right">{t('balance')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactionsWithRunningBalance.length > 0 ? (
              transactionsWithRunningBalance.map((t, index) => (
                <TableRow key={t.id} className="border-b dark:border-slate-700 text-gray-800 dark:text-slate-300">
                  <TableCell className="p-3">{format(new Date(t.date), 'yyyy-MM-dd')}</TableCell>
                  <TableCell className="p-3">{t.description}</TableCell>
                  <TableCell className="p-3 text-right text-green-600">
                    {t.type === 'incoming' ? t.amount.toFixed(2) : '-'} {t.type === 'incoming' ? mainCurrency : ''}
                  </TableCell>
                  <TableCell className="p-3 text-right text-red-600">
                    {t.type === 'outgoing' ? t.amount.toFixed(2) : '-'} {t.type === 'outgoing' ? mainCurrency : ''}
                  </TableCell>
                  <TableCell className={`p-3 text-right font-bold ${t.runningBalance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {t.runningBalance.toFixed(2)} {mainCurrency}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="p-4 text-center text-gray-500 dark:text-slate-400">
                  {t('noTransactionsFound')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <FormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={t('setInitialCapital')}
      >
        <PaymentForm
          paymentId={editingPaymentId}
          type={paymentFormType}
          onSuccess={handleModalClose}
          initialManualCategory={initialCapitalPaymentCategory} // Pass initial category
        />
      </FormModal>
    </div>
  );
};

export default Bank;