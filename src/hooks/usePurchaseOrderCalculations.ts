"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { PurchaseOrder, Product, OrderItem, Currency, CurrencyRates, Settings, PurchaseOrderItemState } from '@/types';

interface UsePurchaseOrderCalculationsProps {
  order: Partial<PurchaseOrder>;
  orderItems: PurchaseOrderItemState[];
  selectedCurrency: Currency;
  manualExchangeRate?: number;
  productMap: { [key: number]: Product };
  currencyRates: CurrencyRates;
  settings: Settings;
}

export const usePurchaseOrderCalculations = ({
  order,
  orderItems,
  selectedCurrency,
  manualExchangeRate,
  productMap,
  currencyRates,
  settings,
}: UsePurchaseOrderCalculationsProps) => {

  const currentExchangeRate = useMemo(() => {
    if (selectedCurrency === 'AZN') return 1;
    return manualExchangeRate !== undefined ? manualExchangeRate : currencyRates[selectedCurrency];
  }, [selectedCurrency, manualExchangeRate, currencyRates]);

  const calculateOrderFinancials = useCallback(() => {
    let productsSubtotalNative = 0;
    orderItems.forEach(item => {
      const qtyNum = parseFloat(String(item.qty)) || 0;
      const priceNum = parseFloat(String(item.price)) || 0;
      if (item.productId && qtyNum > 0 && priceNum > 0) {
        productsSubtotalNative += qtyNum * priceNum;
      }
    });

    const productsSubtotalAZN = productsSubtotalNative * currentExchangeRate;

    // Calculate fees in AZN
    const feesAZN = (order.fees || 0) * ((order.feesCurrency || 'AZN') === 'AZN' ? 1 : (currencyRates[order.feesCurrency || 'AZN'] || 1));

    const totalFeesAZN = feesAZN;

    const totalOrderValueAZN = productsSubtotalAZN + totalFeesAZN;

    // Prepare fees breakdown for display in their native currencies
    const feesBreakdownForDisplay: { [currency: string]: number } = {};
    if ((order.fees || 0) > 0) {
      feesBreakdownForDisplay[order.feesCurrency || 'AZN'] = (feesBreakdownForDisplay[order.feesCurrency || 'AZN'] || 0) + (order.fees || 0);
    }

    // Calculate landed cost per unit for each item
    const updatedOrderItemsWithLandedCost: OrderItem[] = orderItems.map(item => {
      const qtyNum = parseFloat(String(item.qty)) || 0;
      const priceNum = parseFloat(String(item.price)) || 0;

      if (!item.productId || qtyNum <= 0 || priceNum <= 0) {
        return { productId: item.productId as number, qty: qtyNum, price: priceNum, currency: item.currency || selectedCurrency };
      }

      const itemValueNative = qtyNum * priceNum;
      const itemValueAZN = itemValueNative * currentExchangeRate;

      let landedCostPerUnit = itemValueAZN / qtyNum;

      if (productsSubtotalAZN > 0) {
        const proportionalFeeShare = (itemValueAZN / productsSubtotalAZN) * totalFeesAZN;
        landedCostPerUnit = (itemValueAZN + proportionalFeeShare) / qtyNum;
      } else if (totalFeesAZN > 0 && orderItems.length === 1) {
        landedCostPerUnit = (itemValueAZN + totalFeesAZN) / qtyNum;
      }

      return {
        productId: item.productId as number,
        qty: qtyNum,
        price: priceNum,
        currency: selectedCurrency,
        landedCostPerUnit: parseFloat(landedCostPerUnit.toFixed(4)),
        packingUnitId: item.packingUnitId,
        packingQuantity: parseFloat(String(item.packingQuantity)) || 0,
      };
    });

    return {
      totalOrderValueAZN: parseFloat(totalOrderValueAZN.toFixed(2)),
      updatedOrderItemsWithLandedCost,
      productsSubtotalNative: parseFloat(productsSubtotalNative.toFixed(2)),
      feesBreakdownForDisplay,
    };
  }, [order, orderItems, selectedCurrency, currentExchangeRate, currencyRates]);

  const {
    totalOrderValueAZN,
    updatedOrderItemsWithLandedCost,
    productsSubtotalNative,
    feesBreakdownForDisplay,
  } = calculateOrderFinancials();

  return {
    currentExchangeRate,
    totalOrderValueAZN,
    calculatedOrderItems: updatedOrderItemsWithLandedCost,
    productsSubtotalNative,
    displayedFeesBreakdown: feesBreakdownForDisplay,
  };
};