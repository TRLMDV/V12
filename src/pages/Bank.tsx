"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { useData } from '@/context/DataContext';
import { MOCK_CURRENT_DATE } from '@/data/initialData'; // Corrected import
import { t } from '@/utils/i18n';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Eye, Edit, Trash2, DollarSign, MinusCircle } from 'lucide-react'; // Added DollarSign and MinusCircle
import FormModal from '@/components/FormModal';
import BankAccountForm from '@/forms/BankAccountForm'; // New: BankAccountForm
import PaymentForm from '@/forms/PaymentForm';
import { Payment, Currency, BankAccount } from '@/types';
import { format } from 'date-fns';

interface Transaction {
  id: string; // Unique ID for transaction (payment.id + type)
  date: string;
  description: string;
  amount: number; // Always in the account's currency
  type: 'incoming' | 'outgoing' | 'initial'; // Added 'initial' type
  originalPaymentId: number; // Link to the actual payment if applicable
  originalPaymentCurrency: Currency; // Added original currency
  originalPaymentAmount: number; // Added original amount
  runningBalance?: number; // New: Running balance after this transaction
}

const Bank: React.FC = () => {
  const {
    incomingPayments,
    outgoingPayments,
    bankAccounts, // New: Get bank accounts
    setBankAccounts, // New: Set bank accounts
    settings,
    saveItem,
    deleteItem, // New: Delete bank account
    getNextId,
    convertCurrency,
    showAlertModal,
    showConfirmationModal, // New: For deleting bank accounts
  } = useData();
  const mainCurrency = settings.mainCurrency;

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingBankAccountId, setEditingBankAccountId] = useState<number | undefined>(undefined);
  const [isTransactionsModalOpen, setIsTransactionsModalOpen] = useState(false);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<number | undefined>(undefined);
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');

  // New states for deposit/withdrawal modals
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);

  // Map bank accounts for easy lookup
  const bankAccountMap = useMemo(() => {
    return bankAccounts.reduce((acc, account) => ({ ...acc, [account.id]: account }), {} as { [key: number]: BankAccount });
  }, [bankAccounts]);

  // Calculate current balance for each bank account
  const bankAccountsWithBalances = useMemo(() => {
    return bankAccounts.map(account => {
      let currentBalance = account.initialBalance;

      incomingPayments.forEach(p => {
        if (p.bankAccountId === account.id) {
          const amountInAccountCurrency = convertCurrency(p.amount, p.paymentCurrency, account.currency);
          currentBalance += amountInAccountCurrency;
        }
      });

      outgoingPayments.forEach(p => {
        if (p.bankAccountId === account.id) {
          const amountInAccountCurrency = convertCurrency(p.amount, p.paymentCurrency, account.currency);
          currentBalance -= amountInAccountCurrency;
        }
      });

      return { ...account, currentBalance };
    });
  }, [bankAccounts, incomingPayments, outgoingPayments, convertCurrency]);

  // Aggregate all transactions for a specific bank account with running balance
  const allTransactionsForSelectedAccount = useMemo(() => {
    const transactions: Omit<Transaction, 'runningBalance'>[] = [];
    const selectedAccount = bankAccountMap[selectedBankAccountId as number];

    if (!selectedAccount) return [];

    // Add initial balance as a transaction
    transactions.push({
      id: `initial-${selectedAccount.id}`,
      date: format(new Date(0), 'yyyy-MM-dd'), // Use epoch for initial balance date
      description: t('initialBalance'),
      amount: selectedAccount.initialBalance,
      type: 'initial',
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
          originalPaymentId: p.id,
          originalPaymentCurrency: p.paymentCurrency,
          originalPaymentAmount: p.amount,
        });
      }
    });

    // Sort all transactions by date, then by type (initial first, then incoming, then outgoing)
    transactions.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();

      if (dateA !== dateB) {
        return dateA - dateB;
      }

      // If dates are the same, sort 'initial' first, then 'incoming', then 'outgoing'
      const typeOrder = { 'initial': 0, 'incoming': 1, 'outgoing': 2 };
      return typeOrder[a.type] - typeOrder[b.type];
    });

    let currentRunningBalance = 0;
    const transactionsWithRunningBalance: Transaction[] = [];

    transactions.forEach(t => {
      if (t.type === 'initial') {
        currentRunningBalance = t.amount;
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

  const handleAddAccount = () => {
    setEditingBankAccountId(undefined);
    setIsAccountModalOpen(true);
  };

  const handleEditAccount = (id: number) => {
    setEditingBankAccountId(id);
    setIsAccountModalOpen(true);
  };

  const handleDeleteAccount = (id: number) => {
    const accountToDelete = bankAccounts.find(acc => acc.id === id);
    if (!accountToDelete) return;

    const hasPayments = incomingPayments.some(p => p.bankAccountId === id) || outgoingPayments.some(p => p.bankAccountId === id);
    if (hasPayments) {
      showAlertModal(t('deletionFailed'), t('cannotDeleteBankAccountWithPayments'));
      return;
    }

    showConfirmationModal(
      t('deleteBankAccount'),
      t('deleteBankAccountWarning', { accountName: accountToDelete.name }),
      () => {
        deleteItem('bankAccounts', id);
      }
    );
  };

  const handleAccountModalClose = () => {
    setIsAccountModalOpen(false);
    setEditingBankAccountId(undefined);
  };

  const handleViewTransactions = (id: number) => {
    setSelectedBankAccountId(id);
    setIsTransactionsModalOpen(true);
  };

  const handleTransactionsModalClose = () => {
    setIsTransactionsModalOpen(false);
    setSelectedBankAccountId(undefined);
    setStartDateFilter('');
    setEndDateFilter('');
  };

  const handleDeposit = () => {
    setIsDepositModalOpen(true);
  };

  const handleWithdrawal = () => {
    setIsWithdrawalModalOpen(true);
  };

  const handleDepositWithdrawalModalClose = () => {
    setIsDepositModalOpen(false);
    setIsWithdrawalModalOpen(false);
  };

  const currentAccountBalanceInModal = useMemo(() => {
    if (!selectedBankAccountId) return 0;
    const account = bankAccountsWithBalances.find(acc => acc.id === selectedBankAccountId);
    return account ? account.currentBalance : 0;
  }, [selectedBankAccountId, bankAccountsWithBalances]);

  const selectedAccountCurrency = useMemo(() => {
    if (!selectedBankAccountId) return mainCurrency;
    const account = bankAccountMap[selectedBankAccountId];
    return account ? account.currency : mainCurrency;
  }, [selectedBankAccountId, bankAccountMap, mainCurrency]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-200">{t('bankAccounts')}</h1>
        <div className="flex space-x-2">
          <Button onClick={handleDeposit} variant="secondary">
            <DollarSign className="w-4 h-4 mr-2" />
            {t('depositMoney')}
          </Button>
          <Button onClick={handleWithdrawal} variant="secondary">
            <MinusCircle className="w-4 h-4 mr-2" />
            {t('withdrawMoney')}
          </Button>
          <Button onClick={handleAddAccount}>
            <PlusCircle className="w-4 h-4 mr-2" />
            {t('addBankAccount')}
          </Button>
        </div>
      </div>

      {bankAccountsWithBalances.length === 0 && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-800 dark:text-blue-200">
          <p className="font-medium">{t('noBankAccountsFound')}</p>
          <p>{t('pleaseAddBankAccountInstruction')}</p>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md overflow-x-auto mb-6">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4">{t('yourBankAccounts')}</h2>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100 dark:bg-slate-700">
              <TableHead className="p-3">{t('accountName')}</TableHead>
              <TableHead className="p-3">{t('currency')}</TableHead>
              <TableHead className="p-3 text-right">{t('currentBalance')}</TableHead>
              <TableHead className="p-3 text-right">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bankAccountsWithBalances.length > 0 ? (
              bankAccountsWithBalances.map(account => (
                <TableRow key={account.id} className="border-b dark:border-slate-700 text-gray-800 dark:text-slate-300">
                  <TableCell className="p-3 font-semibold">{account.name}</TableCell>
                  <TableCell className="p-3">{account.currency}</TableCell>
                  <TableCell className={`p-3 text-right font-bold ${account.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {account.currentBalance.toFixed(2)} {account.currency}
                  </TableCell>
                  <TableCell className="p-3 text-right">
                    <Button variant="link" onClick={() => handleViewTransactions(account.id)} className="mr-2 p-0 h-auto">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="link" onClick={() => handleEditAccount(account.id)} className="mr-2 p-0 h-auto">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="link" onClick={() => handleDeleteAccount(account.id)} className="text-red-500 p-0 h-auto">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="p-4 text-center text-gray-500 dark:text-slate-400">
                  {t('noBankAccountsFound')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Bank Account Modal */}
      <FormModal
        isOpen={isAccountModalOpen}
        onClose={handleAccountModalClose}
        title={editingBankAccountId ? t('editBankAccount') : t('addBankAccount')}
      >
        <BankAccountForm
          bankAccountId={editingBankAccountId}
          onSuccess={handleAccountModalClose}
          onCancel={handleAccountModalClose}
        />
      </FormModal>

      {/* Deposit Money Modal */}
      <FormModal
        isOpen={isDepositModalOpen}
        onClose={handleDepositWithdrawalModalClose}
        title={t('depositMoney')}
      >
        <PaymentForm
          type="incoming"
          onSuccess={handleDepositWithdrawalModalClose}
          initialManualCategory="initialCapital"
        />
      </FormModal>

      {/* Withdraw Money Modal */}
      <FormModal
        isOpen={isWithdrawalModalOpen}
        onClose={handleDepositWithdrawalModalClose}
        title={t('withdrawMoney')}
      >
        <PaymentForm
          type="outgoing"
          onSuccess={handleDepositWithdrawalModalClose}
          initialManualCategory="Withdrawal"
        />
      </FormModal>

      {/* Transactions History Modal */}
      <FormModal
        isOpen={isTransactionsModalOpen}
        onClose={handleTransactionsModalClose}
        title={`${t('transactionHistory')} - ${bankAccountMap[selectedBankAccountId as number]?.name || ''} (${selectedAccountCurrency})`}
      >
        <div className="mb-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
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
          </div>
          <div className="text-right mt-4">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300">{t('currentBalance')}</h2>
            <p className={`text-3xl font-bold mt-2 ${currentAccountBalanceInModal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {currentAccountBalanceInModal.toFixed(2)} {selectedAccountCurrency}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md overflow-x-auto">
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
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((t, index) => (
                  <TableRow key={t.id} className="border-b dark:border-slate-700 text-gray-800 dark:text-slate-300">
                    <TableCell className="p-3">{format(new Date(t.date), 'yyyy-MM-dd')}</TableCell>
                    <TableCell className="p-3">{t.description}</TableCell>
                    <TableCell className="p-3 text-right text-green-600">
                      {(t.type === 'incoming' || t.type === 'initial') ? t.amount.toFixed(2) : '-'} {((t.type === 'incoming' || t.type === 'initial') && t.amount > 0) ? selectedAccountCurrency : ''}
                    </TableCell>
                    <TableCell className="p-3 text-right text-red-600">
                      {t.type === 'outgoing' ? t.amount.toFixed(2) : '-'} {((t.type === 'outgoing') && t.amount > 0) ? selectedAccountCurrency : ''}
                    </TableCell>
                    <TableCell className={`p-3 text-right font-bold ${t.runningBalance && t.runningBalance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {t.runningBalance?.toFixed(2) || '0.00'} {selectedAccountCurrency}
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
      </FormModal>
    </div>
  );
};

export default Bank;