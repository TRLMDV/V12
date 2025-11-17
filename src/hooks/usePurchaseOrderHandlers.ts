"use client";

import { useCallback } from 'react';
import { useData } from '@/context/DataContext';
import { PurchaseOrder, Product, Currency, PackingUnit, PurchaseOrderItemState } from '@/types';

interface UsePurchaseOrderHandlersProps {
  setOrder: React.Dispatch<React.SetStateAction<Partial<PurchaseOrder>>>;
  setOrderItems: React.Dispatch<React.SetStateAction<PurchaseOrderItemState[]>>;
  setSelectedCurrency: React.Dispatch<React.SetStateAction<Currency>>;
  setManualExchangeRate: React.Dispatch<React.SetStateAction<number | undefined>>;
  setManualExchangeRateInput: React.Dispatch<React.SetStateAction<string>>;
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
          item.qty = String(currentDisplayQty * selectedPackingUnit.conversionFactor);
        } else {
          // If 'none-selected' is chosen, treat current input as base qty
          item.qty = String(currentDisplayQty);
          item.packingQuantity = ''; // Clear packing quantity as no unit is selected
        }
        // After updating qty, recalculate itemTotal
        const finalQtyNum = parseFloat(String(item.qty)) || 0;
        const finalPriceNum = parseFloat(String(item.price)) || 0;
        item.itemTotal = String(finalQtyNum * finalPriceNum);
      } else if (field === 'packingQuantity') {
        const inputValue = String(value);
        const parsedValue = parseFloat(inputValue) || 0;

        const selectedPackingUnit = item.packingUnitId ? packingUnitMap[item.packingUnitId] : undefined;

        if (selectedPackingUnit && item.packingUnitId !== undefined && item.packingUnitId !== null && item.packingUnitId !== 0) { // Check if a valid packing unit is selected
          item.packingQuantity = inputValue;
          item.qty = String(parsedValue * selectedPackingUnit.conversionFactor);
        } else {
          // If no packing unit selected, treat input as base quantity
          item.qty = inputValue; // Store as string for consistency with other inputs
          item.packingQuantity = ''; // Clear packingQuantity if no unit is selected
        }
        // After updating qty, recalculate itemTotal
        const finalQtyNum = parseFloat(String(item.qty)) || 0;
        const finalPriceNum = parseFloat(String(item.price)) || 0;
        item.itemTotal = String(finalQtyNum * finalPriceNum);
      } else if (field === 'price') {
        item.price = value;
        // After updating price, recalculate itemTotal
        const finalQtyNum = parseFloat(String(item.qty)) || 0;
        const finalPriceNum = parseFloat(String(item.price)) || 0;
        item.itemTotal = String(finalQtyNum * finalPriceNum);
      } else if (field === 'itemTotal') {
        item.itemTotal = value; // User's input for itemTotal
        const qtyNum = parseFloat(String(item.qty)) || 0;
        const itemTotalNum = parseFloat(value) || 0;
        if (qtyNum > 0) {
          item.price = String(itemTotalNum / qtyNum); // Calculate price based on user's itemTotal
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
    addOrderItem,
    removeOrderItem,
    handleOrderItemChange,
  };
};

export default usePurchaseOrderHandlers;