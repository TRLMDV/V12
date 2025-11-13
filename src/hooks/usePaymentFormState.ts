"use client";

import { useState, useEffect, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { MOCK_CURRENT_DATE } from '@/data/initialData'; // Corrected import
import { Payment, Currency, BankAccount } from '@/types';

interface UsePaymentFormStateProps {
  paymentId?: number;
  type: 'incoming' | 'outgoing';
  initialManualCategory?: string;
}

export const usePaymentFormState = ({ paymentId, type, initialManualCategory }: UsePaymentFormStateProps) => {
  const { incomingPayments, outgoingPayments, bankAccounts, currencyRates, settings } = useData();

  const isIncoming = type === 'incoming';
  const isEdit = paymentId !== undefined;
  const allPayments = isIncoming ? incomingPayments : outgoingPayments;

  const [payment, setPayment] = useState<Partial<Payment>>({});
  const [selectedPaymentCurrency, setSelectedPaymentCurrency] = useState<Currency>('AZN');
  const [manualExchangeRateInput, setManualExchangeRateInput] = useState<string>('');
  const [manualExchangeRate, setManualExchangeRate] = useState<number | undefined>(undefined);
  const [selectedOrderIdentifier, setSelectedOrderIdentifier] = useState<string>('0'); // '0' for manual, 'orderId-category' for linked
  const [selectedManualCategory, setSelectedManualCategory] = useState<string>('none-selected');
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (isEdit) {
      const existingPayment = allPayments.find(p => p.id === paymentId);
      if (existingPayment) {
        setPayment(existingPayment);
        setSelectedPaymentCurrency(existingPayment.paymentCurrency || 'AZN');
        if (existingPayment.paymentCurrency !== 'AZN') {
          setManualExchangeRate(existingPayment.paymentExchangeRate);
          setManualExchangeRateInput(String(existingPayment.paymentExchangeRate || ''));
        } else {
          setManualExchangeRate(undefined);
          setManualExchangeRateInput('');
        }

        if (existingPayment.orderId === 0) {
          setSelectedOrderIdentifier('0');
          setSelectedManualCategory(existingPayment.paymentCategory === 'manual' || !existingPayment.paymentCategory ? 'none-selected' : existingPayment.paymentCategory);
        } else {
          const category = existingPayment.paymentCategory || 'products';
          setSelectedOrderIdentifier(`${existingPayment.orderId}-${category}`);
          setSelectedManualCategory('none-selected');
        }
        setSelectedBankAccountId(existingPayment.bankAccountId);
      }
    } else {
      // For new payments, apply initialManualCategory if provided
      const defaultCategory = initialManualCategory || 'manual';
      const defaultDescription = defaultCategory === 'initialCapital' ? t('initialCapital') : ''; // Pre-fill for initialCapital

      setPayment({
        date: MOCK_CURRENT_DATE.toISOString().slice(0, 10),
        amount: 0,
        method: '',
        orderId: 0, // Default to manual
        paymentCategory: defaultCategory,
        manualDescription: defaultDescription,
        paymentCurrency: 'AZN',
        bankAccountId: bankAccounts.length > 0 ? bankAccounts[0].id : undefined,
      });
      setSelectedPaymentCurrency('AZN');
      setManualExchangeRate(undefined);
      setManualExchangeRateInput('');
      setSelectedOrderIdentifier('0'); // Always '0' for manual payments
      setSelectedManualCategory(defaultCategory);
      setSelectedBankAccountId(bankAccounts.length > 0 ? bankAccounts[0].id : undefined);
    }
  }, [paymentId, isEdit, allPayments, currencyRates, initialManualCategory, bankAccounts, isIncoming, t]);

  return {
    payment,
    setPayment,
    selectedPaymentCurrency,
    setSelectedPaymentCurrency,
    manualExchangeRateInput,
    setManualExchangeRateInput,
    manualExchangeRate,
    setManualExchangeRate,
    selectedOrderIdentifier,
    setSelectedOrderIdentifier,
    selectedManualCategory,
    setSelectedManualCategory,
    selectedBankAccountId,
    setSelectedBankAccountId,
    isIncoming,
    isEdit,
    allPayments, // Pass for calculations
    bankAccounts, // Pass for dropdown
    settings, // Pass for categories and active currencies
  };
};