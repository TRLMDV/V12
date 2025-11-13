"use client";

import { useCallback } from 'react';
import { useData } from '@/context/DataContext';
import { MOCK_CURRENT_DATE } from '@/data/initialData'; // Corrected import
import { Payment, Currency } from '@/types';

interface UsePaymentFormHandlersProps {
  setPayment: React.Dispatch<React.SetStateAction<Partial<Payment>>>;
  setSelectedPaymentCurrency: React.Dispatch<React.SetStateAction<Currency>>;
  setManualExchangeRateInput: React.Dispatch<React.SetStateAction<string>>;
  setManualExchangeRate: React.Dispatch<React.SetStateAction<number | undefined>>;
  setSelectedOrderIdentifier: React.Dispatch<React.SetStateAction<string>>;
  setSelectedManualCategory: React.Dispatch<React.SetStateAction<string>>;
  setSelectedBankAccountId: React.Dispatch<React.SetStateAction<number | undefined>>;
  currencyRates: { [key: string]: number };
  ordersWithBalance: {
    id: number;
    display: string;
    remainingAmount: number;
    category: Payment['paymentCategory'];
    orderType: 'sell' | 'purchase';
    currency: Currency;
    orderDate: string;
  }[];
  bankAccounts: { id: number; name: string; currency: Currency; initialBalance: number }[];
  settingsPaymentCategories: { id: number; name: string }[];
}

export const usePaymentFormHandlers = ({
  setPayment,
  setSelectedPaymentCurrency,
  setManualExchangeRateInput,
  setManualExchangeRate,
  setSelectedOrderIdentifier,
  setSelectedManualCategory,
  setSelectedBankAccountId,
  currencyRates,
  ordersWithBalance,
  bankAccounts,
  settingsPaymentCategories,
}: UsePaymentFormHandlersProps) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setPayment(prev => ({ ...prev, [id]: id === 'amount' ? parseFloat(value) || 0 : value }));
  }, [setPayment]);

  const handlePaymentCurrencyChange = useCallback((value: Currency) => {
    setSelectedPaymentCurrency(value);
    if (value === 'AZN') {
      setManualExchangeRate(undefined);
      setManualExchangeRateInput('');
    } else {
      const defaultRate = currencyRates[value];
      setManualExchangeRate(defaultRate);
      setManualExchangeRateInput(String(defaultRate));
    }
  }, [setSelectedPaymentCurrency, setManualExchangeRate, setManualExchangeRateInput, currencyRates]);

  const handleExchangeRateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue === '' || /^-?\d*\.?\d*$/.test(inputValue)) {
      setManualExchangeRateInput(inputValue);
      const parsedValue = parseFloat(inputValue);
      setManualExchangeRate(isNaN(parsedValue) ? undefined : parsedValue);
    }
  }, [setManualExchangeRate, setManualExchangeRateInput]);

  const handleOrderIdentifierChange = useCallback((value: string) => {
    setSelectedOrderIdentifier(value);
    if (value === '0') {
      setPayment(prev => ({
        ...prev,
        orderId: 0,
        paymentCategory: 'manual', // Default to manual when unlinking
        manualDescription: prev?.manualDescription || '',
        date: MOCK_CURRENT_DATE.toISOString().slice(0, 10),
        amount: 0,
        paymentCurrency: 'AZN',
        paymentExchangeRate: undefined,
      }));
      setSelectedPaymentCurrency('AZN');
      setManualExchangeRate(undefined);
      setManualExchangeRateInput('');
      setSelectedManualCategory('none-selected');
    } else {
      const [orderIdStr, category] = value.split('-');
      const selectedOrderOption = ordersWithBalance.find(o => `${o.id}-${o.category}` === value);
      
      if (selectedOrderOption) {
        setPayment(prev => ({
          ...prev,
          orderId: parseInt(orderIdStr),
          paymentCategory: category as Payment['paymentCategory'],
          manualDescription: undefined,
          date: selectedOrderOption.orderDate || MOCK_CURRENT_DATE.toISOString().slice(0, 10),
          amount: parseFloat(selectedOrderOption.remainingAmount.toFixed(2)),
          paymentCurrency: selectedOrderOption.currency,
        }));
        setSelectedPaymentCurrency(selectedOrderOption.currency);
        
        if (selectedOrderOption.currency !== 'AZN') {
          const rate = currencyRates[selectedOrderOption.currency];
          setManualExchangeRate(rate);
          setManualExchangeRateInput(String(rate));
        } else {
          setManualExchangeRate(undefined);
          setManualExchangeRateInput('');
        }
        setSelectedManualCategory('none-selected');
      }
    }
  }, [setPayment, setSelectedOrderIdentifier, setSelectedPaymentCurrency, setManualExchangeRate, setManualExchangeRateInput, setSelectedManualCategory, ordersWithBalance, currencyRates]);

  const handleManualCategoryChange = useCallback((value: string) => {
    setSelectedManualCategory(value);
    setPayment(prev => ({ ...prev, paymentCategory: value === "none-selected" ? undefined : value }));
  }, [setPayment, setSelectedManualCategory]);

  const handleBankAccountChange = useCallback((value: string) => {
    const accountId = parseInt(value);
    setSelectedBankAccountId(accountId);
    setPayment(prev => ({ ...prev, bankAccountId: accountId }));
  }, [setPayment, setSelectedBankAccountId]);

  return {
    handleChange,
    handlePaymentCurrencyChange,
    handleExchangeRateChange,
    handleOrderIdentifierChange,
    handleManualCategoryChange,
    handleBankAccountChange,
  };
};