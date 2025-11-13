"use client";

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { MOCK_CURRENT_DATE } from '@/data/initialData'; // Corrected import

interface UseEraseAllDataProps {
  showConfirmationModal: (title: string, message: string, onConfirm: () => void) => void;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

export const useEraseAllData = ({ showConfirmationModal, t }: UseEraseAllDataProps) => {
  const [isCodeConfirmationModalOpen, setIsCodeConfirmationModalOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  const performEraseAllData = useCallback(() => {
    // Clear all local storage items used by the app
    localStorage.removeItem('products');
    localStorage.removeItem('suppliers');
    localStorage.removeItem('customers');
    localStorage.removeItem('warehouses');
    localStorage.removeItem('purchaseOrders');
    localStorage.removeItem('sellOrders');
    localStorage.removeItem('incomingPayments');
    localStorage.removeItem('outgoingPayments');
    localStorage.removeItem('productMovements');
    localStorage.removeItem('settings');
    localStorage.removeItem('currencyRates');
    localStorage.removeItem('nextIds');
    localStorage.removeItem('initialized'); // Reset initialization flag
    localStorage.removeItem('recycleBin'); // Clear recycle bin

    toast.success(t('success'), { description: t('allDataErased') });
    setTimeout(() => window.location.reload(), 1000); // Reload to re-initialize with default data
  }, [t]);

  const generateRandomCode = useCallback(() => {
    return Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit random number
  }, []);

  const handleCodeConfirmation = useCallback((enteredCode: string) => {
    if (enteredCode === generatedCode) {
      performEraseAllData();
    } else {
      // This case should ideally be caught by CodeConfirmationModal itself,
      // but added here as a fallback.
      toast.error(t('codeMismatchError'), { description: t('pleaseEnterCorrectCode') });
    }
    setIsCodeConfirmationModalOpen(false);
  }, [generatedCode, performEraseAllData, t]);

  const handleEraseAllData = useCallback(() => {
    showConfirmationModal(
      t('eraseAllData'),
      t('eraseAllDataWarning'),
      () => {
        const code = generateRandomCode();
        setGeneratedCode(code);
        setIsCodeConfirmationModalOpen(true);
      }
    );
  }, [showConfirmationModal, generateRandomCode, t]);

  return {
    isCodeConfirmationModalOpen,
    setIsCodeConfirmationModalOpen,
    generatedCode,
    handleCodeConfirmation,
    handleEraseAllData,
  };
};