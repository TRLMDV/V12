"use client";

import { useCallback } from 'react';
import { useData } from '@/context/DataContext';
import { PurchaseOrder, Product, Currency, PackingUnit, PurchaseOrderItemState } from '@/types';
import { formatNumberInput, roundToPrecision } from '@/utils/formatters'; // Import the new formatter

interface UsePurchaseOrderHandlersProps {
  setOrder: React.Dispatch<React.SetStateAction<Partial<PurchaseOrder>>>;
  setOrderItems: React.Dispatch<React.SetStateAction<PurchaseOrderItemState[]>>;
  setSelectedCurrency: React.Dispatch<React.SetStateAction<Currency>>;
  setManualExchangeRate: React.Dispatch<React.SetStateAction<number | undefined>>;
  setManualExchangeRateInput: React.Dispatch<React.SetStateAction<string>>;
  setManualFeesExchangeRate: React.Dispatch<React.SetStateAction<number | undefined>>; // New: Setter for fees exchange rate
  setManualFeesExchangeRateInput: React.Dispatch<React.SetStateAction<string>>; // New: Setter for fees exchange rate input
  productMap: { [key: number]: Product };
  packingUnitMap: { [key: number]: PackingUnit }; // New: Pass packingUnitMap
  selectedCurrency: Currency; // Added to ensure addOrderItem has correct currency
}

export const usePurchaseOrderHandlers = ({
  setOrder,
  setOrderItems,
  setSelectedCurrency,
  setManualExchangeRate,
  setManualExchangeRateInput,
  setManualFeesExchangeRate, // Destructure new prop
  setManualFeesExchangeRateInput, // Destructure new prop
  productMap,
  packingUnitMap, // Destructure new prop
  selectedCurrency,
}: UsePurchaseOrderHandlersProps) => {
  const { currencyRates, packingUnits } = useData(); // Get packingUnits to find 'Piece'

  // Find the 'Piece' packing unit ID once
  const piecePackingUnitId = packingUnits.find(pu => pu.name === 'Piece')?.id;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setOrder(prev => ({ ...prev, [id]: value }));
  }, [setOrder]);

  const handleNumericChange = useCallback((id: keyof PurchaseOrder, value: string) => {
    setOrder(prev => ({ ...prev, [id]: parseFloat(value) || 0 }));
  }, [setOrder]);

  const handleSelectChange = useCallback((id: keyof PurchaseOrder, value: string) => {
    setOrder(prev => ({ ...prev, [id]: value }));
    if (id === 'feesCurrency') {
      // When fees currency changes, update the manual fees exchange rate input
      if (value === 'AZN') {
        setManualFeesExchangeRate(undefined);
        setManualFeesExchangeRateInput('');
      } else {
        const defaultRate = currencyRates[value as Currency];
        setManualFeesExchangeRate(defaultRate);
        setManualFeesExchangeRateInput(formatNumberInput(roundToPrecision(defaultRate, 4))); // Apply formatter
      }
    }
  }, [setOrder, setManualFeesExchangeRate, setManualFeesExchangeRateInput, currencyRates]);

  const handleCurrencyChange = useCallback((value: Currency) => {
    setSelectedCurrency(value);
    setOrder(prev => ({ ...prev, currency: value }));
    if (value === 'AZN') {
      setManualExchangeRate(undefined);
      setManualExchangeRateInput('');
    } else {
      const defaultRate = currencyRates[value];
      setManualExchangeRate(defaultRate);
      setManualExchangeRateInput(formatNumberInput(roundToPrecision(defaultRate, 4))); // Apply formatter
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

  const handleFeesExchangeRateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { // New handler
    const inputValue = e.target.value;
    if (inputValue === '' || /^-?\d*\.?\d*$/.test(inputValue)) {
      setManualFeesExchangeRateInput(inputValue);
      const parsedValue = parseFloat(inputValue);
      setManualFeesExchangeRate(isNaN(parsedValue) ? undefined : parsedValue);
    }
  }, [setManualFeesExchangeRate, setManualFeesExchangeRateInput]);

  const addOrderItem = useCallback(() => {
    setOrderItems(prev => [...prev, {
      productId: '',
      qty: '',
      price: '',
      itemTotal: '',
      currency: selectedCurrency,
      packingUnitId: piecePackingUnitId, // Default to 'Piece'
      packingQuantity: '',
    }]);
  }, [setOrderItems, selectedCurrency, piecePackingUnitId]);

  const removeOrderItem = useCallback((index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  }, [setOrderItems]);

  const handleOrderItemChange = useCallback((index: number, field: keyof PurchaseOrderItemState, value: any) => {
    setOrderItems(prev => {
      const newItems = [...prev];
      const item = { ...newItems[index] };

      if (field === 'productId') {
        item.productId = value;
        const selectedProduct = productMap[value as number];
        // Set default packing unit to 'Piece' if not already set
        if (item.packingUnitId === undefined || item.packingUnitId === null) {
          item.packingUnitId = piecePackingUnitId;
        }
      } else if (field === 'packingUnitId') {
        item.packingUnitId = value === 'none-selected' ? undefined : parseInt(value);
        const currentDisplayQty = parseFloat(String(item.packingQuantity)) || 0; // Get current value from the input field
        const selectedPackingUnit = item.packingUnitId ? packingUnitMap[item.packingUnitId] : undefined;

        if (selectedPackingUnit) {
          // If a new packing unit is selected, keep packingQuantity as is, recalculate base qty
          item.qty = formatNumberInput(roundToPrecision(currentDisplayQty * selectedPackingUnit.conversionFactor, 4));
        } else {
          // If 'none-selected' is chosen, treat current input as base qty
          item.qty = formatNumberInput(roundToPrecision(currentDisplayQty, 4));
          item.packingQuantity = ''; // Clear packing quantity as no unit is selected
        }
        // After updating qty, recalculate itemTotal
        const finalQtyNum = parseFloat(String(item.qty)) || 0;
        const finalPriceNum = parseFloat(String(item.price)) || 0;
        item.itemTotal = formatNumberInput(roundToPrecision(finalQtyNum * finalPriceNum, 4));
      } else if (field === 'packingQuantity') {
        const inputValue = String(value);
        const parsedValue = parseFloat(inputValue) || 0;

        const selectedPackingUnit = item.packingUnitId ? packingUnitMap[item.packingUnitId] : undefined;

        if (selectedPackingUnit && item.packingUnitId !== undefined && item.packingUnitId !== null && item.packingUnitId !== 0) { // Check if a valid packing unit is selected
          item.packingQuantity = inputValue;
          item.qty = formatNumberInput(roundToPrecision(parsedValue * selectedPackingUnit.conversionFactor, 4));
        } else {
          // If no packing unit selected, treat input as base quantity
          item.qty = inputValue; // Store as string for consistency with other inputs
          item.packingQuantity = ''; // Clear packingQuantity if no unit is selected
        }
        // After updating qty, recalculate itemTotal
        const finalQtyNum = parseFloat(String(item.qty)) || 0;
        const finalPriceNum = parseFloat(String(item.price)) || 0;
        item.itemTotal = formatNumberInput(roundToPrecision(finalQtyNum * finalPriceNum, 4));
      } else if (field === 'price') {
        item.price = value;
        // After updating price, recalculate itemTotal
        const finalQtyNum = parseFloat(String(item.qty)) || 0;
        const finalPriceNum = parseFloat(String(item.price)) || 0;
        item.itemTotal = formatNumberInput(roundToPrecision(finalQtyNum * finalPriceNum, 4));
      } else if (field === 'itemTotal') {
        const parsedValue = parseFloat(value) || 0;
        item.itemTotal = formatNumberInput(roundToPrecision(parsedValue, 4)); // Format user input for itemTotal
        const qtyNum = parseFloat(String(item.qty)) || 0;
        const itemTotalNum = parseFloat(item.itemTotal) || 0; // Use the formatted itemTotal for price calculation
        if (qtyNum > 0) {
          item.price = formatNumberInput(roundToPrecision(itemTotalNum / qtyNum, 4)); // Calculate price based on user's itemTotal
        } else {
          item.price = '0'; // Handle division by zero
        }
        // IMPORTANT: Do NOT recalculate itemTotal here, as the user just set it.
        // The price was calculated from it.
      }

      newItems[index] = item;
      return newItems;
    });
  }, [setOrderItems, productMap, packingUnitMap, piecePackingUnitId]);

  return {
    handleChange,
    handleNumericChange,
    handleSelectChange,
    handleCurrencyChange,
    handleExchangeRateChange,
    handleFeesExchangeRateChange, // New: Return new handler
    addOrderItem,
    removeOrderItem,
    handleOrderItemChange,
  };
};

export default usePurchaseOrderHandlers;