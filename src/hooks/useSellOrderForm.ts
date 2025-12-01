"use client";

import { useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { MOCK_CURRENT_DATE } from '@/data/initialData';
import { useSellOrderState } from './useSellOrderState';
import { useSellOrderCalculations } from './useSellOrderCalculations';
import { useSellOrderHandlers } from './useSellOrderHandlers';
import { useSellOrderActions } from './useSellOrderActions';
import { Currency, Settings } from '@/types'; // Import Currency and Settings type

interface UseSellOrderFormProps {
  orderId?: number;
  onSuccess: () => void;
}

export const useSellOrderForm = ({ orderId, onSuccess }: UseSellOrderFormProps) => {
  const { settings, packingUnits, packingUnitMap } = useData();

  // Ensure settings and its properties are always valid, with fallbacks
  const safeSettings: Settings = settings || {} as Settings; // Explicitly type as Settings
  const mainCurrency: Currency = safeSettings.mainCurrency || 'AZN';
  const activeCurrencies: Currency[] = Array.isArray(safeSettings.activeCurrencies) ? safeSettings.activeCurrencies : [mainCurrency];

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
    openComboboxIndex, // Destructure openComboboxIndex
    setOpenComboboxIndex, // Destructure setOpenComboboxIndex
    isWarehouseManuallySet, // New: Destructure isWarehouseManuallySet
    setIsWarehouseManuallySet, // New: Destructure setIsWarehouseManuallySet
    customerMap,
    productMap,
    warehouseMap,
    mainWarehouse,
    isEdit,
    products,
    customers,
    warehouses,
    date, // New: Destructure date state
    setDate, // New: Destructure setDate
    selectedHour, // New: Destructure selectedHour state
    setSelectedHour, // New: Destructure setSelectedHour
    selectedMinute, // New: Destructure selectedMinute state
    setSelectedMinute, // New: Destructure setSelectedMinute
  } = useSellOrderState({ orderId });

  // 2. Calculations
  const {
    currentExchangeRateToAZN,
    currentExchangeRateToMainCurrency,
    subtotalInOrderCurrency,
    totalVatAmount,
    totalWithVat,
    totalCleanProfit,
    calculatedOrderItems,
  } = useSellOrderCalculations({
    order,
    orderItems,
    selectedCurrency,
    manualExchangeRate,
    productMap,
  });

  // Update order total and items with calculated values
  useEffect(() => {
    setOrder(prev => ({ ...prev, total: totalWithVat }));
    setOrderItems(prevItems => prevItems.map((prevItem, index) => {
      const calculatedItem = calculatedOrderItems[index];
      if (calculatedItem) {
        return {
          ...prevItem, // Keep productId, qty, price, itemTotal, packingUnitId, packingQuantity as they are the source of truth for user input
          cleanProfit: calculatedItem.cleanProfit,
          landedCost: calculatedItem.landedCost,
        };
      }
      return prevItem;
    }));
  }, [totalWithVat, calculatedOrderItems, setOrder, setOrderItems]);

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
  } = useSellOrderHandlers({
    setOrder,
    setOrderItems,
    setSelectedCurrency,
    setManualExchangeRate,
    setManualExchangeRateInput,
    productMap,
    packingUnitMap, // Pass packingUnitMap
    setIsWarehouseManuallySet, // New: Pass setIsWarehouseManuallySet
  });

  // 4. Actions
  const {
    handleGenerateProductMovement,
    handleGenerateIncomingPayment,
    handleSubmit,
    isGenerateMovementDisabled,
    isGeneratePaymentDisabled,
  } = useSellOrderActions({
    order,
    orderItems: calculatedOrderItems, // Pass calculated items with landed cost
    selectedCurrency,
    manualExchangeRate,
    mainWarehouse,
    productMap,
    onSuccess,
    isEdit,
    setOrder, // Pass setOrder here
  });

  return {
    order,
    setOrder, // Exposed for potential external updates if needed, though less likely with modularity
    orderItems,
    setOrderItems, // Expose setOrderItems
    customerMap,
    productMap,
    warehouseMap,
    mainWarehouse,
    packingUnits, // Pass packingUnits
    packingUnitMap, // Pass packingUnitMap
    isGenerateMovementDisabled,
    isGeneratePaymentDisabled,
    handleChange,
    handleNumericChange,
    handleSelectChange,
    handleCurrencyChange,
    handleExchangeRateChange,
    addOrderItem,
    removeOrderItem,
    handleOrderItemChange,
    handleGenerateProductMovement,
    handleGenerateIncomingPayment,
    handleSubmit,
    totalVatAmount,
    totalCleanProfit,
    selectedCurrency,
    manualExchangeRateInput,
    mainCurrency,
    currentExchangeRateToMainCurrency,
    subtotalInOrderCurrency,
    activeCurrencies, // Now guaranteed to be an array
    products,
    customers,
    warehouses,
    openComboboxIndex, // Return openComboboxIndex
    setOpenComboboxIndex, // Return setOpenComboboxIndex
    date, // New: Return date state
    setDate, // New: Return setDate
    selectedHour, // New: Return selectedHour state
    setSelectedHour, // New: Return setSelectedHour
    selectedMinute, // New: Return selectedMinute state
    setSelectedMinute, // New: Return setSelectedMinute
  };
};