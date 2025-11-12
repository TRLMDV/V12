"use client";

import { useState, useCallback } from 'react';
import { toast as sonnerToast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation'; // Updated import

interface ConfirmationModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
}

export function useModals() {
  const { t } = useTranslation(); // Use the new hook
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [confirmationModalProps, setConfirmationModalProps] = useState<ConfirmationModalProps | null>(null);

  const showAlertModal = useCallback((title: string, message: string) => {
    sonnerToast.info(message, {
      duration: 5000,
      action: {
        label: t('ok'), // Use translation for OK button
        onClick: () => sonnerToast.dismiss(),
      },
      description: title,
    });
  }, [t]); // Add t as dependency

  const showConfirmationModal = useCallback((title: string, message: string, onConfirm: () => void) => {
    setConfirmationModalProps({ title, message, onConfirm });
    setIsConfirmationModalOpen(true);
  }, []);

  const closeConfirmationModal = useCallback(() => {
    setIsConfirmationModalOpen(false);
    setConfirmationModalProps(null);
  }, []);

  return {
    showAlertModal,
    showConfirmationModal,
    isConfirmationModalOpen,
    confirmationModalProps,
    closeConfirmationModal,
  };
}