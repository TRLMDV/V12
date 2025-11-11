"use client";

import { useState, useEffect, useMemo } from 'react';
import { useData, MOCK_CURRENT_DATE } from '@/context/DataContext';
import { PurchaseOrder, Product, Supplier, Warehouse, Currency } from '@/types';

interface PurchaseOrderItemState {
  productId: number | '';
  qty: number | string;
  price: number | string;
  itemTotal: number | string;
  currency?: Currency;
  landedCostPerUnit?: number;
}

interface UsePurchaseOrderStateProps {
  orderId?: number;
}

export const usePurchaseOrderState = ({ orderId }: UsePurchaseOrderStateProps) => {
  const { purchaseOrders, suppliers, warehouses, products, settings, getNextId } = useData();
  const isEdit = orderId !== undefined;
  const mainCurrency = settings.mainCurrency;

  const supplierMap = useMemo(() => suppliers.reduce((acc, s) => ({ ...acc, [s.id]: s }), {} as { [key: number]: Supplier }), [suppliers]);
  const productMap = useMemo(() => products.reduce((acc, p) => ({ ...acc, [p.id]: p }), {} as { [key: number]: Product }), [products]);
  const warehouseMap = useMemo(() => warehouses.reduce((acc, w) => ({ ...acc, [w.id]: w }), {} as { [key: number]: Warehouse }), [warehouses]);
  const activeCurrencies = useMemo(() => settings.activeCurrencies || ['AZN'], [settings.activeCurrencies]);

  const [order, setOrder] = useState<Partial<PurchaseOrder>>(() => {
    if (isEdit && orderId !== undefined) {
      const existingOrder = purchaseOrders.find(o => o.id === orderId);
      if (existingOrder) return existingOrder;
    }
    return {
      orderDate: MOCK_CURRENT_DATE.toISOString().slice(0, 10),
      status: 'Draft',
      currency: 'AZN',
      transportationFees: 0,
      transportationFeesCurrency: 'AZN',
      customFees: 0,
      customFeesCurrency: 'AZN',
      additionalFees: 0,
      additionalFeesCurrency: 'AZN',
      total: 0,
    };
  });

  const [orderItems, setOrderItems] = useState<PurchaseOrderItemState[]>(() => {
    if (isEdit && orderId !== undefined) {
      const existingOrder = purchaseOrders.find(o => o.id === orderId);
      if (existingOrder) return existingOrder.items.map(item => ({
        productId: item.productId,
        qty: String(item.qty),
        price: String(item.price),
        itemTotal: String(item.qty * item.price),
        currency: item.currency || existingOrder.currency,
        landedCostPerUnit: item.landedCostPerUnit,
      }));
    }
    return [{ productId: '', qty: '', price: '', itemTotal: '' }];
  });

  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(mainCurrency);
  const [manualExchangeRate, setManualExchangeRate] = useState<number | undefined>(undefined);
  const [manualExchangeRateInput, setManualExchangeRateInput] = useState<string>('');
  const [openComboboxIndex, setOpenComboboxIndex] = useState<number | null>(null); // State for which product combobox is open

  const [isFormInitialized, setIsFormInitialized] = useState(false);

  useEffect(() => {
    if (isEdit && orderId !== undefined) {
      const existingOrder = purchaseOrders.find(o => o.id === orderId);
      if (existingOrder) {
        setOrder(existingOrder);
        setOrderItems(existingOrder.items.map(item => ({
          productId: item.productId,
          qty: String(item.qty),
          price: String(item.price),
          itemTotal: String(item.qty * item.price),
          currency: item.currency || existingOrder.currency,
          landedCostPerUnit: item.landedCostPerUnit,
        })));
        setSelectedCurrency(existingOrder.currency);
        setManualExchangeRate(existingOrder.exchangeRate);
        setManualExchangeRateInput(existingOrder.exchangeRate !== undefined ? String(existingOrder.exchangeRate) : '');
        setIsFormInitialized(true);
      }
    } else if (!isEdit && !isFormInitialized) {
      setOrder({
        orderDate: MOCK_CURRENT_DATE.toISOString().slice(0, 10),
        status: 'Draft',
        currency: 'AZN',
        transportationFees: 0,
        transportationFeesCurrency: 'AZN',
        customFees: 0,
        customFeesCurrency: 'AZN',
        additionalFees: 0,
        additionalFeesCurrency: 'AZN',
        total: 0,
      });
      setOrderItems([{ productId: '', qty: '', price: '', itemTotal: '' }]);
      setSelectedCurrency('AZN');
      setManualExchangeRate(undefined);
      setManualExchangeRateInput('');
      setOpenComboboxIndex(null);
      setIsFormInitialized(true);
    }
  }, [orderId, isEdit, purchaseOrders, products, getNextId, isFormInitialized, mainCurrency]);

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
    openComboboxIndex,
    setOpenComboboxIndex,
    supplierMap,
    productMap,
    warehouseMap,
    activeCurrencies,
    mainCurrency,
    isEdit,
    products, // Pass products array for combobox
    suppliers, // Pass suppliers array for dropdown
    warehouses, // Pass warehouses array for dropdown
  };
};