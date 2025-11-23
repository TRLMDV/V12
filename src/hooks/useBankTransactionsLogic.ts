"use client";

import { useState, useMemo, useCallback } from 'react';
import { useData } from '@/context/DataContext';
import { BankAccount, Currency, Payment } from '@/types';
import { format } from 'date-fns';
import { t } from '@/utils/i18n';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number; // Always in the account's currency
  type: 'incoming' | 'outgoing' | 'initial';
  originalPaymentId: number;
  originalPaymentCurrency: Currency;
  originalPaymentAmount: number;
  runningBalance?: number;
}

export function useBankTransactionsLogic(
  selectedBankAccountId: number | undefined,
  bankAccountMap: { [key: number]: BankAccount },
  incomingPayments: Payment[],
  outgoingPayments: Payment[],
  convertCurrency: (amount: number, fromCurrency: Currency, toCurrency: Currency) => number,
  runningBalancesMap: Map<number, Map<string, number>>,
  mainCurrency: Currency,
) {
  const [isTransactionsModalOpen, setIsTransactionsModalOpen] = useState(false);
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [transactionsCurrentPage, setTransactionsCurrentPage] = useState(1);
  const transactionsItemsPerPage = 100;

  const selectedAccountCurrency = useMemo(() => {
    if (!selectedBankAccountId) return mainCurrency;
    const account = bankAccountMap[selectedBankAccountId];
    return account ? account.currency : mainCurrency;
  }, [selectedBankAccountId, bankAccountMap, mainCurrency]);

  const allTransactionsForSelectedAccount = useMemo(() => {
    const transactions: Omit<Transaction, 'runningBalance'>[] = [];
    const selectedAccount = bankAccountMap[selectedBankAccountId as number];

    if (!selectedAccount) return [];

    transactions.push({
      id: `initial-${selectedAccount.id}`,
      date: '1970-01-01',
      description: t('initialBalance'),
      amount: selectedAccount.initialBalance,
      type: 'initial',
      bankAccountId: selectedAccount.id,
      originalPaymentId: 0,
      originalPaymentCurrency: selectedAccount.currency,
      originalPaymentAmount: selectedAccount.initialBalance,
    });

    incomingPayments.forEach(p => {
      if (p.bankAccountId === selectedAccount.id) {
        const amountInAccountCurrency = convertCurrency(p.amount, p.paymentCurrency, selectedAccount.currency);
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
          amount: amountInAccountCurrency,
          type: 'incoming',
          bankAccountId: selectedAccount.id,
          originalPaymentId: p.id,
          originalPaymentCurrency: p.paymentCurrency,
          originalPaymentAmount: p.amount,
        });
      }
    });

    outgoingPayments.forEach(p => {
      if (p.bankAccountId === selectedAccount.id) {
        const amountInAccountCurrency = convertCurrency(p.amount, p.paymentCurrency, selectedAccount.currency);
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
          amount: amountInAccountCurrency,
          type: 'outgoing',
          bankAccountId: selectedAccount.id,
          originalPaymentId: p.id,
          originalPaymentCurrency: p.paymentCurrency,
          originalPaymentAmount: p.amount,
        });
      }
    });

    transactions.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      const typeOrder = { 'initial': 0, 'incoming': 1, 'outgoing': 2 };
      return typeOrder[a.type] - typeOrder[b.type];
    });

    let currentRunningBalance = selectedAccount.initialBalance;
    const transactionsWithRunningBalance: Transaction[] = [];

    transactions.forEach(t => {
      if (t.type === 'initial') {
        // currentRunningBalance is already set to initialBalance
      } else if (t.type === 'incoming') {
        currentRunningBalance += t.amount;
      } else if (t.type === 'outgoing') {
        currentRunningBalance -= t.amount;
      }
      transactionsWithRunningBalance.push({ ...t, runningBalance: currentRunningBalance });
    });

    return transactionsWithRunningBalance;
  }, [selectedBankAccountId, bankAccountMap, incomingPayments, outgoingPayments, convertCurrency, t]);

  const filteredTransactions = useMemo(() => {
    let filtered = allTransactionsForSelectedAccount;

    if (startDateFilter) {
      filtered = filtered.filter(t => t.date >= startDateFilter);
    }
    if (endDateFilter) {
      filtered = filtered.filter(t => t.date <= endDateFilter);
    }
    return filtered;
  }, [allTransactionsForSelectedAccount, startDateFilter, endDateFilter]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (transactionsCurrentPage - 1) * transactionsItemsPerPage;
    const endIndex = startIndex + transactionsItemsPerPage;
    return filteredTransactions.slice(startIndex, endIndex);
  }, [filteredTransactions, transactionsCurrentPage, transactionsItemsPerPage]);

  const currentAccountBalanceInModal = useMemo(() => {
    if (!selectedBankAccountId) return 0;
    const account = bankAccountMap[selectedBankAccountId];
    if (!account) return 0;

    const accountBalancesMap = runningBalancesMap.get(selectedBankAccountId);
    if (accountBalancesMap && accountBalancesMap.size > 0) {
      const lastFilteredTransaction = filteredTransactions[filteredTransactions.length - 1];
      if (lastFilteredTransaction && lastFilteredTransaction.runningBalance !== undefined) {
        return lastFilteredTransaction.runningBalance;
      }
    }
    return account.initialBalance;
  }, [selectedBankAccountId, bankAccountMap, filteredTransactions, runningBalancesMap]);

  const excelExportData = useMemo(() => {
    return filteredTransactions.map(t => ({
      Date: format(new Date(t.date), 'yyyy-MM-dd'),
      Description: t.description,
      Incoming: (t.type === 'incoming' || t.type === 'initial') ? `${t.amount.toFixed(2)} ${selectedAccountCurrency}` : '',
      Outgoing: t.type === 'outgoing' ? `${t.amount.toFixed(2)} ${selectedAccountCurrency}` : '',
      Balance: `${t.runningBalance?.toFixed(2) || '0.00'} ${selectedAccountCurrency}`,
    }));
  }, [filteredTransactions, selectedAccountCurrency]);

  const handleViewTransactions = useCallback((id: number) => {
    // This setter is passed from the parent Bank component
    // setSelectedBankAccountId(id); // This is handled by the parent
    setIsTransactionsModalOpen(true);
    setTransactionsCurrentPage(1);
    setStartDateFilter('');
    setEndDateFilter('');
  }, []);

  const handleTransactionsModalClose = useCallback(() => {
    setIsTransactionsModalOpen(false);
    // setSelectedBankAccountId(undefined); // This is handled by the parent
    setStartDateFilter('');
    setEndDateFilter('');
    setTransactionsCurrentPage(1);
  }, []);

  return {
    isTransactionsModalOpen,
    startDateFilter,
    setStartDateFilter,
    endDateFilter,
    setEndDateFilter,
    paginatedTransactions,
    transactionsCurrentPage,
    setTransactionsCurrentPage,
    transactionsItemsPerPage,
    currentAccountBalanceInModal,
    selectedAccountCurrency,
    excelExportData,
    totalTransactions: filteredTransactions.length,
    handleViewTransactions,
    handleTransactionsModalClose,
  };
}