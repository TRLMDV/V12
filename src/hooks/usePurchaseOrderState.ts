"use client";

import { useState, useEffect, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { PurchaseOrder, Product, Supplier, Warehouse, Currency, PackingUnit, PurchaseOrderItemState } from '@/types';
import { formatNumberInput, roundToPrecision } from '@/utils/formatters'; // Import the new formatter
import { format, parseISO, getHours, getMinutes } from 'date-fns'; // Import date-fns utilities

interface UsePurchaseOrderStateProps {
  orderId?: number;
}

export const usePurchaseOrderState = ({ orderId }: UsePurchaseOrderStateProps) => {
  const { purchaseOrders, suppliers, warehouses, products, settings, getNextId, packingUnits } = useData();
  const isEdit = orderId !== undefined;
  const mainCurrency = settings.mainCurrency;

  const supplierMap = useMemo(() => suppliers.reduce((acc, s) => ({ ...acc, [s.id]: s }), {} as { [key: number]: Supplier }), [suppliers]);
  const productMap = useMemo(() => products.reduce((acc, p) => ({ ...acc, [p.id]: p }), {} as { [key: number]: Product }), [products]);
  const warehouseMap = useMemo(() => warehouses.reduce((acc, w) => ({ ...acc, [w.id]: w }), {} as { [key: number]: Warehouse }), [warehouses]);
  const packingUnitMap = useMemo(() => packingUnits.reduce((acc, pu) => ({ ...acc, [pu.id]: pu }), {} as { [key: number]: PackingUnit }), [packingUnits]);
  const activeCurrencies = useMemo(() => settings.activeCurrencies || ['AZN'], [settings.activeCurrencies]);

  const [order, setOrder] = useState<Partial<PurchaseOrder>>(() => {
    if (isEdit && orderId !== undefined) {
      const existingOrder = purchaseOrders.find(o => o.id === orderId);
      if (existingOrder) return {
        ...existingOrder,
        fees: roundToPrecision(existingOrder.fees || 0, 4), // Format fees here
      };
    }
    const defaultWarehouse = warehouses.length > 0 ? warehouses[0].id : undefined;
    return {
      orderDate: new Date().toISOString(), // Store as ISO string
      status: 'Draft',
      currency: 'AZN',
      warehouseId: defaultWarehouse, // Set default warehouseId
      fees: 0, // Renamed from transportationFees, customFees, additionalFees
      feesCurrency: 'AZN', // Renamed from transportationFeesCurrency, customFeesCurrency, additionalFeesCurrency
      feesExchangeRate: undefined, // New: Default undefined
      comment: '', // New: Default empty comment
      total: 0,
    };
  });

  const [orderItems, setOrderItems] = useState<PurchaseOrderItemState[]>(() => {
    if (isEdit && orderId !== undefined) {
      const existingOrder = purchaseOrders.find(o => o.id === orderId);
      if (existingOrder) return existingOrder.items.map(item => ({
        productId: item.productId,
        qty: formatNumberInput(roundToPrecision(item.qty, 4)), // Apply formatter
        price: formatNumberInput(roundToPrecision(item.price, 4)), // Apply formatter
        itemTotal: formatNumberInput(roundToPrecision(item.qty * item.price, 4)), // Apply formatter
        currency: item.currency || existingOrder.currency,
        landedCostPerUnit: item.landedCostPerUnit,
        packingUnitId: item.packingUnitId,
        packingQuantity: formatNumberInput(roundToPrecision(item.packingQuantity || 0, 4)), // Apply formatter
      }));
    }
    return [{ productId: '', qty: '', price: '', itemTotal: '', packingUnitId: undefined, packingQuantity: '' }];
  });

  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(mainCurrency);
  const [manualExchangeRate, setManualExchangeRate] = useState<number | undefined>(undefined);
  const [manualExchangeRateInput, setManualExchangeRateInput] = useState<string>('');
  const [manualFeesExchangeRate, setManualFeesExchangeRate] = useState<number | undefined>(undefined); // New state for fees exchange rate
  const [manualFeesExchangeRateInput, setManualFeesExchangeRateInput] = useState<string>(''); // New state for fees exchange rate input
  const [openComboboxIndex, setOpenComboboxIndex] = useState<number | null>(null); // State for which product combobox is open

  // New states for date and time components
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedHour, setSelectedHour] = useState(String(new Date().getHours()).padStart(2, '0'));
  const [selectedMinute, setSelectedMinute] = useState(String(new Date().getMinutes()).padStart(2, '0'));

  const [isFormInitialized, setIsFormInitialized] = useState(false);

  useEffect(() => {
    if (isEdit && orderId !== undefined) {
      const existingOrder = purchaseOrders.find(o => o.id === orderId);
      if (existingOrder) {
        setOrder({
          ...existingOrder,
          fees: roundToPrecision(existingOrder.fees || 0, 4), // Format fees here
        });
        setOrderItems(existingOrder.items.map(item => ({
          productId: item.productId,
          qty: formatNumberInput(roundToPrecision(item.qty, 4)), // Apply formatter
          price: formatNumberInput(roundToPrecision(item.price, 4)), // Apply formatter
          itemTotal: formatNumberInput(roundToPrecision(item.qty * item.price, 4)), // Apply formatter
          currency: item.currency || existingOrder.currency,
          landedCostPerUnit: item.landedCostPerUnit,
          packingUnitId: item.packingUnitId,
          packingQuantity: formatNumberInput(roundToPrecision(item.packingQuantity || 0, 4)), // Apply formatter
        })));
        setSelectedCurrency(existingOrder.currency);
        setManualExchangeRate(existingOrder.exchangeRate);
        setManualExchangeRateInput(existingOrder.exchangeRate !== undefined ? formatNumberInput(roundToPrecision(existingOrder.exchangeRate, 4)) : ''); // Apply formatter
        setManualFeesExchangeRate(existingOrder.feesExchangeRate); // Load existing fees exchange rate
        setManualFeesExchangeRateInput(existingOrder.feesExchangeRate !== undefined ? formatNumberInput(roundToPrecision(existingOrder.feesExchangeRate, 4)) : ''); // Load existing fees exchange rate input
        
        // Set date and time components from existing orderDate
        const existingDate = parseISO(existingOrder.orderDate);
        setDate(format(existingDate, 'yyyy-MM-dd'));
        setSelectedHour(String(getHours(existingDate)).padStart(2, '0'));
        setSelectedMinute(String(getMinutes(existingDate)).padStart(2, '0'));

        setIsFormInitialized(true);
      }
    } else if (!isEdit && !isFormInitialized) {
      const defaultWarehouse = warehouses.length > 0 ? warehouses[0].id : undefined; // Also set here for re-initialization
      setOrder({
        orderDate: new Date().toISOString(), // Reset to ISO string
        status: 'Draft',
        currency: 'AZN',
        warehouseId: defaultWarehouse, // Set default warehouseId
        fees: 0, // Reset fees
        feesCurrency: 'AZN', // Reset fees currency
        feesExchangeRate: undefined, // Reset fees exchange rate
        comment: '', // Reset comment
        total: 0,
      });
      setOrderItems([{ productId: '', qty: '', price: '', itemTotal: '', packingUnitId: undefined, packingQuantity: '' }]);
      setSelectedCurrency('AZN');
      setManualExchangeRate(undefined);
      setManualExchangeRateInput('');
      setManualFeesExchangeRate(undefined); // Reset fees exchange rate
      setManualFeesExchangeRateInput(''); // Reset fees exchange rate input
      setOpenComboboxIndex(null);

      // Reset date and time components
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setSelectedHour(String(new Date().getHours()).padStart(2, '0'));
      setSelectedMinute(String(new Date().getMinutes()).padStart(2, '0'));

      setIsFormInitialized(true);
    }
  }, [orderId, isEdit, purchaseOrders, products, getNextId, isFormInitialized, mainCurrency, packingUnits, warehouses]);

  // Effect to update manualFeesExchangeRate when feesCurrency changes
  useEffect(() => {
    if (order.feesCurrency && order.feesCurrency !== 'AZN') {
      const defaultRate = settings.currencyRates[order.feesCurrency];
      setManualFeesExchangeRate(defaultRate);
      setManualFeesExchangeRateInput(formatNumberInput(roundToPrecision(defaultRate, 4))); // Apply formatter
    } else {
      setManualFeesExchangeRate(undefined);
      setManualFeesExchangeRateInput('');
    }
  }, [order.feesCurrency, settings.currencyRates]);

  // Effect to update the order.orderDate when date, selectedHour, or selectedMinute changes
  useEffect(() => {
    if (date && selectedHour && selectedMinute) {
      const combinedDateTime = `${date}T${selectedHour}:${selectedMinute}:00.000Z`;
      setOrder(prev => ({ ...prev, orderDate: combinedDateTime }));
    }
  }, [date, selectedHour, selectedMinute, setOrder]);


  return {
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
    manualFeesExchangeRate, // New: Return fees exchange rate
    setManualFeesExchangeRate, // New: Return setter for fees exchange rate
    manualFeesExchangeRateInput, // New: Return fees exchange rate input
    setManualFeesExchangeRateInput, // New: Return setter for fees exchange rate input
    openComboboxIndex,
    setOpenComboboxIndex,
    supplierMap,
    productMap,
    warehouseMap,
    packingUnitMap, // Pass packingUnitMap
    activeCurrencies,
    mainCurrency,
    isEdit,
    products, // Pass products array for combobox
    suppliers, // Pass suppliers array for dropdown
    warehouses, // Pass warehouses array for dropdown
    packingUnits, // Pass packingUnits array for dropdown
    date, // New: Return date state
    setDate, // New: Return setDate
    selectedHour, // New: Return selectedHour state
    setSelectedHour, // New: Return setSelectedHour
    selectedMinute, // New: Return selectedMinute state
    setSelectedMinute, // New: Return setSelectedMinute
  };
};