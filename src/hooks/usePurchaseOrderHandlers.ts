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
    // Store raw string value, parse to float only when needed for calculations
    const standardizedValue = value.replace(',', '.');
    setOrder(prev => ({ ...prev, [id]: parseFloat(standardizedValue) || 0 }));
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
    // Allow empty string, negative sign, or valid number format
    if (inputValue === '' || inputValue === '-' || /^-?\d*\.?\d*$/.test(inputValue)) {
      setManualExchangeRateInput(inputValue);
      const parsedValue = parseFloat(inputValue);
      setManualExchangeRate(isNaN(parsedValue) ? undefined : parsedValue);
    }
  }, [setManualExchangeRate, setManualExchangeRateInput]);

  const handleFeesExchangeRateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { // New handler
    const inputValue = e.target.value;
    // Allow empty string, negative sign, or valid number format
    if (inputValue === '' || inputValue === '-' || /^-?\d*\.?\d*$/.test(inputValue)) {
      setManualFeesExchangeRateInput(inputValue);
      const parsedValue = parseFloat(inputValue);
      setManualFeesExchangeRate(isNaN(parsedValue) ? undefined : parsedValue);
    }
  }, [setManualFeesExchangeRate, setManualFeesExchangeRateInput]);

  const addOrderItem = useCallback(() => {
    setOrderItems(prev => [...prev, {
      productId: '',
      qty: '', // Store as string
      price: '', // Store as string
      itemTotal: '', // Store as string
      currency: selectedCurrency,
      packingUnitId: piecePackingUnitId, // Default to 'Piece'
      packingQuantity: '', // Store as string
    }]);
  }, [setOrderItems, selectedCurrency, piecePackingUnitId]);

  const removeOrderItem = useCallback((index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  }, [setOrderItems]);

  const handleOrderItemChange = useCallback((index: number, field: keyof PurchaseOrderItemState, value: any) => {
    setOrderItems(prev => {
      const newItems = [...prev];
      const item = { ...newItems[index] };

      // Standardize decimal separator to '.' for internal parsing, but store raw string
      const standardizedValue = String(value).replace(',', '.');

      if (field === 'productId') {
        item.productId = value;
        // Set default packing unit to 'Piece' if not already set
        if (item.packingUnitId === undefined || item.packingUnitId === null) {
          item.packingUnitId = piecePackingUnitId;
        }
      } else if (field === 'packingUnitId') {
        item.packingUnitId = value === 'none-selected' ? undefined : parseInt(value);
        const currentPackingQtyNum = parseFloat(String(item.packingQuantity).replace(',', '.')) || 0;
        const selectedPackingUnit = item.packingUnitId ? packingUnitMap[item.packingUnitId] : undefined;

        if (selectedPackingUnit) {
          item.qty = String(roundToPrecision(currentPackingQtyNum * selectedPackingUnit.conversionFactor, 4));
        } else {
          item.qty = String(currentPackingQtyNum); // If no packing unit, packingQuantity is treated as base qty
          item.packingQuantity = ''; // Clear packing quantity as no unit is selected
        }
        const finalQtyNum = parseFloat(String(item.qty).replace(',', '.')) || 0;
        const finalPriceNum = parseFloat(String(item.price).replace(',', '.')) || 0;
        item.itemTotal = String(roundToPrecision(finalQtyNum * finalPriceNum, 4));
      } else if (field === 'packingQuantity') {
        item.packingQuantity = standardizedValue; // Store raw string
        const parsedValue = parseFloat(standardizedValue) || 0;
        const roundedValue = roundToPrecision(parsedValue, 4);

        const selectedPackingUnit = item.packingUnitId ? packingUnitMap[item.packingUnitId] : undefined;

        if (selectedPackingUnit && item.packingUnitId !== undefined && item.packingUnitId !== null && item.packingUnitId !== 0) {
          item.qty = String(roundToPrecision(roundedValue * selectedPackingUnit.conversionFactor, 4));
        } else {
          item.qty = standardizedValue; // If no packing unit, packingQuantity is treated as base qty
        }
        const finalQtyNum = parseFloat(String(item.qty).replace(',', '.')) || 0;
        const finalPriceNum = parseFloat(String(item.price).replace(',', '.')) || 0;
        item.itemTotal = String(roundToPrecision(finalQtyNum * finalPriceNum, 4));
      } else if (field === 'price') {
        item.price = standardizedValue; // Store raw string
        const finalQtyNum = parseFloat(String(item.qty).replace(',', '.')) || 0;
        const finalPriceNum = parseFloat(standardizedValue) || 0;
        item.itemTotal = String(roundToPrecision(finalQtyNum * finalPriceNum, 4));
      } else if (field === 'itemTotal') {
        item.itemTotal = standardizedValue; // Store raw string
        const qtyNum = parseFloat(String(item.qty).replace(',', '.')) || 0;
        const itemTotalNum = parseFloat(standardizedValue) || 0;
        if (qtyNum > 0) {
          item.price = String(roundToPrecision(itemTotalNum / qtyNum, 4));
        } else {
          item.price = '0';
        }
      }

      newItems[index] = item;
      return newItems;
    });
  }, [setOrderItems, productMap, packingUnitMap, piecePackingUnitId, selectedCurrency]);

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