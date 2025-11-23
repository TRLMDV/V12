"use client";

import React from 'react';
import FormModal from '@/components/FormModal';
import PaymentForm from '@/forms/PaymentForm';
import { t } from '@/utils/i18n';

interface DepositWithdrawalModalsProps {
  isDepositModalOpen: boolean;
  isWithdrawalModalOpen: boolean;
  onClose: () => void;
}

const DepositWithdrawalModals: React.FC<DepositWithdrawalModalsProps> = ({
  isDepositModalOpen,
  isWithdrawalModalOpen,
  onClose,
}) => {
  return (
    <>
      {/* Deposit Money Modal */}
      <FormModal
        isOpen={isDepositModalOpen}
        onClose={onClose}
        title={t('depositMoney')}
      >
        <PaymentForm
          type="incoming"
          onSuccess={onClose}
          initialManualCategory="initialCapital"
        />
      </FormModal>

      {/* Withdraw Money Modal */}
      <FormModal
        isOpen={isWithdrawalModalOpen}
        onClose={onClose}
        title={t('withdrawMoney')}
      >
        <PaymentForm
          type="outgoing"
          onSuccess={onClose}
          initialManualCategory="Withdrawal"
        />
      </FormModal>
    </>
  );
};

export default DepositWithdrawalModals;