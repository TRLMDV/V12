"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { SellOrder, Product, Currency } from '@/types';

interface SellOrderItemState {
  productId: number | '';
  qty: number | string;
  price: number | string;
  itemTotal: number | string;
  cleanProfit?: number;
  landedCost?: number;
  packingUnitId?: number; // New: ID of the selected packing unit
  packingQuantity?: number | string; // New: Quantity in terms of the selected packing unit
}

interface UseSellOrderCalculationsProps {
  order: Partial<SellOrder>;
  orderItems: SellOrderItemState[];
  selectedCurrency: Currency;
  manualExchangeRate?: number;
  productMap: { [key: number]: Product };
}

export const useSellOrderCalculations = ({
  order,
  orderItems,
  selectedCurrency,
  manualExchangeRate,
  productMap,
}: UseSellOrderCalculationsProps) => {
  const { currencyRates, settings, convertCurrency } = useData();
  const mainCurrency = settings.mainCurrency;

  const currentExchangeRateToAZN = useMemo(() => {
    if (selectedCurrency === 'AZN') return 1;
    return manualExchangeRate !== undefined ? manualExchangeRate : currencyRates[selectedCurrency];
  }, [selectedCurrency, manualExchangeRate, currencyRates]);

  const currentExchangeRateToMainCurrency = useMemo(() => {
    if (selectedCurrency === mainCurrency) return 1;
    const rateSelectedToAZN = currentExchangeRateToAZN;
    const rateAZNToMain = 1 / (currencyRates[mainCurrency] || 1);
    return rateSelectedToAZN * rateAZNToMain;
  }, [selectedCurrency, mainCurrency, currentExchangeRateToAZN, currencyRates]);

  const calculateOrderFinancials = useCallback(() => {
    console.log("DEBUG: order object in useSellOrderCalculations:", order); // Add this log
    let subtotalInOrderCurrency = 0;
    let totalCleanProfitInMainCurrency = 0;
    const updatedOrderItemsWithProfit: SellOrderItemState[] = [];

    orderItems.forEach(item => {
      const itemTotalNum = parseFloat(String(item.itemTotal)) || 0;
      const qtyNum = parseFloat(String(item.qty)) || 0; // This is now base unit quantity
      const priceNum = parseFloat(String(item.price)) || 0;
      
      let itemCleanProfit = 0;

      if (item.productId && qtyNum > 0 && priceNum > 0) {
        subtotalInOrderCurrency += itemTotalNum;
        const product = productMap[item.productId as number];
        if (product) {
          const itemPriceInMainCurrency = convertCurrency(priceNum, selectedCurrency, mainCurrency);
          itemCleanProfit = (itemPriceInMainCurrency - (product.averageLandedCost || 0)) * qtyNum;
        }
      }
      updatedOrderItemsWithProfit.push({ ...item, cleanProfit: itemCleanProfit });
      totalCleanProfitInMainCurrency += itemCleanProfit;
    });

    const subtotalInMainCurrency = convertCurrency(subtotalInOrderCurrency, selectedCurrency, mainCurrency);
    const vatAmountInMainCurrency = subtotalInMainCurrency * ((order.vatPercent || 0) / 100);
    const totalWithVatInMainCurrency = parseFloat((subtotalInMainCurrency + vatAmountInMainCurrency).toFixed(2));

    return {
      subtotalInOrderCurrency,
      subtotalInMainCurrency,
      totalVatAmountInMainCurrency: parseFloat(vatAmountInMainCurrency.toFixed(2)),
      totalWithVatInMainCurrency,
      totalCleanProfitInMainCurrency: parseFloat(totalCleanProfitInMainCurrency.toFixed(2)),
      updatedOrderItemsWithProfit,
    };
  }, [orderItems, order.vatPercent, productMap, selectedCurrency, mainCurrency, convertCurrency, currentExchangeRateToAZN]); // Added currentExchangeRateToAZN as dependency

  const {
    subtotalInOrderCurrency,
    subtotalInMainCurrency,
    totalVatAmountInMainCurrency,
    totalWithVatInMainCurrency,
    totalCleanProfitInMainCurrency,
    updatedOrderItemsWithProfit
  } = calculateOrderFinancials();

  return {
    currentExchangeRateToAZN,
    currentExchangeRateToMainCurrency,
    subtotalInOrderCurrency,
    subtotalInMainCurrency,
    totalVatAmount: totalVatAmountInMainCurrency,
    totalWithVat: totalWithVatInMainCurrency,
    totalCleanProfit: totalCleanProfitInMainCurrency,
    calculatedOrderItems: updatedOrderItemsWithProfit,
  };
};