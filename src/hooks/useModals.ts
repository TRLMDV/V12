"use client";

import { useState, useCallback } from 'react';
import { toast as sonnerToast } from 'sonner';
import { t } from '@/utils/i18n';

interface ConfirmationModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  actionLabel?: string; // New: Optional label for the action button
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

  const showConfirmationModal = useCallback((title: string, message: string, onConfirm: () => void, actionLabel?: string) => {
    console.log("useModals: showConfirmationModal called. Title:", title, "Action Label:", actionLabel);
    setConfirmationModalProps({ title, message, onConfirm, actionLabel });
    setIsConfirmationModalOpen(true);
  }, []);

  const closeConfirmationModal = useCallback(() => {
    console.log("useModals: closeConfirmationModal called.");
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