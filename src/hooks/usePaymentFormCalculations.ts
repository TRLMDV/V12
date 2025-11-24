"use client";

import { useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { Payment, SellOrder, PurchaseOrder, Currency, CurrencyRates, Settings } from '@/types';
import { t } from '@/utils/i18n';

interface UsePaymentFormCalculationsProps {
  isIncoming: boolean;
  isEdit: boolean;
  payment: Partial<Payment>;
  allPayments: Payment[];
  selectedPaymentCurrency: Currency;
  manualExchangeRate?: number;
  currencyRates: CurrencyRates;
  sellOrders: SellOrder[];
  purchaseOrders: PurchaseOrder[];
  customers: { [key: number]: string };
  suppliers: { [key: number]: string };
  settings: Settings;
}

export const usePaymentFormCalculations = ({
  isIncoming,
  isEdit,
  payment,
  allPayments,
  selectedPaymentCurrency,
  manualExchangeRate,
  currencyRates,
  sellOrders,
  purchaseOrders,
  customers,
  suppliers,
  settings,
}: UsePaymentFormCalculationsProps) => {

  const allOrders = isIncoming ? sellOrders : purchaseOrders;

  const purchaseOrderMap = useMemo(() => purchaseOrders.reduce((acc, o) => ({ ...acc, [o.id]: o }), {} as { [key: number]: PurchaseOrder }), [purchaseOrders]);
  const sellOrderMap = useMemo(() => sellOrders.reduce((acc, o) => ({ ...acc, [o.id]: o }), {} as { [key: number]: SellOrder }), [sellOrders]);

  const paymentsByOrderAndCategoryAZN = useMemo(() => {
    const result: {
      [orderId: number]: {
        products: number;
        fees: number; // Renamed from transportationFees, customFees, additionalFees
      };
    } = {};

    allPayments.forEach(p => {
      if (p.orderId !== 0 && p.paymentCategory !== 'manual') {
        if (!result[p.orderId]) {
          result[p.orderId] = { products: 0, fees: 0 };
        }
        const amountInAZN = p.amount * (p.paymentCurrency === 'AZN' ? 1 : (p.paymentExchangeRate || currencyRates[p.paymentCurrency] || 1));
        result[p.orderId][p.paymentCategory as keyof typeof result[number]] += amountInAZN;
      }
    });
    return result;
  }, [allPayments, currencyRates]);

  const currentPaymentExchangeRate = useMemo(() => {
    if (selectedPaymentCurrency === 'AZN') return 1;
    return manualExchangeRate !== undefined ? manualExchangeRate : currencyRates[selectedPaymentCurrency];
  }, [selectedPaymentCurrency, manualExchangeRate, currencyRates]);

  const ordersWithBalance = useMemo(() => {
    const list: {
      id: number;
      display: string;
      remainingAmount: number;
      category: Payment['paymentCategory'];
      orderType: 'sell' | 'purchase';
      currency: Currency;
      orderDate: string;
    }[] = [];

    allOrders.forEach(order => {
      // Filter out 'Draft' purchase orders for outgoing payments
      if (!isIncoming && (order as PurchaseOrder).status === 'Draft') {
        return;
      }

      const currentOrderPayments = paymentsByOrderAndCategoryAZN[order.id] || { products: 0, fees: 0 }; // Updated categories

      let adjustedPaymentsAZN = { ...currentOrderPayments };
      if (isEdit && payment.orderId === order.id && payment.paymentCategory !== 'manual') {
        const existingPaymentAmountInAZN = (payment.amount || 0) * (payment.paymentCurrency === 'AZN' ? 1 : (payment.paymentExchangeRate || currencyRates[payment.paymentCurrency || 'AZN'] || 1));
        adjustedPaymentsAZN[payment.paymentCategory as keyof typeof adjustedPaymentsAZN] -= existingPaymentAmountInAZN;
      }

      if (isIncoming) {
        const sellOrder = order as SellOrder;
        const customerName = customers[sellOrder.contactId] || 'Unknown Customer';
        const totalOrderValueAZN = sellOrder.total;

        const remainingTotalAZN = totalOrderValueAZN - adjustedPaymentsAZN.products;

        if (remainingTotalAZN > 0.001) {
          list.push({
            id: sellOrder.id,
            display: `${t('orderId')} #${sellOrder.id} (${customerName}) - ${sellOrder.orderDate} - ${t('remaining')}: ${remainingTotalAZN.toFixed(2)} AZN`,
            remainingAmount: remainingTotalAZN,
            category: 'products',
            orderType: 'sell',
            currency: 'AZN',
            orderDate: sellOrder.orderDate,
          });
        }
      } else {
        const purchaseOrder = order as PurchaseOrder;
        const supplierName = suppliers[purchaseOrder.contactId] || 'Unknown Supplier';
        
        const productsSubtotalNative = purchaseOrder.items?.reduce((sum, item) => sum + (item.qty * item.price), 0) || 0;
        const productsSubtotalAZN = productsSubtotalNative * (purchaseOrder.currency === 'AZN' ? 1 : (purchaseOrder.exchangeRate || currencyRates[purchaseOrder.currency] || 1));
        const remainingProductsBalanceAZN = productsSubtotalAZN - adjustedPaymentsAZN.products;
        const remainingProductsBalanceNative = remainingProductsBalanceAZN / (purchaseOrder.currency === 'AZN' ? 1 : (purchaseOrder.exchangeRate || currencyRates[purchaseOrder.currency] || 1));

        if (remainingProductsBalanceNative > 0.001) {
          list.push({
            id: purchaseOrder.id,
            display: `${t('orderId')} #${purchaseOrder.id} (${supplierName}) - ${purchaseOrder.orderDate} - ${t('productsTotal')} - ${t('remaining')}: ${remainingProductsBalanceNative.toFixed(2)} ${purchaseOrder.currency}`,
            remainingAmount: remainingProductsBalanceNative,
            category: 'products',
            orderType: 'purchase',
            currency: purchaseOrder.currency,
            orderDate: purchaseOrder.orderDate,
          });
        }

        if (purchaseOrder.fees > 0) { // Only one fees field now
          const feeAmountNative = purchaseOrder.fees;
          const feeCurrency = purchaseOrder.feesCurrency;
          const feeAmountAZN = feeAmountNative * (feeCurrency === 'AZN' ? 1 : currencyRates[feeCurrency] || 1);
          const remainingFeeBalanceAZN = feeAmountAZN - adjustedPaymentsAZN.fees;
          const remainingFeeBalanceNative = remainingFeeBalanceAZN / (feeCurrency === 'AZN' ? 1 : currencyRates[feeCurrency] || 1);

          if (remainingFeeBalanceNative > 0.001) {
            list.push({
              id: purchaseOrder.id,
              display: `${t('orderId')} #${purchaseOrder.id} (${supplierName}) - ${purchaseOrder.orderDate} - ${t('fees')} - ${t('remaining')}: ${remainingFeeBalanceNative.toFixed(2)} ${feeCurrency}`,
              remainingAmount: remainingFeeBalanceNative,
              category: 'fees',
              orderType: 'purchase',
              currency: feeCurrency,
              orderDate: purchaseOrder.orderDate,
            });
          }
        }
      }
    });
    return list;
  }, [allOrders, paymentsByOrderAndCategoryAZN, isIncoming, isEdit, payment, suppliers, customers, currencyRates, t]);

  return {
    currentPaymentExchangeRate,
    ordersWithBalance,
    purchaseOrderMap,
    sellOrderMap,
    paymentsByOrderAndCategoryAZN,
  };
};