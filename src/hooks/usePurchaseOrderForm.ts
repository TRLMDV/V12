"use client";

import { useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { usePurchaseOrderState } from './usePurchaseOrderState';
import { usePurchaseOrderCalculations } from './usePurchaseOrderCalculations';
import { usePurchaseOrderHandlers } from './usePurchaseOrderHandlers';
import { usePurchaseOrderActions } from './usePurchaseOrderActions';
import { Currency, OrderItem } from '@/types'; // Import OrderItem

interface PurchaseOrderItemState {
  productId: number | '';
  qty: number | string; // This will be the quantity in base units
  price: number | string;
  itemTotal?: number | string; // Made optional
  currency?: Currency;
  landedCostPerUnit?: number;
  packingUnitId?: number; // New: ID of the selected packing unit
  packingQuantity?: number | string; // New: Quantity in terms of the selected packing unit
}

interface UsePurchaseOrderFormProps {
  orderId?: number;
  onSuccess: () => void;
}

export const usePurchaseOrderForm = ({ orderId, onSuccess }: UsePurchaseOrderFormProps) => {
  const { currencyRates, settings, packingUnits, packingUnitMap } = useData(); // New: packingUnits and packingUnitMap

  // 1. State Management
  const {
    order,
    setOrder,
    orderItems,
    setOrderItems,
    selectedCurrency,
    setSelectedCurrency,
    manualExchangeRate,
    setManualExchangeRate,
    manualExchangeRateInput,
    setManualExchangeRateInput,
    openComboboxIndex,
    setOpenComboboxIndex,
    supplierMap,
    productMap,
    warehouseMap,
    activeCurrencies,
    mainCurrency,
    isEdit,
    products,
    suppliers,
    warehouses,
  } = usePurchaseOrderState({ orderId });

  // 2. Calculations
  const {
    currentExchangeRate,
    totalOrderValueAZN,
    calculatedOrderItems,
    productsSubtotalNative,
    displayedFeesBreakdown,
  } = usePurchaseOrderCalculations({
    order,
    orderItems,
    selectedCurrency,
    manualExchangeRate,
    productMap,
    currencyRates,
    settings,
  });

  // Update order total and items with calculated values
  useEffect(() => {
    setOrder(prev => ({ ...prev, total: totalOrderValueAZN }));
    setOrderItems(prevItems => prevItems.map((prevItem, index) => {
      const calculatedItem = calculatedOrderItems[index];
      if (calculatedItem) {
        return {
          ...prevItem, // Keep productId, qty, price, itemTotal, packingUnitId, packingQuantity as they are the source of truth for user input
          currency: calculatedItem.currency as Currency,
          landedCostPerUnit: calculatedItem.landedCostPerUnit,
        };
      }
      return prevItem;
    }));
  }, [totalOrderValueAZN, calculatedOrderItems, setOrder, setOrderItems]);

  // 3. Handlers
  const {
    handleChange,
    handleNumericChange,
    handleSelectChange,
    handleCurrencyChange,
    handleExchangeRateChange,
    addOrderItem,
    removeOrderItem,
    handleOrderItemChange,
  } = usePurchaseOrderHandlers({
    setOrder,
    setOrderItems,
    setSelectedCurrency,
    setManualExchangeRate,
    setManualExchangeRateInput,
    productMap,
    packingUnitMap, // Pass packingUnitMap
    selectedCurrency,
  });

  // 4. Actions
  const {
    handleSubmit,
  } = usePurchaseOrderActions({
    order,
    orderItems: calculatedOrderItems as OrderItem[], // Cast to OrderItem[]
    selectedCurrency,
    manualExchangeRate,
    currentExchangeRate,
    onSuccess,
    isEdit,
  });

  return {
    order,
    orderItems,
    supplierMap,
    productMap,
    warehouseMap,
    packingUnits, // Pass packingUnits
    packingUnitMap, // Pass packingUnitMap
    activeCurrencies,
    mainCurrency,
    products,
    suppliers,
    warehouses,
    handleChange,
    handleNumericChange,
    handleSelectChange,
    handleCurrencyChange,
    handleExchangeRateChange,
    addOrderItem,
    removeOrderItem,
    handleOrderItemChange,
    handleSubmit,
    productsSubtotalNative,
    displayedFeesBreakdown,
    selectedCurrency,
    manualExchangeRateInput,
    openComboboxIndex,
    setOpenComboboxIndex,
  };
};