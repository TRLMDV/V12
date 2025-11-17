"use client";

import { useState, useEffect, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { MOCK_CURRENT_DATE } from '@/data/initialData'; // Corrected import
import { SellOrder, Product, Customer, Warehouse, Currency, PackingUnit } from '@/types';

interface SellOrderItemState {
  productId: number | '';
  qty: number | string; // This will be the quantity in base units
  price: number | string;
  itemTotal: number | string;
  cleanProfit?: number;
  landedCost?: number;
  packingUnitId?: number; // New: ID of the selected packing unit
  packingQuantity?: number | string; // New: Quantity in terms of the selected packing unit
}

interface UseSellOrderStateProps {
  orderId?: number;
}

export const useSellOrderState = ({ orderId }: UseSellOrderStateProps) => {
  const { sellOrders, customers, warehouses, products, settings, getNextId, packingUnits } = useData();
  const isEdit = orderId !== undefined;
  const mainCurrency = settings.mainCurrency;

  const customerMap = useMemo(() => customers.reduce((acc, c) => ({ ...acc, [c.id]: c }), {} as { [key: number]: Customer }), [customers]);
  const productMap = useMemo(() => products.reduce((acc, p) => ({ ...acc, [p.id]: p }), {} as { [key: number]: Product }), [products]);
  const warehouseMap = useMemo(() => warehouses.reduce((acc, w) => ({ ...acc, [w.id]: w }), {} as { [key: number]: Warehouse }), [warehouses]);
  const packingUnitMap = useMemo(() => packingUnits.reduce((acc, pu) => ({ ...acc, [pu.id]: pu }), {} as { [key: number]: PackingUnit }), [packingUnits]);
  const activeCurrencies = useMemo(() => settings.activeCurrencies || ['AZN'], [settings.activeCurrencies]);

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
      if (existingOrder) return (existingOrder.items || []).map(item => ({ // Added defensive || []
        productId: item.productId,
        qty: String(item.qty), // Base unit quantity
        price: String(item.price),
        itemTotal: String(item.qty * item.price),
        landedCost: productMap[item.productId]?.averageLandedCost,
        packingUnitId: item.packingUnitId, // Load existing packing unit
        packingQuantity: String(item.packingQuantity || ''), // Load existing packing quantity
      }));
    }
    return [{ productId: '', qty: '', price: '', itemTotal: '', landedCost: undefined, packingUnitId: undefined, packingQuantity: '' }];
  });

  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(mainCurrency);
  const [manualExchangeRate, setManualExchangeRate] = useState<number | undefined>(undefined);
  const [manualExchangeRateInput, setManualExchangeRateInput] = useState<string>('');
  const [openComboboxIndex, setOpenComboboxIndex] = useState<number | null>(null); // State for which product combobox is open

  const [isFormInitialized, setIsFormInitialized] = useState(false);

  useEffect(() => {
    if (isEdit && orderId !== undefined) {
      const existingOrder = sellOrders.find(o => o.id === orderId);
      if (existingOrder) {
        setOrder(existingOrder);
        setOrderItems((existingOrder.items || []).map(item => ({ // Added defensive || []
          productId: item.productId,
          qty: String(item.qty),
          price: String(item.price),
          itemTotal: String(item.qty * item.price),
          landedCost: productMap[item.productId]?.averageLandedCost,
          packingUnitId: item.packingUnitId,
          packingQuantity: String(item.packingQuantity || ''),
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
      setOrderItems([{ productId: '', qty: '', price: '', itemTotal: '', landedCost: undefined, packingUnitId: undefined, packingQuantity: '' }]);
      setSelectedCurrency(mainCurrency);
      setManualExchangeRate(undefined);
      setManualExchangeRateInput('');
      setOpenComboboxIndex(null); // Reset for new order
      setIsFormInitialized(true);
    }
  }, [orderId, isEdit, sellOrders, settings.defaultVat, getNextId, isFormInitialized, productMap, mainCurrency, packingUnits]);

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
    openComboboxIndex, // Return openComboboxIndex
    setOpenComboboxIndex, // Return setOpenComboboxIndex
    customerMap,
    productMap,
    warehouseMap,
    mainWarehouse: warehouses.find(w => w.type === 'Main'), // Ensure mainWarehouse is always available
    packingUnitMap, // Pass packingUnitMap
    activeCurrencies,
    mainCurrency,
    isEdit,
    products, // Pass products array for combobox
    customers, // Pass customers array for dropdown
    warehouses, // Pass warehouses array for dropdown
    packingUnits, // Pass packingUnits array for dropdown
  };
};