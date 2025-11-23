"use client";

import { useState, useMemo, useCallback } from 'react';
import { useData } from '@/context/DataContext';
import { BankAccount } from '@/types';
import { t } from '@/utils/i18n';

export function useBankAccountsLogic() {
  const {
    bankAccounts,
    incomingPayments,
    outgoingPayments,
    deleteItem,
    showAlertModal,
    showConfirmationModal,
    runningBalancesMap,
  } = useData();

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingBankAccountId, setEditingBankAccountId] = useState<number | undefined>(undefined);

  // Map bank accounts for easy lookup
  const bankAccountMap = useMemo(() => {
    return bankAccounts.reduce((acc, account) => ({ ...acc, [account.id]: account }), {} as { [key: number]: BankAccount });
  }, [bankAccounts]);

  const handleAddAccount = useCallback(() => {
    setEditingBankAccountId(undefined);
    setIsAccountModalOpen(true);
  }, []);

  const handleEditAccount = useCallback((id: number) => {
    setEditingBankAccountId(id);
    setIsAccountModalOpen(true);
  }, []);

  const handleDeleteAccount = useCallback((id: number) => {
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
      },
      t('yes')
    );
  }, [bankAccounts, incomingPayments, outgoingPayments, showAlertModal, showConfirmationModal, deleteItem]);

  const handleAccountModalClose = useCallback(() => {
    setIsAccountModalOpen(false);
    setEditingBankAccountId(undefined);
  }, []);

  return {
    bankAccounts,
    bankAccountMap,
    runningBalancesMap,
    incomingPayments, // Needed for current balance calculation in table
    isAccountModalOpen,
    editingBankAccountId,
    handleAddAccount,
    handleEditAccount,
    handleDeleteAccount,
    handleAccountModalClose,
  };
}