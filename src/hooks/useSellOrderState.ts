"use client";

import { useState, useEffect, useMemo } from 'react';
import { useData, MOCK_CURRENT_DATE } from '@/context/DataContext';
import { SellOrder, Product, Customer, Warehouse, Currency } from '@/types';

interface SellOrderItemState {
  productId: number | '';
  qty: number | string;
  price: number | string;
  itemTotal: number | string;
  cleanProfit?: number;
  landedCost?: number;
}

interface UseSellOrderStateProps {
  orderId?: number;
}

export const useSellOrderState = ({ orderId }: UseSellOrderStateProps) => {
  const { sellOrders, customers, warehouses, products, settings, getNextId } = useData();
  const isEdit = orderId !== undefined;
  const mainCurrency = settings.mainCurrency;

  const customerMap = useMemo(() => customers.reduce((acc, c) => ({ ...acc, [c.id]: c }), {} as { [key: number]: Customer }), [customers]);
  const productMap = useMemo(() => products.reduce((acc, p) => ({ ...acc, [p.id]: p }), {} as { [key: number]: Product }), [products]);
  const warehouseMap = useMemo(() => warehouses.reduce((acc, w) => ({ ...acc, [w.id]: w }), {} as { [key: number]: Warehouse }), [warehouses]);
  const mainWarehouse = useMemo(() => warehouses.find(w => w.type === 'Main'), [warehouses]);

  const [order, setOrder] = useState<Partial<SellOrder>>(() => {
    if (isEdit && orderId !== undefined) {
      const existingOrder = sellOrders.find(o => o.id === orderId);
      if (existingOrder) return existingOrder;
    }
    return {
      id: getNextId('sellOrders'),
      orderDate: MOCK_CURRENT_DATE.toISOString().slice(0, 10),
      status: 'Draft',
      vatPercent: settings.defaultVat,
      total: 0,
      currency: mainCurrency,
    };
  });

  const [orderItems, setOrderItems] = useState<SellOrderItemState[]>(() => {
    if (isEdit && orderId !== undefined) {
      const existingOrder = sellOrders.find(o => o.id === orderId);
      if (existingOrder) return existingOrder.items.map(item => ({
        productId: item.productId,
        qty: String(item.qty),
        price: String(item.price),
        itemTotal: String(item.qty * item.price),
        landedCost: productMap[item.productId]?.averageLandedCost,
      }));
    }
    return [{ productId: '', qty: '', price: '', itemTotal: '', landedCost: undefined }];
  });

  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(mainCurrency);
  const [manualExchangeRate, setManualExchangeRate] = useState<number | undefined>(undefined);
  const [manualExchangeRateInput, setManualExchangeRateInput] = useState<string>('');

  const [isFormInitialized, setIsFormInitialized] = useState(false);

  useEffect(() => {
    if (isEdit && orderId !== undefined) {
      const existingOrder = sellOrders.find(o => o.id === orderId);
      if (existingOrder) {
        setOrder(existingOrder);
        setOrderItems(existingOrder.items.map(item => ({
          productId: item.productId,
          qty: String(item.qty),
          price: String(item.price),
          itemTotal: String(item.qty * item.price),
          landedCost: productMap[item.productId]?.averageLandedCost,
        })));
        setSelectedCurrency(existingOrder.currency);
        setManualExchangeRate(existingOrder.exchangeRate);
        setManualExchangeRateInput(existingOrder.exchangeRate !== undefined ? String(existingOrder.exchangeRate) : '');
        setIsFormInitialized(true);
      }
    } else if (!isEdit && !isFormInitialized) {
      setOrder({
        id: getNextId('sellOrders'),
        orderDate: MOCK_CURRENT_DATE.toISOString().slice(0, 10),
        status: 'Draft',
        vatPercent: settings.defaultVat,
        total: 0,
        currency: mainCurrency,
      });
      setOrderItems([{ productId: '', qty: '', price: '', itemTotal: '', landedCost: undefined }]);
      setSelectedCurrency(mainCurrency);
      setManualExchangeRate(undefined);
      setManualExchangeRateInput('');
      setIsFormInitialized(true);
    }
  }, [orderId, isEdit, sellOrders, settings.defaultVat, getNextId, isFormInitialized, productMap, mainCurrency]);

  // Effect to set default warehouse when customer changes
  useEffect(() => {
    if (order.contactId) {
      const selectedCustomer = customerMap[order.contactId];
      if (selectedCustomer && selectedCustomer.defaultWarehouseId !== undefined) {
        if (!order.warehouseId || !warehouses.some(w => w.id === order.warehouseId)) {
          setOrder(prev => ({ ...prev, warehouseId: selectedCustomer.defaultWarehouseId }));
        }
      }
    }
  }, [order.contactId, customerMap, order.warehouseId, warehouses]);

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
    customerMap,
    productMap,
    warehouseMap,
    mainWarehouse,
    mainCurrency,
    isEdit,
  };
};