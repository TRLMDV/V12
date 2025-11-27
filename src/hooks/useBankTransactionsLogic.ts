"use client";

import { useState, useMemo, useCallback } from 'react';
import { useData } from '@/context/DataContext';
import { BankAccount, Currency, Payment, SellOrder, PurchaseOrder, PaymentCategorySetting } from '@/types';
import { format } from 'date-fns';
import { t } from '@/utils/i18n';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number; // Always in the account's currency
  type: 'incoming' | 'outgoing' | 'initial';
  bankAccountId: number; // Added this property
  originalPaymentId: number;
  originalPaymentCurrency: Currency;
  originalPaymentAmount: number;
  runningBalance?: number;
  linkedOrderDisplay?: string; // New: Descriptive string for the transaction ID
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
  const { sellOrders, purchaseOrders, customers, suppliers, settings } = useData();

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

  // Memoize maps for efficient lookups
  const sellOrderMap = useMemo(() => sellOrders.reduce((acc, o) => ({ ...acc, [o.id]: o }), {} as { [key: number]: SellOrder }), [sellOrders]);
  const purchaseOrderMap = useMemo(() => purchaseOrders.reduce((acc, o) => ({ ...acc, [o.id]: o }), {} as { [key: number]: PurchaseOrder }), [purchaseOrders]);
  const customerMap = useMemo(() => customers.reduce((acc, c) => ({ ...acc, [c.id]: c.name }), {} as { [key: number]: string }), [customers]);
  const supplierMap = useMemo(() => suppliers.reduce((acc, s) => ({ ...acc, [s.id]: s.name }), {} as { [key: number]: string }), [suppliers]);
  const paymentCategoryMap = useMemo(() => (settings.paymentCategories || []).reduce((acc, cat) => ({ ...acc, [cat.name]: cat.name }), {} as { [key: string]: string }), [settings.paymentCategories]);


  const allTransactionsForSelectedAccount = useMemo(() => {
    const transactions: Omit<Transaction, 'runningBalance'>[] = [];
    const selectedAccount = bankAccountMap[selectedBankAccountId as number];

    if (!selectedAccount) return [];

    // Initial balance as a transaction (using epoch date to ensure it's sorted first)
    transactions.push({
      id: `initial-${selectedAccount.id}`,
      date: selectedAccount.creationDate || '1970-01-01', // Use creationDate for initial balance
      description: t('initialBalance'),
      amount: selectedAccount.initialBalance,
      type: 'initial',
      bankAccountId: selectedAccount.id,
      originalPaymentId: 0,
      originalPaymentCurrency: selectedAccount.currency,
      originalPaymentAmount: selectedAccount.initialBalance,
      linkedOrderDisplay: t('initialBalance'), // Set descriptive ID
    });

    incomingPayments.forEach(p => {
      if (p.bankAccountId === selectedAccount.id) {
        const amountInAccountCurrency = convertCurrency(p.amount, p.paymentCurrency, selectedAccount.currency);
        let description = p.manualDescription || '';
        let linkedOrderDisplay = '';

        if (p.orderId === 0) {
          const categoryName = p.paymentCategory && paymentCategoryMap[p.paymentCategory] ? p.paymentCategory : t('manualExpense');
          description = `${t(categoryName as keyof typeof t)}: ${p.manualDescription || ''}`;
          linkedOrderDisplay = `${t(categoryName as keyof typeof t)} ${p.manualDescription ? `- ${p.manualDescription}` : ''}`;
        } else {
          const order = sellOrderMap[p.orderId];
          const customerName = order ? customerMap[order.contactId] || 'Unknown' : 'N/A';
          description = `${t('incomingPayment')} #${p.id} for ${t('orderId')} #${p.orderId} (${customerName})`;
          linkedOrderDisplay = `${t('orderId')} #${p.orderId} (${customerName}) ${t('paymentForProducts')}`;
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
          linkedOrderDisplay: linkedOrderDisplay, // Set descriptive ID
        });
      }
    });

    outgoingPayments.forEach(p => {
      if (p.bankAccountId === selectedAccount.id) {
        const amountInAccountCurrency = convertCurrency(p.amount, p.paymentCurrency, selectedAccount.currency);
        let description = p.manualDescription || '';
        let linkedOrderDisplay = '';

        if (p.orderId === 0) {
          const categoryName = p.paymentCategory && paymentCategoryMap[p.paymentCategory] ? p.paymentCategory : t('manualExpense');
          description = `${t(categoryName as keyof typeof t)}: ${p.manualDescription || ''}`;
          linkedOrderDisplay = `${t(categoryName as keyof typeof t)} ${p.manualDescription ? `- ${p.manualDescription}` : ''}`;
        } else {
          const order = purchaseOrderMap[p.orderId];
          const supplierName = order ? supplierMap[order.contactId] || 'Unknown' : 'N/A';
          let categoryText = '';
          switch (p.paymentCategory) {
            case 'products': categoryText = t('paymentForProducts'); break;
            case 'fees': categoryText = t('paymentForFees'); break;
            default: categoryText = ''; break;
          }
          description = `${t('outgoingPayment')} #${p.id} for ${t('orderId')} #${p.orderId} (${supplierName})`;
          linkedOrderDisplay = `${t('orderId')} #${p.orderId} (${supplierName}) ${categoryText}`;
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
          linkedOrderDisplay: linkedOrderDisplay, // Set descriptive ID
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
  }, [selectedBankAccountId, bankAccountMap, incomingPayments, outgoingPayments, convertCurrency, sellOrderMap, purchaseOrderMap, customerMap, supplierMap, paymentCategoryMap, t]);

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
      'Transaction ID': t.linkedOrderDisplay || 'N/A', // Use the descriptive ID
      Date: format(new Date(t.date), 'yyyy-MM-dd'),
      Description: t.description,
      Incoming: (t.type === 'incoming' || t.type === 'initial') ? `${t.amount.toFixed(2)} ${selectedAccountCurrency}` : '',
      Outgoing: t.type === 'outgoing' ? `${t.amount.toFixed(2)} ${selectedAccountCurrency}` : '',
      Balance: `${t.runningBalance?.toFixed(2) || '0.00'} ${selectedAccountCurrency}`,
    }));
  }, [filteredTransactions, selectedAccountCurrency]);

  const handleViewTransactions = useCallback((id: number) => {
    setIsTransactionsModalOpen(true);
    setTransactionsCurrentPage(1);
    setStartDateFilter('');
    setEndDateFilter('');
  }, []);

  const handleTransactionsModalClose = useCallback(() => {
    setIsTransactionsModalOpen(false);
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