"use client";

import React, { useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { t } from '@/utils/i18n';
import { Payment, Currency } from '@/types';

import { usePaymentFormState } from '@/hooks/usePaymentFormState';
import { usePaymentFormCalculations } from '@/hooks/usePaymentFormCalculations';
import { usePaymentFormHandlers } from '@/hooks/usePaymentFormHandlers';
import { usePaymentFormActions } from '@/hooks/usePaymentFormActions';

interface PaymentFormProps {
  paymentId?: number;
  type: 'incoming' | 'outgoing';
  onSuccess: () => void;
  initialManualCategory?: string;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ paymentId, type, onSuccess, initialManualCategory }) => {
  const {
    sellOrders,
    purchaseOrders,
    customers,
    suppliers,
    currencyRates,
  } = useData();

  // 1. State Management
  const {
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
    allPayments,
    bankAccounts,
    settings,
  } = usePaymentFormState({ paymentId, type, initialManualCategory });

  // 2. Calculations
  const customerMap = useMemo(() => customers.reduce((acc, c) => ({ ...acc, [c.id]: c.name }), {} as { [key: number]: string }), [customers]);
  const supplierMap = useMemo(() => suppliers.reduce((acc, s) => ({ ...acc, [s.id]: s.name }), {} as { [key: number]: string }), [suppliers]);

  const {
    currentPaymentExchangeRate,
    ordersWithBalance,
    purchaseOrderMap,
    sellOrderMap,
    paymentsByOrderAndCategoryAZN,
  } = usePaymentFormCalculations({
    isIncoming,
    isEdit,
    payment,
    allPayments,
    selectedPaymentCurrency,
    manualExchangeRate,
    currencyRates,
    sellOrders,
    purchaseOrders,
    customers: customerMap,
    suppliers: supplierMap,
    settings,
  });

  // 3. Handlers
  const {
    handleChange,
    handlePaymentCurrencyChange,
    handleExchangeRateChange,
    handleOrderIdentifierChange,
    handleManualCategoryChange,
    handleBankAccountChange,
  } = usePaymentFormHandlers({
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
    settingsPaymentCategories: settings.paymentCategories || [],
  });

  // 4. Actions
  const {
    handleSubmit,
  } = usePaymentFormActions({
    payment,
    paymentId,
    type,
    selectedBankAccountId,
    selectedPaymentCurrency,
    manualExchangeRate,
    currentPaymentExchangeRate,
    selectedOrderIdentifier,
    selectedManualCategory,
    ordersWithBalance,
    paymentsByOrderAndCategoryAZN,
    sellOrderMap,
    purchaseOrderMap,
    currencyRates,
    onSuccess,
  });

  const isManualExpense = selectedOrderIdentifier === '0';
  const activeCurrencies = settings.activeCurrencies || ['AZN'];

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="bankAccount" className="text-right">
            {t('bankAccount')}
          </Label>
          <Select onValueChange={handleBankAccountChange} value={String(selectedBankAccountId || '')}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder={t('selectBankAccount')} />
            </SelectTrigger>
            <SelectContent>
              {bankAccounts.length > 0 ? (
                bankAccounts.map(acc => (
                  <SelectItem key={acc.id} value={String(acc.id)}>
                    {acc.name} ({acc.currency})
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-accounts" disabled>
                  {t('noBankAccountsAvailable')}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="orderId" className="text-right">
            {t('linkedOrder')} / {t('manualExpense')}
          </Label>
          <Select onValueChange={handleOrderIdentifierChange} value={selectedOrderIdentifier}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder={`-- ${t('manualExpense')} --`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">-- {t('manualExpense')} --</SelectItem>
              {ordersWithBalance.length > 0 ? (
                ordersWithBalance.map(o => (
                  <SelectItem key={`${o.id}-${o.category}`} value={`${o.id}-${o.category}`}>
                    {o.display}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-orders" disabled>
                  {t('noOrdersWithBalance')}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {isManualExpense && (
          <>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="manualDescription" className="text-right">
                {t('description')}
              </Label>
              <Input
                id="manualDescription"
                placeholder="e.g., A4 Paper, Fuel, Coffee, Office Supplies"
                value={payment.manualDescription || ''}
                onChange={handleChange}
                className="col-span-3"
                disabled={selectedManualCategory === 'initialCapital'}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="manualCategory" className="text-right">
                {t('category')}
              </Label>
              <Select onValueChange={handleManualCategoryChange} value={selectedManualCategory || 'none-selected'}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={t('selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none-selected">{t('none')}</SelectItem>
                  {(settings.paymentCategories || []).map(cat => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="date" className="text-right">
            {t('paymentDate')}
          </Label>
          <Input
            id="date"
            type="date"
            value={payment.date || ''}
            onChange={handleChange}
            className="col-span-3"
            required
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="amount" className="text-right">
            {t('amountPaid')}
          </Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={payment.amount || ''}
            onChange={handleChange}
            className="col-span-2"
            required
            min="0.01"
          />
          <Select onValueChange={handlePaymentCurrencyChange} value={selectedPaymentCurrency}>
            <SelectTrigger className="col-span-1">
              <SelectValue placeholder="AZN" />
            </SelectTrigger>
            <SelectContent>
              {activeCurrencies.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedPaymentCurrency !== 'AZN' && (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="exchangeRate" className="text-right">{t('exchangeRateToAZN')}</Label>
            <div className="col-span-3">
              <Input
                id="exchangeRate"
                type="text"
                value={manualExchangeRateInput}
                onChange={handleExchangeRateChange}
                placeholder={t('exchangeRatePlaceholder')}
                className="mb-1"
                required
              />
              <p className="text-xs text-gray-500 dark:text-slate-400">{t('exchangeRateHelpText')}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="method" className="text-right">
            {t('method')}
          </Label>
          <Input
            id="method"
            placeholder={t('paymentMethodPlaceholder')}
            value={payment.method || ''}
            onChange={handleChange}
            className="col-span-3"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit">{t('savePayment')}</Button>
      </div>
    </form>
  );
};

export default PaymentForm;