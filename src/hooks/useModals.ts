"use client";

import { useState, useCallback } from 'react';
import { toast as sonnerToast } from 'sonner';
import { t } from '@/utils/i18n';

interface ConfirmationModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
}

export function useModals() {
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [confirmationModalProps, setConfirmationModalProps] = useState<ConfirmationModalProps | null>(null);

  const showAlertModal = useCallback((title: string, message: string) => {
    sonnerToast.info(message, {
      duration: 5000,
      action: {
        label: 'OK',
        onClick: () => sonnerToast.dismiss(),
      },
      description: title,
    });
  }, []);

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