"use client";

import { useCallback } from 'react';
import { useData } from '@/context/DataContext';
import { PurchaseOrder, Product, Currency } from '@/types';

interface PurchaseOrderItemState {
  productId: number | '';
  qty: number | string;
  price: number | string;
  itemTotal: number | string;
  currency?: Currency;
  landedCostPerUnit?: number;
}

interface UsePurchaseOrderHandlersProps {
  setOrder: React.Dispatch<React.SetStateAction<Partial<PurchaseOrder>>>;
  setOrderItems: React.Dispatch<React.SetStateAction<PurchaseOrderItemState[]>>;
  setSelectedCurrency: React.Dispatch<React.SetStateAction<Currency>>;
  setManualExchangeRate: React.Dispatch<React.SetStateAction<number | undefined>>;
  setManualExchangeRateInput: React.Dispatch<React.SetStateAction<string>>;
  productMap: { [key: number]: Product };
  selectedCurrency: Currency; // Added to ensure addOrderItem has correct currency
}

export const usePurchaseOrderHandlers = ({
  setOrder,
  setOrderItems,
  setSelectedCurrency,
  setManualExchangeRate,
  setManualExchangeRateInput,
  productMap,
  selectedCurrency,
}: UsePurchaseOrderHandlersProps) => {
  const { currencyRates } = useData();

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setOrder(prev => ({ ...prev, [id]: value }));
  }, [setOrder]);

  const handleNumericChange = useCallback((id: keyof PurchaseOrder, value: string) => {
    setOrder(prev => ({ ...prev, [id]: parseFloat(value) || 0 }));
  }, [setOrder]);

  const handleSelectChange = useCallback((id: keyof PurchaseOrder, value: string) => {
    setOrder(prev => ({ ...prev, [id]: value }));
  }, [setOrder]);

  const handleCurrencyChange = useCallback((value: Currency) => {
    setSelectedCurrency(value);
    setOrder(prev => ({ ...prev, currency: value }));
    if (value === 'AZN') {
      setManualExchangeRate(undefined);
      setManualExchangeRateInput('');
    } else {
      const defaultRate = currencyRates[value];
      setManualExchangeRate(defaultRate);
      setManualExchangeRateInput(String(defaultRate));
    }
  }, [setSelectedCurrency, setOrder, setManualExchangeRate, setManualExchangeRateInput, currencyRates]);

  const handleExchangeRateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue === '' || /^-?\d*\.?\d*$/.test(inputValue)) {
      setManualExchangeRateInput(inputValue);
      const parsedValue = parseFloat(inputValue);
      setManualExchangeRate(isNaN(parsedValue) ? undefined : parsedValue);
    }
  }, [setManualExchangeRate, setManualExchangeRateInput]);

  const addOrderItem = useCallback(() => {
    setOrderItems(prev => [...prev, { productId: '', qty: '', price: '', itemTotal: '', currency: selectedCurrency }]);
  }, [setOrderItems, selectedCurrency]);

  const removeOrderItem = useCallback((index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  }, [setOrderItems]);

  const handleOrderItemChange = useCallback((index: number, field: 'productId' | 'qty' | 'price' | 'itemTotal', value: any) => {
    setOrderItems(prev => {
      const newItems = [...prev];
      const item = { ...newItems[index] };

      if (field === 'productId') {
        item.productId = value;
      } else if (field === 'qty') {
        item.qty = value;
        const qtyNum = parseFloat(value) || 0;
        const priceNum = parseFloat(String(item.price)) || 0;
        item.itemTotal = String(qtyNum * priceNum);
      } else if (field === 'price') {
        item.price = value;
        const qtyNum = parseFloat(String(item.qty)) || 0;
        const priceNum = parseFloat(value) || 0;
        item.itemTotal = String(qtyNum * priceNum);
      } else if (field === 'itemTotal') {
        item.itemTotal = value;
        const qtyNum = parseFloat(String(item.qty)) || 0;
        const itemTotalNum = parseFloat(value) || 0;
        if (qtyNum > 0) {
          item.price = String(itemTotalNum / qtyNum);
        } else {
          item.price = '0';
        }
      }
      newItems[index] = item;
      return newItems;
    });
  }, [setOrderItems]);

  return {
    handleChange,
    handleNumericChange,
    handleSelectChange,
    handleCurrencyChange,
    handleExchangeRateChange,
    addOrderItem,
    removeOrderItem,
    handleOrderItemChange,
  };
};