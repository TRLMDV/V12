"use client";

import { useCallback } from 'react';
import { useData } from '@/context/DataContext';
import { SellOrder, Product, Currency, PackingUnit } from '@/types';
import { formatNumberInput } from '@/utils/formatters'; // Import the new formatter

interface SellOrderItemState {
  productId: number | '';
  qty: number | string; // This will be the quantity in base units
  price: number | string;
  itemTotal: number | string;
  cleanProfit?: number; // New field for calculated clean profit per item
  landedCost?: number; // Added: Landed cost for the product
  packingUnitId?: number; // New: ID of the selected packing unit
  packingQuantity?: number | string; // New: Quantity in terms of the selected packing unit
}

interface UseSellOrderHandlersProps {
  setOrder: React.Dispatch<React.SetStateAction<Partial<SellOrder>>>;
  setOrderItems: React.Dispatch<React.SetStateAction<SellOrderItemState[]>>;
  setSelectedCurrency: React.Dispatch<React.SetStateAction<Currency>>;
  setManualExchangeRate: React.Dispatch<React.SetStateAction<number | undefined>>;
  setManualExchangeRateInput: React.Dispatch<React.SetStateAction<string>>;
  productMap: { [key: number]: Product };
  packingUnitMap: { [key: number]: PackingUnit }; // New: Pass packingUnitMap
  setIsWarehouseManuallySet: React.Dispatch<React.SetStateAction<boolean>>; // New: Pass setIsWarehouseManuallySet
}

export const useSellOrderHandlers = ({
  setOrder,
  setOrderItems,
  setSelectedCurrency,
  setManualExchangeRate,
  setManualExchangeRateInput,
  productMap,
  packingUnitMap, // Destructure new prop
  setIsWarehouseManuallySet, // Destructure new prop
}: UseSellOrderHandlersProps) => {
  const { currencyRates, packingUnits } = useData(); // Get packingUnits to find 'Piece'

  // Find the 'Piece' packing unit ID once
  const piecePackingUnitId = packingUnits.find(pu => pu.name === 'Piece')?.id;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setOrder(prev => ({ ...prev, [id]: value }));
  }, [setOrder]);

  const handleNumericChange = useCallback((id: keyof SellOrder, value: string) => {
    setOrder(prev => ({ ...prev, [id]: parseFloat(value) || 0 }));
  }, [setOrder]);

  const handleSelectChange = useCallback((id: keyof SellOrder, value: string) => {
    setOrder(prev => ({ ...prev, [id]: value }));
    if (id === 'warehouseId') {
      setIsWarehouseManuallySet(true); // Set flag when warehouse is manually changed
    }
  }, [setOrder, setIsWarehouseManuallySet]);

  const handleCurrencyChange = useCallback((value: Currency) => {
    setSelectedCurrency(value);
    setOrder(prev => ({ ...prev, currency: value }));
    if (value === 'AZN') {
      setManualExchangeRate(undefined);
      setManualExchangeRateInput('');
    } else {
      const defaultRate = currencyRates[value];
      setManualExchangeRate(defaultRate);
      setManualExchangeRateInput(formatNumberInput(defaultRate)); // Apply formatter
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
      landedCost: undefined,
      packingUnitId: piecePackingUnitId, // Default to 'Piece'
      packingQuantity: '',
    }]);
  }, [setOrderItems, piecePackingUnitId]);

  const removeOrderItem = useCallback((index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  }, [setOrderItems]);

  const handleOrderItemChange = useCallback((index: number, field: keyof SellOrderItemState, value: any) => {
    setOrderItems(prev => {
      const newItems = [...prev];
      const item = { ...newItems[index] };
      let shouldRecalculateItemTotalAtEnd = true; // Flag to control the final recalculation

      if (field === 'productId') {
        item.productId = value;
        const selectedProduct = productMap[value as number];
        item.landedCost = selectedProduct?.averageLandedCost;
        // Set default packing unit to 'Piece' if not already set
        if (item.packingUnitId === undefined || item.packingUnitId === null) {
          item.packingUnitId = piecePackingUnitId;
        }
      } else if (field === 'packingUnitId') {
        item.packingUnitId = value === 'none-selected' ? undefined : parseInt(value);
        // Recalculate base qty if packing quantity exists
        const packingQtyNum = parseFloat(String(item.packingQuantity)) || 0;
        const selectedPackingUnit = item.packingUnitId ? packingUnitMap[item.packingUnitId] : undefined;
        if (selectedPackingUnit && packingQtyNum > 0) {
          item.qty = formatNumberInput(packingQtyNum * selectedPackingUnit.conversionFactor);
        } else {
          item.qty = ''; // Clear base qty if no valid packing unit or quantity
        }
      } else if (field === 'packingQuantity') {
        item.packingQuantity = value;
        const packingQtyNum = parseFloat(value) || 0;
        const selectedPackingUnit = item.packingUnitId ? packingUnitMap[item.packingUnitId] : undefined;
        if (selectedPackingUnit && packingQtyNum > 0) {
          item.qty = formatNumberInput(packingQtyNum * selectedPackingUnit.conversionFactor);
        } else {
          item.qty = ''; // Clear base qty if no valid packing unit or quantity
        }
      } else if (field === 'price') {
        item.price = value;
      } else if (field === 'itemTotal') {
        const parsedValue = parseFloat(value) || 0;
        item.itemTotal = formatNumberInput(parsedValue); // Format user input for itemTotal
        const qtyNum = parseFloat(String(item.qty)) || 0;
        const itemTotalNum = parseFloat(item.itemTotal) || 0; // Use the formatted itemTotal for price calculation
        if (qtyNum > 0) {
          item.price = formatNumberInput(itemTotalNum / qtyNum);
        } else {
          item.price = '0';
        }
        shouldRecalculateItemTotalAtEnd = false; // User explicitly set itemTotal, do not recalculate at the end
      }
      
      // Recalculate itemTotal based on base qty and price, but only if not explicitly set by user
      if (shouldRecalculateItemTotalAtEnd) {
        const finalQtyNum = parseFloat(String(item.qty)) || 0;
        const finalPriceNum = parseFloat(String(item.price)) || 0;
        item.itemTotal = formatNumberInput(finalQtyNum * finalPriceNum);
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