"use client";

import { useState, useEffect, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { MOCK_CURRENT_DATE } from '@/data/initialData';
import { SellOrder, Product, Customer, Warehouse, Currency, PackingUnit } from '@/types';
import { formatNumberInput, roundToPrecision } from '@/utils/formatters'; // Import the new formatter
import { format, parseISO, getHours, getMinutes } from 'date-fns'; // Import date-fns utilities

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
      orderDate: MOCK_CURRENT_DATE.toISOString(), // Store as ISO string
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
        qty: formatNumberInput(roundToPrecision(item.qty, 4)), // Apply formatter
        price: formatNumberInput(roundToPrecision(item.price, 4)), // Apply formatter
        itemTotal: formatNumberInput(roundToPrecision(item.qty * item.price, 4)), // Apply formatter
        landedCost: productMap[item.productId]?.averageLandedCost,
        packingUnitId: item.packingUnitId, // Load existing packing unit
        packingQuantity: formatNumberInput(roundToPrecision(item.packingQuantity || 0, 4)), // Apply formatter
      }));
    }
    return [{ productId: '', qty: '', price: '', itemTotal: '', landedCost: undefined, packingUnitId: undefined, packingQuantity: '' }];
  });

  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(mainCurrency);
  const [manualExchangeRate, setManualExchangeRate] = useState<number | undefined>(undefined);
  const [manualExchangeRateInput, setManualExchangeRateInput] = useState<string>('');
  const [openComboboxIndex, setOpenComboboxIndex] = useState<number | null>(null); // State for which product combobox is open
  const [isWarehouseManuallySet, setIsWarehouseManuallySet] = useState(false); // New state to track manual warehouse selection

  // New states for date and time components
  const [date, setDate] = useState(format(MOCK_CURRENT_DATE, 'yyyy-MM-dd'));
  const [selectedHour, setSelectedHour] = useState(String(MOCK_CURRENT_DATE.getHours()).padStart(2, '0'));
  const [selectedMinute, setSelectedMinute] = useState(String(MOCK_CURRENT_DATE.getMinutes()).padStart(2, '0'));

  const [isFormInitialized, setIsFormInitialized] = useState(false);

  useEffect(() => {
    if (isEdit && orderId !== undefined) {
      const existingOrder = sellOrders.find(o => o.id === orderId);
      if (existingOrder) {
        setOrder(existingOrder);
        setOrderItems((existingOrder.items || []).map(item => ({ // Added defensive || []
          productId: item.productId,
          qty: formatNumberInput(roundToPrecision(item.qty, 4)),
          price: formatNumberInput(roundToPrecision(item.price, 4)),
          itemTotal: formatNumberInput(roundToPrecision(item.qty * item.price, 4)),
          landedCost: productMap[item.productId]?.averageLandedCost,
          packingUnitId: item.packingUnitId,
          packingQuantity: formatNumberInput(roundToPrecision(item.packingQuantity || 0, 4)),
        })));
        setSelectedCurrency(existingOrder.currency);
        setManualExchangeRate(existingOrder.exchangeRate);
        setManualExchangeRateInput(existingOrder.exchangeRate !== undefined ? formatNumberInput(roundToPrecision(existingOrder.exchangeRate, 4)) : ''); // Apply formatter
        setIsWarehouseManuallySet(false); // Reset on edit, assume default unless user changes
        
        // Set date and time components from existing orderDate
        const existingDate = parseISO(existingOrder.orderDate);
        setDate(format(existingDate, 'yyyy-MM-dd'));
        setSelectedHour(String(getHours(existingDate)).padStart(2, '0'));
        setSelectedMinute(String(getMinutes(existingDate)).padStart(2, '0'));

        setIsFormInitialized(true);
      }
    } else if (!isEdit && !isFormInitialized) {
      setOrder({
        id: getNextId('sellOrders'),
        orderDate: MOCK_CURRENT_DATE.toISOString(), // Reset to ISO string
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
      setIsWarehouseManuallySet(false); // Reset for new order

      // Reset date and time components
      setDate(format(MOCK_CURRENT_DATE, 'yyyy-MM-dd'));
      setSelectedHour(String(MOCK_CURRENT_DATE.getHours()).padStart(2, '0'));
      setSelectedMinute(String(MOCK_CURRENT_DATE.getMinutes()).padStart(2, '0'));

      setIsFormInitialized(true);
    }
  }, [orderId, isEdit, sellOrders, settings.defaultVat, getNextId, isFormInitialized, productMap, mainCurrency, packingUnits]);

  // Effect to set default warehouse when customer changes, respecting manual override
  useEffect(() => {
    if (order.contactId && !isWarehouseManuallySet) { // Only auto-set if not manually overridden
      const selectedCustomer = customerMap[order.contactId];
      if (selectedCustomer && selectedCustomer.defaultWarehouseId !== undefined) {
        // Only set if the current warehouse is different from the customer's default
        if (order.warehouseId !== selectedCustomer.defaultWarehouseId) {
          setOrder(prev => ({ ...prev, warehouseId: selectedCustomer.defaultWarehouseId }));
        }
      } else if (order.warehouseId !== undefined) {
        // If customer has no default, and a warehouse is currently selected (which wasn't manually set), clear it
        setOrder(prev => ({ ...prev, warehouseId: undefined }));
      }
    }
  }, [order.contactId, customerMap, order.warehouseId, isWarehouseManuallySet, setOrder, warehouses]);

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
    openComboboxIndex, // Return openComboboxIndex
    setOpenComboboxIndex, // Return setOpenComboboxIndex
    isWarehouseManuallySet, // New: Return isWarehouseManuallySet
    setIsWarehouseManuallySet, // New: Return setIsWarehouseManuallySet
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
    date, // New: Return date state
    setDate, // New: Return setDate
    selectedHour, // New: Return selectedHour state
    setSelectedHour, // New: Return setSelectedHour
    selectedMinute, // New: Return selectedMinute state
    setSelectedMinute, // New: Return setSelectedMinute
  };
};