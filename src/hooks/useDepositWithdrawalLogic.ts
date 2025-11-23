"use client";

import { useState, useCallback } from 'react';

export function useDepositWithdrawalLogic() {
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);

  const handleDeposit = useCallback(() => {
    setIsDepositModalOpen(true);
  }, []);

  const handleWithdrawal = useCallback(() => {
    setIsWithdrawalModalOpen(true);
  }, []);

  const handleDepositWithdrawalModalClose = useCallback(() => {
    setIsDepositModalOpen(false);
    setIsWithdrawalModalOpen(false);
  }, []);

  return {
    isDepositModalOpen,
    isWithdrawalModalOpen,
    handleDeposit,
    handleWithdrawal,
    handleDepositWithdrawalModalClose,
  };
}