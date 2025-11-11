"use client";

import { useCallback } from 'react';
import { useData, MOCK_CURRENT_DATE } from '@/context/DataContext';
import { toast } from 'sonner';
import { SellOrder, Product, OrderItem, ProductMovement, Payment, Currency } from '@/types';
import { t } from '@/utils/i18n';

interface SellOrderItemState {
  productId: number | '';
  qty: number | string;
  price: number | string;
  itemTotal: number | string;
  cleanProfit?: number;
  landedCost?: number;
}

interface UseSellOrderActionsProps {
  order: Partial<SellOrder>;
  orderItems: SellOrderItemState[];
  selectedCurrency: Currency;
  manualExchangeRate?: number;
  mainWarehouse: ProductMovement['sourceWarehouse'] | undefined;
  productMap: { [key: number]: Product };
  onSuccess: () => void;
  isEdit: boolean;
}

export const useSellOrderActions = ({
  order,
  orderItems,
  selectedCurrency,
  manualExchangeRate,
  mainWarehouse,
  productMap,
  onSuccess,
  isEdit,
}: UseSellOrderActionsProps) => {
  const {
    sellOrders,
    products,
    saveItem,
    updateStockFromOrder,
    showAlertModal,
    setProducts,
    getNextId,
    incomingPayments,
    warehouseMap,
    currencyRates,
  } = useData();

  const currentExchangeRateToAZN = selectedCurrency === 'AZN' ? 1 : (manualExchangeRate !== undefined ? manualExchangeRate : currencyRates[selectedCurrency]);

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
    // setOrder(orderToSave); // This would be handled by the parent useSellOrderForm

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
    
    // Update the order with the new productMovementId
    const updatedOrderWithMovement = { ...orderToSave, productMovementId: newMovementId };
    saveItem('sellOrders', updatedOrderWithMovement);

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

    saveItem('sellOrders', orderToSave);
    // setOrder(orderToSave); // This would be handled by the parent useSellOrderForm

    if (orderToSave.incomingPaymentId) {
      showAlertModal('Info', t('incomingPaymentAlreadyGenerated'));
      return;
    }

    const existingPaymentForOrder = incomingPayments.find(p => p.orderId === orderToSave.id && p.paymentCategory === 'products');
    if (existingPaymentForOrder) {
      showAlertModal('Info', t('incomingPaymentAlreadyExists'));
      // Link existing payment to order
      const updatedOrderWithPayment = { ...orderToSave, incomingPaymentId: existingPaymentForOrder.id };
      saveItem('sellOrders', updatedOrderWithPayment);
      return;
    }

    const newPaymentId = getNextId('incomingPayments');
    const newPayment: Payment = {
      id: newPaymentId,
      orderId: orderToSave.id as number,
      paymentCategory: 'products',
      date: orderToSave.orderDate,
      amount: orderToSave.total, // Amount is in mainCurrency
      paymentCurrency: orderToSave.currency, // Payment currency is order's currency
      paymentExchangeRate: orderToSave.exchangeRate, // Payment exchange rate is order's exchange rate
      method: t('autoGenerated'), // Default method
    };

    saveItem('incomingPayments', newPayment);

    // Update the order with the new incomingPaymentId
    const updatedOrderWithPayment = { ...orderToSave, incomingPaymentId: newPaymentId };
    saveItem('sellOrders', updatedOrderWithPayment);

    toast.success(t('success'), { description: `${t('incomingPayment')} #${newPaymentId} ${t('generatedSuccessfully')}.` });

  }, [order, orderItems, showAlertModal, getNextId, saveItem, incomingPayments, sellOrders, selectedCurrency, currentExchangeRateToAZN]);


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

      const currentOrderItems = isEdit ? sellOrders.find(o => o.id === order.id)?.items || [] : [];
      const currentOrderWarehouseId = isEdit ? sellOrders.find(o => o.id === order.id)?.warehouseId : undefined;

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
      price: parseFloat(String(item.price)) || 0,
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
  }, [order, orderItems, products, isEdit, sellOrders, showAlertModal, productMap, getNextId, saveItem, updateStockFromOrder, onSuccess, selectedCurrency, manualExchangeRate, currentExchangeRateToAZN]);

  const isGenerateMovementDisabled = !!order.productMovementId;
  const isGeneratePaymentDisabled = !!order.incomingPaymentId || (order.total || 0) <= 0;

  return {
    handleGenerateProductMovement,
    handleGenerateIncomingPayment,
    handleSubmit,
    isGenerateMovementDisabled,
    isGeneratePaymentDisabled,
  };
};