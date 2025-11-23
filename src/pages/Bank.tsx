"use client";

import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { t } from '@/utils/i18n';
import { Button } from '@/components/ui/button';
import FormModal from '@/components/FormModal';
import BankAccountForm from '@/forms/BankAccountForm';
import { PlusCircle, DollarSign, MinusCircle } from 'lucide-react';

// New modular components and hooks
import { useBankAccountsLogic } from '@/hooks/useBankAccountsLogic';
import { useBankTransactionsLogic } from '@/hooks/useBankTransactionsLogic';
import { useDepositWithdrawalLogic } from '@/hooks/useDepositWithdrawalLogic';
import BankAccountsTable from '@/components/bank/BankAccountsTable';
import TransactionHistoryModal from '@/components/bank/TransactionHistoryModal';
import DepositWithdrawalModals from '@/components/bank/DepositWithdrawalModals';

const Bank: React.FC = () => {
  const { settings, convertCurrency, incomingPayments, outgoingPayments, runningBalancesMap } = useData();
  const mainCurrency = settings.mainCurrency;

  // State for the currently selected bank account for transaction history
  const [selectedBankAccountIdForTransactions, setSelectedBankAccountIdForTransactions] = useState<number | undefined>(undefined);

  // Logic for managing the list of bank accounts
  const {
    bankAccounts,
    bankAccountMap,
    isAccountModalOpen,
    editingBankAccountId,
    handleAddAccount,
    handleEditAccount,
    handleDeleteAccount,
    handleAccountModalClose,
  } = useBankAccountsLogic();

  // Logic for managing deposit and withdrawal modals
  const {
    isDepositModalOpen,
    isWithdrawalModalOpen,
    handleDeposit,
    handleWithdrawal,
    handleDepositWithdrawalModalClose,
  } = useDepositWithdrawalLogic();

  // Logic for managing transaction history modal and its data
  const {
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
    totalTransactions,
    handleTransactionsModalClose,
    handleViewTransactions: handleViewTransactionsLogic, // Renamed to avoid conflict
  } = useBankTransactionsLogic(
    selectedBankAccountIdForTransactions,
    bankAccountMap,
    incomingPayments,
    outgoingPayments,
    convertCurrency,
    runningBalancesMap,
    mainCurrency,
  );

  // Handler to open transaction history modal and set the selected account
  const handleViewTransactions = (id: number) => {
    setSelectedBankAccountIdForTransactions(id);
    handleViewTransactionsLogic(id); // Call the function from the hook to open the modal
  };

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

      {bankAccounts.length === 0 && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-800 dark:text-blue-200">
          <p className="font-medium">{t('noBankAccountsFound')}</p>
          <p>{t('pleaseAddBankAccountInstruction')}</p>
        </div>
      )}

      <BankAccountsTable
        bankAccounts={bankAccounts}
        runningBalancesMap={runningBalancesMap}
        incomingPayments={incomingPayments}
        handleViewTransactions={handleViewTransactions}
        handleEditAccount={handleEditAccount}
        handleDeleteAccount={handleDeleteAccount}
      />

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

      {/* Deposit and Withdrawal Modals */}
      <DepositWithdrawalModals
        isDepositModalOpen={isDepositModalOpen}
        isWithdrawalModalOpen={isWithdrawalModalOpen}
        onClose={handleDepositWithdrawalModalClose}
      />

      {/* Transactions History Modal */}
      {selectedBankAccountIdForTransactions !== undefined && (
        <TransactionHistoryModal
          isOpen={isTransactionsModalOpen}
          onClose={handleTransactionsModalClose}
          selectedAccountName={bankAccountMap[selectedBankAccountIdForTransactions]?.name || ''}
          selectedAccountCurrency={selectedAccountCurrency}
          startDateFilter={startDateFilter}
          setStartDateFilter={setStartDateFilter}
          endDateFilter={endDateFilter}
          setEndDateFilter={setEndDateFilter}
          currentAccountBalance={currentAccountBalanceInModal}
          excelExportData={excelExportData}
          paginatedTransactions={paginatedTransactions}
          totalTransactions={totalTransactions}
          transactionsCurrentPage={transactionsCurrentPage}
          setTransactionsCurrentPage={setTransactionsCurrentPage}
          transactionsItemsPerPage={transactionsItemsPerPage}
        />
      )}
    </div>
  );
};

export default Bank;