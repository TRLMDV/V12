"use client";

import { useCallback } from 'react';
import { useData } from '@/context/DataContext';
import { SellOrder, Product, Currency } from '@/types';

interface SellOrderItemState {
  productId: number | '';
  qty: number | string;
  price: number | string;
  itemTotal: number | string;
  cleanProfit?: number;
  landedCost?: number;
}

interface UseSellOrderHandlersProps {
  setOrder: React.Dispatch<React.SetStateAction<Partial<SellOrder>>>;
  setOrderItems: React.Dispatch<React.SetStateAction<SellOrderItemState[]>>;
  setSelectedCurrency: React.Dispatch<React.SetStateAction<Currency>>;
  setManualExchangeRate: React.Dispatch<React.SetStateAction<number | undefined>>;
  setManualExchangeRateInput: React.Dispatch<React.SetStateAction<string>>;
  productMap: { [key: number]: Product };
}

export const useSellOrderHandlers = ({
  setOrder,
  setOrderItems,
  setSelectedCurrency,
  setManualExchangeRate,
  setManualExchangeRateInput,
  productMap,
}: UseSellOrderHandlersProps) => {
  const { currencyRates } = useData();

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setOrder(prev => ({ ...prev, [id]: value }));
  }, [setOrder]);

  const handleNumericChange = useCallback((id: keyof SellOrder, value: string) => {
    setOrder(prev => ({ ...prev, [id]: parseFloat(value) || 0 }));
  }, [setOrder]);

  const handleSelectChange = useCallback((id: keyof SellOrder, value: string) => {
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
    setOrderItems(prev => [...prev, { productId: '', qty: '', price: '', itemTotal: '', landedCost: undefined }]);
  }, [setOrderItems]);

  const removeOrderItem = useCallback((index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  }, [setOrderItems]);

  const handleOrderItemChange = useCallback((index: number, field: keyof SellOrderItemState, value: any) => {
    setOrderItems(prev => {
      const newItems = [...prev];
      const item = { ...newItems[index] };

      if (field === 'productId') {
        item.productId = value;
        const selectedProduct = productMap[value as number];
        item.landedCost = selectedProduct?.averageLandedCost;
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
  }, [setOrderItems, productMap]);

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