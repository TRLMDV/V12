"use client";

import { useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { MOCK_CURRENT_DATE } from '@/data/initialData'; // Corrected import
import { usePurchaseOrderState } from './usePurchaseOrderState';
import { usePurchaseOrderCalculations } from './usePurchaseOrderCalculations';
import { usePurchaseOrderHandlers } from './usePurchaseOrderHandlers';
import { usePurchaseOrderActions } from './usePurchaseOrderActions';
import { Currency, OrderItem, PurchaseOrderItemState } from '@/types'; // Import PurchaseOrderItemState

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
    manualFeesExchangeRate, // New: Destructure fees exchange rate state
    setManualFeesExchangeRate, // New: Destructure setter for fees exchange rate state
    manualFeesExchangeRateInput, // New: Destructure fees exchange rate input state
    setManualFeesExchangeRateInput, // New: Destructure setter for fees exchange rate input state
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
    date, // New: date state from hook
    setDate, // New: setDate from hook
    selectedHour, // New: selectedHour state from hook
    setSelectedHour, // New: setSelectedHour from hook
    selectedMinute, // New: selectedMinute state from hook
    setSelectedMinute, // New: setSelectedMinute from hook
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
    manualFeesExchangeRate, // New: Pass manualFeesExchangeRate
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
    handleFeesExchangeRateChange, // New: Pass fees exchange rate handler
    addOrderItem,
    removeOrderItem,
    handleOrderItemChange,
  } = usePurchaseOrderHandlers({
    setOrder,
    setOrderItems,
    setSelectedCurrency,
    setManualExchangeRate,
    setManualExchangeRateInput,
    setManualFeesExchangeRate, // New: Pass setter for fees exchange rate
    setManualFeesExchangeRateInput, // New: Pass setter for fees exchange rate input
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
    manualFeesExchangeRate, // New: Pass manualFeesExchangeRate
    currentExchangeRate,
    onSuccess,
    isEdit,
    setOrder, // ADDED: Pass setOrder here
  });

  return {
    order,
    setOrder,
    orderItems,
    setOrderItems, // Expose setOrderItems
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
    handleFeesExchangeRateChange, // New: Return new handler
    addOrderItem,
    removeOrderItem,
    handleOrderItemChange,
    handleSubmit,
    productsSubtotalNative,
    displayedFeesBreakdown,
    selectedCurrency,
    manualExchangeRateInput,
    manualFeesExchangeRateInput, // New: Return fees exchange rate input
    openComboboxIndex,
    setOpenComboboxIndex,
    date, // New: Return date state
    setDate, // New: Return setDate
    selectedHour, // New: Return selectedHour state
    setSelectedHour, // New: Return setSelectedHour
    selectedMinute, // New: Return selectedMinute state
    setSelectedMinute, // New: Return setSelectedMinute
  };
};