"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useData, MOCK_CURRENT_DATE } from '@/context/DataContext';
import { t } from '@/utils/i18n';
import { toast } from 'sonner';
import { SellOrder, Product, Customer, Warehouse, OrderItem, ProductMovement, Payment, Currency } from '@/types'; // Import types from types file

interface SellOrderItemState {
  productId: number | '';
  qty: number | string; // Allow string for intermediate input
  price: number | string; // Allow string for intermediate input
  itemTotal: number | string; // Allow string for intermediate input
  cleanProfit?: number; // New field for calculated clean profit per item
  landedCost?: number; // Added: Landed cost for the product
}

interface UseSellOrderFormProps {
  orderId?: number;
  onSuccess: () => void;
}

export const useSellOrderForm = ({ orderId, onSuccess }: UseSellOrderFormProps) => {
  const {
    sellOrders,
    customers,
    warehouses,
    products,
    settings,
    saveItem,
    updateStockFromOrder,
    showAlertModal,
    setProducts,
    getNextId,
    incomingPayments, // Added to check for existing payments
    currencyRates, // Added currencyRates
    convertCurrency, // Added convertCurrency utility
  } = useData();

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
      currency: mainCurrency, // Default to main currency
    };
  });

  const [orderItems, setOrderItems] = useState<SellOrderItemState[]>(() => {
    if (isEdit && orderId !== undefined) {
      const existingOrder = sellOrders.find(o => o.id === orderId);
      if (existingOrder) return existingOrder.items.map(item => ({
        productId: item.productId,
        qty: String(item.qty), // Convert to string for input
        price: String(item.price), // Convert to string for input
        itemTotal: String(item.qty * item.price), // Calculate initial itemTotal and convert to string
        landedCost: productMap[item.productId]?.averageLandedCost, // Populate landed cost
      }));
    }
    return [{ productId: '', qty: '', price: '', itemTotal: '', landedCost: undefined }]; // Initialize itemTotal as string
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
          landedCost: productMap[item.productId]?.averageLandedCost, // Populate landed cost
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
        currency: mainCurrency, // Default to main currency
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
        // Only set if the warehouse hasn't been manually selected or if it's a new order
        // or if the current warehouse is not valid/set
        if (!order.warehouseId || !warehouses.some(w => w.id === order.warehouseId)) {
          setOrder(prev => ({ ...prev, warehouseId: selectedCustomer.defaultWarehouseId }));
        }
      }
    }
  }, [order.contactId, customerMap, order.warehouseId, warehouses]);

  const currentExchangeRateToAZN = useMemo(() => {
    if (selectedCurrency === 'AZN') return 1;
    return manualExchangeRate !== undefined ? manualExchangeRate : currencyRates[selectedCurrency];
  }, [selectedCurrency, manualExchangeRate, currencyRates]);

  const currentExchangeRateToMainCurrency = useMemo(() => {
    if (selectedCurrency === mainCurrency) return 1;
    // Convert selectedCurrency to AZN, then AZN to mainCurrency
    const rateSelectedToAZN = currentExchangeRateToAZN;
    const rateAZNToMain = 1 / (currencyRates[mainCurrency] || 1); // Rate of 1 AZN to mainCurrency
    return rateSelectedToAZN * rateAZNToMain;
  }, [selectedCurrency, mainCurrency, currentExchangeRateToAZN, currencyRates]);


  const calculateOrderFinancials = useCallback(() => {
    let subtotalInOrderCurrency = 0;
    let totalCleanProfitInMainCurrency = 0;
    const updatedOrderItemsWithProfit: SellOrderItemState[] = [];

    orderItems.forEach(item => {
      const itemTotalNum = parseFloat(String(item.itemTotal)) || 0;
      const qtyNum = parseFloat(String(item.qty)) || 0;
      const priceNum = parseFloat(String(item.price)) || 0;
      
      let itemCleanProfit = 0;

      if (item.productId && qtyNum > 0 && priceNum > 0) {
        subtotalInOrderCurrency += itemTotalNum;
        const product = productMap[item.productId as number];
        if (product) {
          // Convert item price from order currency to main currency for profit calculation
          const itemPriceInMainCurrency = convertCurrency(priceNum, selectedCurrency, mainCurrency);
          itemCleanProfit = (itemPriceInMainCurrency - (product.averageLandedCost || 0)) * qtyNum;
        }
      }
      updatedOrderItemsWithProfit.push({ ...item, cleanProfit: itemCleanProfit });
      totalCleanProfitInMainCurrency += itemCleanProfit;
    });

    // Convert subtotal from order currency to main currency before applying VAT
    const subtotalInMainCurrency = convertCurrency(subtotalInOrderCurrency, selectedCurrency, mainCurrency);
    const vatAmountInMainCurrency = subtotalInMainCurrency * ((order.vatPercent || 0) / 100);
    const totalWithVatInMainCurrency = parseFloat((subtotalInMainCurrency + vatAmountInMainCurrency).toFixed(2));

    return {
      subtotalInOrderCurrency,
      subtotalInMainCurrency,
      totalVatAmountInMainCurrency: parseFloat(vatAmountInMainCurrency.toFixed(2)),
      totalWithVatInMainCurrency,
      totalCleanProfitInMainCurrency: parseFloat(totalCleanProfitInMainCurrency.toFixed(2)),
      updatedOrderItemsWithProfit,
    };
  }, [orderItems, order.vatPercent, productMap, selectedCurrency, mainCurrency, convertCurrency]);

  const {
    subtotalInOrderCurrency,
    subtotalInMainCurrency,
    totalVatAmountInMainCurrency,
    totalWithVatInMainCurrency,
    totalCleanProfitInMainCurrency,
    updatedOrderItemsWithProfit
  } = calculateOrderFinancials();

  useEffect(() => {
    setOrder(prev => ({ ...prev, total: totalWithVatInMainCurrency }));
    setOrderItems(updatedOrderItemsWithProfit); // Update order items with calculated clean profit
  }, [totalWithVatInMainCurrency, updatedOrderItemsWithProfit]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setOrder(prev => ({ ...prev, [id]: value }));
  }, []);

  const handleNumericChange = useCallback((id: keyof SellOrder, value: string) => {
    setOrder(prev => ({ ...prev, [id]: parseFloat(value) || 0 }));
  }, []);

  const handleSelectChange = useCallback((id: keyof SellOrder, value: string) => {
    setOrder(prev => ({ ...prev, [id]: value }));
  }, []);

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
  }, [currencyRates]);

  const handleExchangeRateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue === '' || /^-?\d*\.?\d*$/.test(inputValue)) {
      setManualExchangeRateInput(inputValue);
      const parsedValue = parseFloat(inputValue);
      setManualExchangeRate(isNaN(parsedValue) ? undefined : parsedValue);
    }
  }, []);

  const addOrderItem = useCallback(() => {
    setOrderItems(prev => [...prev, { productId: '', qty: '', price: '', itemTotal: '', landedCost: undefined }]);
  }, []);

  const removeOrderItem = useCallback((index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleOrderItemChange = useCallback((index: number, field: keyof SellOrderItemState, value: any) => {
    setOrderItems(prev => {
      const newItems = [...prev];
      const item = { ...newItems[index] };

      if (field === 'productId') {
        item.productId = value;
        const selectedProduct = productMap[value as number];
        item.landedCost = selectedProduct?.averageLandedCost; // Update landed cost when product changes
      } else if (field === 'qty') {
        item.qty = value; // Store raw string
        const qtyNum = parseFloat(value) || 0;
        const priceNum = parseFloat(String(item.price)) || 0;
        item.itemTotal = String(qtyNum * priceNum);
      } else if (field === 'price') {
        item.price = value; // Store raw string
        const qtyNum = parseFloat(String(item.qty)) || 0;
        const priceNum = parseFloat(value) || 0;
        item.itemTotal = String(qtyNum * priceNum);
      } else if (field === 'itemTotal') {
        item.itemTotal = value; // Store raw string
        const qtyNum = parseFloat(String(item.qty)) || 0;
        const itemTotalNum = parseFloat(value) || 0;
        if (qtyNum > 0) {
          item.price = String(itemTotalNum / qtyNum);
        } else {
          item.price = '0';
        }
      }
      newItems[index] = item;
      return newItems;
    });
  }, [productMap]);

  const handleGenerateProductMovement = useCallback(() => {
    const orderToSave: SellOrder = {
      ...order,
      id: order.id || getNextId('sellOrders'),
      contactId: order.contactId as number,
      warehouseId: order.warehouseId as number,
      orderDate: order.orderDate || MOCK_CURRENT_DATE.toISOString().slice(0, 10),
      status: order.status || 'Draft',
      items: orderItems.filter(item => item.productId !== '' && parseFloat(String(item.qty)) > 0 && parseFloat(String(item.price)) >= 0).map(item => ({
        productId: item.productId as number,
        qty: parseFloat(String(item.qty)) || 0,
        price: parseFloat(String(item.price)) || 0,
      })),
      vatPercent: order.vatPercent || 0,
      total: order.total || 0,
      currency: selectedCurrency,
      exchangeRate: selectedCurrency === 'AZN' ? undefined : currentExchangeRateToAZN,
    };

    if (!orderToSave.contactId || !orderToSave.warehouseId || !orderToSave.orderDate) {
      showAlertModal('Validation Error', 'Customer, Warehouse, and Order Date are required before generating a product movement.');
      return;
    }
    if (orderToSave.items.length === 0) {
      showAlertModal('Validation Error', 'Please add at least one valid order item with a product, quantity, and price before generating a product movement.');
      return;
    }

    saveItem('sellOrders', orderToSave);
    setOrder(orderToSave);

    if (orderToSave.productMovementId) {
      showAlertModal('Info', t('productMovementAlreadyGenerated'));
      return;
    }
    if (!mainWarehouse) {
      showAlertModal('Error', t('mainWarehouseNotFound'));
      return;
    }
    if (!orderToSave.warehouseId) {
      showAlertModal('Validation Error', t('selectDestinationWarehouse'));
      return;
    }
    if (mainWarehouse.id === orderToSave.warehouseId) {
      showAlertModal('Info', t('movementNotNeeded'));
      return;
    }

    const newMovementItems: { productId: number; quantity: number }[] = [];
    const productsCopy: Product[] = JSON.parse(JSON.stringify(products));

    for (const item of orderItems) {
      const qtyNum = parseFloat(String(item.qty)) || 0;
      if (!item.productId || qtyNum <= 0) {
        continue;
      }

      const product = productsCopy.find(p => p.id === item.productId);
      if (!product) {
        showAlertModal('Error', `Product with ID ${item.productId} not found.`);
        return;
      }

      const sourceStock = product.stock?.[mainWarehouse.id] || 0;
      if (sourceStock < qtyNum) {
        showAlertModal('Stock Error', `${t('notEnoughStock')} ${product.name} (${product.sku}) in ${mainWarehouse.name}. ${t('available')}: ${sourceStock}, ${t('requested')}: ${qtyNum}.`);
        return;
      }

      newMovementItems.push({ productId: item.productId as number, quantity: qtyNum });

      if (!product.stock) product.stock = {};
      product.stock[mainWarehouse.id] = sourceStock - qtyNum;
      product.stock[orderToSave.warehouseId as number] = (product.stock[orderToSave.warehouseId as number] || 0) + qtyNum;
    }

    if (newMovementItems.length === 0) {
      showAlertModal('Info', t('noValidProductsForMovement'));
      return;
    }

    setProducts(productsCopy);

    const newMovementId = getNextId('productMovements');
    const newMovement: ProductMovement = {
      id: newMovementId,
      sourceWarehouseId: mainWarehouse.id,
      destWarehouseId: orderToSave.warehouseId as number,
      items: newMovementItems,
      date: MOCK_CURRENT_DATE.toISOString().slice(0, 10),
    };

    saveItem('productMovements', newMovement);
    
    setOrder(prev => {
      const updatedOrder = { ...prev, productMovementId: newMovementId };
      saveItem('sellOrders', updatedOrder);
      return updatedOrder;
    });

    toast.success(t('success'), { description: `Product Movement #${newMovementId} generated successfully from ${mainWarehouse.name} to ${warehouseMap[orderToSave.warehouseId as number]?.name}.` });

  }, [order, orderItems, products, mainWarehouse, showAlertModal, setProducts, getNextId, saveItem, warehouseMap, sellOrders, selectedCurrency, currentExchangeRateToAZN]);

  const handleGenerateIncomingPayment = useCallback(() => {
    const orderToSave: SellOrder = {
      ...order,
      id: order.id || getNextId('sellOrders'),
      contactId: order.contactId as number,
      warehouseId: order.warehouseId as number,
      orderDate: order.orderDate || MOCK_CURRENT_DATE.toISOString().slice(0, 10),
      status: order.status || 'Draft',
      items: orderItems.filter(item => item.productId !== '' && parseFloat(String(item.qty)) > 0 && parseFloat(String(item.price)) >= 0).map(item => ({
        productId: item.productId as number,
        qty: parseFloat(String(item.qty)) || 0,
        price: parseFloat(String(item.price)) || 0,
      })),
      vatPercent: order.vatPercent || 0,
      total: order.total || 0,
      currency: selectedCurrency,
      exchangeRate: selectedCurrency === 'AZN' ? undefined : currentExchangeRateToAZN,
    };

    if (!orderToSave.contactId || !orderToSave.warehouseId || !orderToSave.orderDate) {
      showAlertModal('Validation Error', 'Customer, Warehouse, and Order Date are required before generating an incoming payment.');
      return;
    }
    if (orderToSave.items.length === 0) {
      showAlertModal('Validation Error', 'Please add at least one valid order item with a product, quantity, and price before generating an incoming payment.');
      return;
    }
    if (orderToSave.total === 0) {
      showAlertModal('Validation Error', 'Order total must be greater than zero to generate an incoming payment.');
      return;
    }

    // Save the order first to ensure it has an ID if it's new
    saveItem('sellOrders', orderToSave);
    setOrder(orderToSave); // Update local state with the potentially new ID

    if (orderToSave.incomingPaymentId) {
      showAlertModal('Info', t('incomingPaymentAlreadyGenerated'));
      return;
    }

    // Check if a payment for this order already exists in incomingPayments
    const existingPaymentForOrder = incomingPayments.find(p => p.orderId === orderToSave.id && p.paymentCategory === 'products');
    if (existingPaymentForOrder) {
      showAlertModal('Info', t('incomingPaymentAlreadyExists'));
      setOrder(prev => {
        const updatedOrder = { ...prev, incomingPaymentId: existingPaymentForOrder.id };
        saveItem('sellOrders', updatedOrder); // Link existing payment to order
        return updatedOrder;
      });
      return;
    }

    const newPaymentId = getNextId('incomingPayments');
    const newPayment: Payment = {
      id: newPaymentId,
      orderId: orderToSave.id as number,
      paymentCategory: 'products',
      date: orderToSave.orderDate,
      amount: orderToSave.total, // Amount is in mainCurrency
      paymentCurrency: mainCurrency, // Payment currency is mainCurrency
      method: t('autoGenerated'), // Default method
    };

    saveItem('incomingPayments', newPayment);

    setOrder(prev => {
      const updatedOrder = { ...prev, incomingPaymentId: newPaymentId };
      saveItem('sellOrders', updatedOrder);
      return updatedOrder;
    });

    toast.success(t('success'), { description: `${t('incomingPayment')} #${newPaymentId} ${t('generatedSuccessfully')}.` });

  }, [order, orderItems, showAlertModal, getNextId, saveItem, incomingPayments, sellOrders, selectedCurrency, currentExchangeRateToAZN, mainCurrency]);


  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (!order.contactId || !order.warehouseId || !order.orderDate) {
      showAlertModal('Validation Error', 'Customer, Warehouse, and Order Date are required.');
      return;
    }

    const validOrderItems = orderItems.filter(item => item.productId !== '' && parseFloat(String(item.qty)) > 0 && parseFloat(String(item.price)) >= 0);
    if (validOrderItems.length === 0) {
      showAlertModal('Validation Error', 'Please add at least one valid order item with a product, quantity, and price greater than zero.');
      return;
    }

    if (selectedCurrency !== 'AZN' && (!manualExchangeRate || manualExchangeRate <= 0)) {
      showAlertModal('Validation Error', 'Please enter a valid exchange rate for the selected currency.');
      return;
    }

    if (order.status === 'Shipped') {
      const productsInWarehouses: { [warehouseId: number]: { [productId: number]: number } } = {};
      products.forEach(p => {
        if (p.stock) {
          for (const warehouseId in p.stock) {
            if (!productsInWarehouses[parseInt(warehouseId)]) {
              productsInWarehouses[parseInt(warehouseId)] = {};
            }
            productsInWarehouses[parseInt(warehouseId)][p.id] = p.stock[parseInt(warehouseId)];
          }
        }
      });

      const currentOrderItems = isEdit ? sellOrders.find(o => o.id === orderId)?.items || [] : [];
      const currentOrderWarehouseId = isEdit ? sellOrders.find(o => o.id === orderId)?.warehouseId : undefined;

      for (const item of validOrderItems) {
        const productId = item.productId as number;
        const requestedQty = parseFloat(String(item.qty)) || 0;
        const warehouseId = order.warehouseId as number;

        let availableStock = productsInWarehouses[warehouseId]?.[productId] || 0;

        if (isEdit && currentOrderWarehouseId === warehouseId) {
          const oldItem = currentOrderItems.find(old => old.productId === productId);
          if (oldItem) {
            availableStock += oldItem.qty;
          }
        }

        if (availableStock < requestedQty) {
          const productName = productMap[productId]?.name || 'Unknown Product';
          showAlertModal('Stock Error', `${t('notEnoughStock')} ${productName}. ${t('available')}: ${availableStock}, ${t('requested')}: ${requestedQty}.`);
          return;
        }
      }
    }

    const finalOrderItems: OrderItem[] = validOrderItems.map(item => ({
      productId: item.productId as number,
      qty: parseFloat(String(item.qty)) || 0,
      price: parseFloat(String(item.price)) || 0, // This `item.price` will be the correct, possibly recalculated, unit price
    }));

    const orderToSave: SellOrder = {
      ...order,
      id: order.id || getNextId('sellOrders'),
      contactId: order.contactId as number,
      warehouseId: order.warehouseId as number,
      orderDate: order.orderDate || MOCK_CURRENT_DATE.toISOString().slice(0, 10),
      status: order.status || 'Draft',
      items: finalOrderItems,
      vatPercent: order.vatPercent || 0,
      total: order.total || 0,
      currency: selectedCurrency,
      exchangeRate: selectedCurrency === 'AZN' ? undefined : currentExchangeRateToAZN,
    };

    const oldOrder = isEdit ? sellOrders.find(o => o.id === orderToSave.id) : null;

    saveItem('sellOrders', orderToSave);
    updateStockFromOrder(orderToSave, oldOrder);
    onSuccess();
    toast.success(t('success'), { description: `Sell Order #${orderToSave.id || 'new'} saved successfully.` });
  }, [order, orderItems, products, isEdit, orderId, sellOrders, showAlertModal, productMap, getNextId, saveItem, updateStockFromOrder, onSuccess, selectedCurrency, manualExchangeRate, currentExchangeRateToAZN]);

  const isGenerateMovementDisabled = !!order.productMovementId;
  const isGeneratePaymentDisabled = !!order.incomingPaymentId || (order.total || 0) <= 0;


  return {
    order,
    setOrder,
    orderItems,
    setOrderItems,
    customerMap,
    productMap,
    warehouseMap,
    mainWarehouse,
    isGenerateMovementDisabled,
    isGeneratePaymentDisabled, // New return value
    handleChange,
    handleNumericChange,
    handleSelectChange,
    handleCurrencyChange, // New return value
    handleExchangeRateChange, // New return value
    addOrderItem,
    removeOrderItem,
    handleOrderItemChange,
    handleGenerateProductMovement,
    handleGenerateIncomingPayment, // New return value
    handleSubmit,
    showAlertModal,
    products,
    customers,
    warehouses,
    totalVatAmount: totalVatAmountInMainCurrency, // New return value
    totalCleanProfit: totalCleanProfitInMainCurrency, // New return value
    selectedCurrency, // New return value
    manualExchangeRateInput, // New return value
    mainCurrency, // New return value
    currentExchangeRateToMainCurrency, // New return value
    subtotalInOrderCurrency, // New return value
  };
};