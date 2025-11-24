"use client";

import { useCallback } from 'react';
import { useData } from '@/context/DataContext';
import { MOCK_CURRENT_DATE } from '@/data/initialData'; // Corrected import
import { Payment, SellOrder, PurchaseOrder, Currency } from '@/types';
import { t } from '@/utils/i18n';

interface UsePaymentFormActionsProps {
  payment: Partial<Payment>;
  paymentId?: number;
  type: 'incoming' | 'outgoing';
  selectedBankAccountId?: number;
  selectedPaymentCurrency: Currency;
  manualExchangeRate?: number;
  currentPaymentExchangeRate: number;
  selectedOrderIdentifier: string;
  selectedManualCategory: string;
  ordersWithBalance: {
    id: number;
    display: string;
    remainingAmount: number;
    category: Payment['paymentCategory'];
    orderType: 'sell' | 'purchase';
    currency: Currency;
    orderDate: string;
  }[];
  paymentsByOrderAndCategoryAZN: {
    [orderId: number]: {
      products: number;
      fees: number; // Renamed from transportationFees, customFees, additionalFees
    };
  };
  sellOrderMap: { [key: number]: SellOrder };
  purchaseOrderMap: { [key: number]: PurchaseOrder };
  currencyRates: { [key: string]: number };
  onSuccess: () => void;
}

export const usePaymentFormActions = ({
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
}: UsePaymentFormActionsProps) => {
  const { saveItem, showAlertModal } = useData();
  const isIncoming = type === 'incoming';
  const isEdit = paymentId !== undefined;

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBankAccountId) {
      showAlertModal('Validation Error', t('selectBankAccount'));
      return;
    }

    if (payment.amount === undefined || payment.amount <= 0) {
      showAlertModal('Error', 'Please enter a valid positive amount.');
      return;
    }

    if (selectedPaymentCurrency !== 'AZN' && (!manualExchangeRate || manualExchangeRate <= 0)) {
      showAlertModal('Validation Error', 'Please enter a valid exchange rate for the selected payment currency.');
      return;
    }

    const amountInAZN = payment.amount * currentPaymentExchangeRate;

    const paymentToSave: Payment = {
      ...payment,
      id: payment.id || 0,
      orderId: payment.orderId || 0,
      bankAccountId: selectedBankAccountId, // Ensure bankAccountId is set
      date: payment.date || MOCK_CURRENT_DATE.toISOString().slice(0, 10),
      amount: payment.amount,
      paymentCurrency: selectedPaymentCurrency,
      paymentExchangeRate: selectedPaymentCurrency === 'AZN' ? undefined : currentPaymentExchangeRate,
      method: payment.method || '',
    };

    if (selectedOrderIdentifier === '0') {
      paymentToSave.orderId = 0;
      paymentToSave.paymentCategory = selectedManualCategory === "none-selected" ? undefined : selectedManualCategory;
      // Manual description is required unless the category is 'initialCapital'
      if (!paymentToSave.manualDescription?.trim() && paymentToSave.paymentCategory !== 'initialCapital') {
        showAlertModal('Error', 'Manual Expense requires a description.');
        return;
      }
    } else {
      const [orderIdStr, category] = selectedOrderIdentifier.split('-');
      paymentToSave.orderId = parseInt(orderIdStr);
      paymentToSave.paymentCategory = category as Payment['paymentCategory'];
      delete paymentToSave.manualDescription;

      const selectedOrderOption = ordersWithBalance.find(o =>
        `${o.id}-${o.category}` === selectedOrderIdentifier && o.orderType === (isIncoming ? 'sell' : 'purchase')
      );

      if (selectedOrderOption) {
        let totalCategoryValueAZN = 0;
        const order = (isIncoming ? sellOrderMap : purchaseOrderMap)[selectedOrderOption.id];
        if (order) {
          if (selectedOrderOption.category === 'products') {
            if (isIncoming) {
              totalCategoryValueAZN = (order as SellOrder).total;
            } else {
              const productsSubtotalNative = (order as PurchaseOrder).items?.reduce((sum, item) => sum + (item.qty * item.price), 0) || 0;
              totalCategoryValueAZN = productsSubtotalNative * ((order as PurchaseOrder).currency === 'AZN' ? 1 : ((order as PurchaseOrder).exchangeRate || currencyRates[(order as PurchaseOrder).currency] || 1));
            }
          } else if (selectedOrderOption.category === 'fees') { // Only one fees category now
            totalCategoryValueAZN = (order as PurchaseOrder).fees * ((order as PurchaseOrder).feesCurrency === 'AZN' ? 1 : currencyRates[(order as PurchaseOrder).feesCurrency] || 1);
          }
        }

        const currentOrderPayments = paymentsByOrderAndCategoryAZN[selectedOrderOption.id] || { products: 0, fees: 0 }; // Updated categories
        let adjustedPaymentsAZN = { ...currentOrderPayments };
        if (isEdit && paymentId === paymentToSave.id && paymentToSave.paymentCategory !== 'manual') {
          const existingPaymentAmountInAZN = (payment.amount || 0) * (payment.paymentCurrency === 'AZN' ? 1 : (payment.paymentExchangeRate || currencyRates[payment.paymentCurrency || 'AZN'] || 1));
          adjustedPaymentsAZN[paymentToSave.paymentCategory as keyof typeof adjustedPaymentsAZN] -= existingPaymentAmountInAZN;
        }

        const currentPaymentsForCategoryAZN = adjustedPaymentsAZN[selectedOrderOption.category as keyof typeof adjustedPaymentsAZN] || 0;
        const remainingAmountForCategoryAZN = totalCategoryValueAZN - currentPaymentsForCategoryAZN;

        if (amountInAZN > remainingAmountForCategoryAZN + 0.001) {
          showAlertModal('Error', `Payment amount (${amountInAZN.toFixed(2)} AZN) exceeds the remaining balance for this category. Remaining: ${remainingAmountForCategoryAZN.toFixed(2)} AZN.`);
          return;
        }
      }
    }

    saveItem(isIncoming ? 'incomingPayments' : 'outgoingPayments', paymentToSave);
    onSuccess();
  }, [
    payment, paymentId, type, selectedBankAccountId, selectedPaymentCurrency, manualExchangeRate,
    currentPaymentExchangeRate, selectedOrderIdentifier, selectedManualCategory, ordersWithBalance,
    paymentsByOrderAndCategoryAZN, sellOrderMap, purchaseOrderMap, currencyRates, onSuccess,
    saveItem, showAlertModal, isIncoming, isEdit,
  ]);

  return {
    handleSubmit,
  };
};