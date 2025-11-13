"use client";

import { useCallback, useMemo } from 'react';
import { useData, MOCK_CURRENT_DATE } from '@/context/DataContext';
import { toast } from 'sonner';
import { SellOrder, Product, OrderItem, ProductMovement, Payment, Currency, PackingUnit, Warehouse } from '@/types';
import { t } from '@/utils/i18n';

interface SellOrderItemState {
  productId: number | '';
  qty: number | string;
  price: number | string;
  itemTotal: number | string;
  cleanProfit?: number;
  landedCost?: number;
  packingUnitId?: number;
  packingQuantity?: number | string;
}

interface UseSellOrderActionsProps {
  order: Partial<SellOrder>;
  orderItems: SellOrderItemState[];
  selectedCurrency: Currency;
  manualExchangeRate?: number;
  mainWarehouse: Warehouse | undefined;
  productMap: { [key: number]: Product };
  onSuccess: () => void;
  isEdit: boolean;
  setOrder: React.Dispatch<React.SetStateAction<Partial<SellOrder>>>; // Added setOrder
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
  setOrder, // Destructure setOrder
}: UseSellOrderActionsProps) => {
  // --- Get all necessary data from useData at the top level ---
  const {
    sellOrders,
    saveItem,
    updateStockFromOrder,
    showAlertModal,
    getNextId,
    setProducts,
    products,
    warehouseMap,
    packingUnitMap,
    currencyRates,
    settings,
    convertCurrency,
    incomingPayments, // Get incomingPayments here
  } = useData();

  const mainCurrency = settings.mainCurrency;

  const currentExchangeRateToAZN = selectedCurrency === 'AZN' ? 1 : (manualExchangeRate !== undefined ? manualExchangeRate : currencyRates[selectedCurrency]);

  const handleGenerateProductMovement = useCallback(() => {
    if (!order) {
      console.error("DEBUG: Order object is null or undefined in handleGenerateProductMovement.");
      showAlertModal('Error', 'Order data is missing. Please try again.');
      return;
    }

    const validOrderItems = orderItems.filter(item => item.productId !== '' && parseFloat(String(item.packingQuantity)) > 0 && parseFloat(String(item.price)) >= 0);
    if (validOrderItems.length === 0) {
      showAlertModal('Validation Error', 'Please add at least one valid order item with a product, packing quantity, and price greater than zero before generating a product movement.');
      return;
    }

    const finalOrderItems: OrderItem[] = validOrderItems.map(item => {
      // --- Safely get packing unit ---
      let packingUnit;
      if (item.packingUnitId !== undefined && item.packingUnitId !== null) {
          if (typeof item.packingUnitId === 'number') {
              packingUnit = packingUnitMap[item.packingUnitId];
          } else {
              // If it's not a number, treat it as if no packing unit is selected
              item.packingUnitId = undefined;
          }
      } else {
          packingUnit = undefined;
      }

      const packingQtyNum = parseFloat(String(item.packingQuantity)) || 0;
      // Calculate base quantity based on packing unit
      const baseQty = packingUnit ? packingQtyNum * packingUnit.conversionFactor : packingQtyNum;

      return {
        productId: item.productId as number,
        qty: baseQty, // Store base unit quantity
        price: parseFloat(String(item.price)) || 0,
        currency: selectedCurrency,
        landedCostPerUnit: item.landedCost,
        packingUnitId: item.packingUnitId, // Store the selected packing unit ID
        packingQuantity: packingQtyNum, // Store the packing quantity entered by the user
      };
    });

    // --- Safely construct orderToSave object ---
    const orderId = order.id !== undefined ? order.id : getNextId('sellOrders');
    const orderContactId = order.contactId !== undefined ? order.contactId : 0;
    const orderWarehouseId = order.warehouseId !== undefined ? order.warehouseId : 0;
    const orderDate = order.orderDate !== undefined ? order.orderDate : MOCK_CURRENT_DATE.toISOString().slice(0, 10);
    const orderStatus = order.status !== undefined ? order.status : 'Draft';
    const orderVatPercent = order.vatPercent !== undefined ? order.vatPercent : 0;
    const orderCurrency = selectedCurrency;
    const orderExchangeRate = selectedCurrency === 'AZN' ? undefined : (currentExchangeRateToAZN ?? undefined);
    const orderProductMovementId = order.productMovementId !== undefined ? order.productMovementId : undefined;
    const orderIncomingPaymentId = order.incomingPaymentId !== undefined ? order.incomingPaymentId : undefined;

    const orderToSave: SellOrder = {
      id: orderId,
      contactId: orderContactId,
      warehouseId: orderWarehouseId,
      orderDate: orderDate,
      status: orderStatus,
      items: finalOrderItems,
      vatPercent: orderVatPercent,
      total: order.total || 0,
      currency: orderCurrency,
      exchangeRate: orderExchangeRate,
      productMovementId: orderProductMovementId,
      incomingPaymentId: orderIncomingPaymentId,
    };

    if (!orderToSave.contactId || !orderToSave.warehouseId || !orderToSave.orderDate) {
      showAlertModal('Validation Error', 'Customer, Warehouse, and Order Date are required before generating a product movement.');
      return;
    }

    try {
        saveItem('sellOrders', orderToSave);
    } catch (saveError) {
        console.error("DEBUG: [Currency Clue] FAILED to save orderToSave:", saveError);
        console.error("DEBUG: [Currency Clue] The object that failed to save:", orderToSave);
        showAlertModal('Error', 'Failed to save order data. It might be corrupted. Please check the console for details.');
        return;
    }

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
    // Deep copy products for stock validation/update
    const productsCopy: Product[] = JSON.parse(JSON.stringify(products));

    for (const item of finalOrderItems) {
      const qtyNum = item.qty; // This is now the base unit quantity
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
        const productName = productMap[item.productId]?.name || 'Unknown Product';
        showAlertModal('Stock Error', `${t('notEnoughStock')} ${productName} (${product.sku}) in ${mainWarehouse.name}. ${t('available')}: ${sourceStock}, ${t('requested')}: ${qtyNum}.`);
        return;
      }

      newMovementItems.push({ productId: item.productId as number, quantity: qtyNum });

      // Update stock in productsCopy
      if (!product.stock) product.stock = {};
      product.stock[mainWarehouse.id] = sourceStock - qtyNum;
      product.stock[orderToSave.warehouseId as number] = (product.stock[orderToSave.warehouseId as number] || 0) + qtyNum;
    }

    if (newMovementItems.length === 0) {
      showAlertModal('Info', t('noValidProductsForMovement'));
      return;
    }

    try {
        setProducts(productsCopy);
    } catch (setProductsError) {
        console.error("DEBUG: [Currency Clue] FAILED to update products state:", setProductsError);
        console.error("DEBUG: [Currency Clue] The productsCopy object:", productsCopy);
        showAlertModal('Error', 'Failed to update product stock data. It might be corrupted. Please check the console.');
        return;
    }

    const newMovementId = getNextId('productMovements');
    const newMovement: ProductMovement = {
      id: newMovementId,
      sourceWarehouseId: mainWarehouse.id,
      destWarehouseId: orderToSave.warehouseId as number,
      items: newMovementItems,
      date: MOCK_CURRENT_DATE.toISOString().slice(0, 10),
    };

    saveItem('productMovements', newMovement);

    const updatedOrderWithMovement = { ...orderToSave, productMovementId: newMovementId };
    saveItem('sellOrders', updatedOrderWithMovement);
    setOrder(updatedOrderWithMovement); // Update local state to disable button

    toast.success(t('success'), { description: `Product Movement #${newMovementId} generated successfully from ${mainWarehouse.name} to ${warehouseMap[orderToSave.warehouseId as number]?.name}.` });

  }, [order, orderItems, products, mainWarehouse, showAlertModal, setProducts, getNextId, saveItem, warehouseMap, sellOrders, selectedCurrency, currentExchangeRateToAZN, packingUnitMap, productMap, setOrder]);


  const handleGenerateIncomingPayment = useCallback(() => {
    if (!order) {
      showAlertModal('Error', 'Order data is missing. Please try again.');
      return;
    }

    const validOrderItems = orderItems.filter(item => item.productId !== '' && parseFloat(String(item.packingQuantity)) > 0 && parseFloat(String(item.price)) >= 0);
    if (validOrderItems.length === 0) {
      showAlertModal('Validation Error', 'Please add at least one valid order item with a product, packing quantity, and price greater than zero before generating an incoming payment.');
      return;
    }

    const finalOrderItems: OrderItem[] = validOrderItems.map(item => {
      // --- Safely get packing unit ---
      let packingUnit;
      if (item.packingUnitId !== undefined && item.packingUnitId !== null) {
          if (typeof item.packingUnitId === 'number') {
              packingUnit = packingUnitMap[item.packingUnitId];
          } else {
              item.packingUnitId = undefined;
          }
      } else {
          packingUnit = undefined;
      }

      const packingQtyNum = parseFloat(String(item.packingQuantity)) || 0;
      const baseQty = packingUnit ? packingQtyNum * packingUnit.conversionFactor : packingQtyNum;

      return {
        productId: item.productId as number,
        qty: baseQty,
        price: parseFloat(String(item.price)) || 0,
        currency: selectedCurrency,
        landedCostPerUnit: item.landedCost,
        packingUnitId: item.packingUnitId,
        packingQuantity: packingQtyNum,
      };
    });

    // --- Safely construct orderToSave object ---
    const orderId = order.id !== undefined ? order.id : getNextId('sellOrders');
    const orderContactId = order.contactId !== undefined ? order.contactId : 0;
    const orderWarehouseId = order.warehouseId !== undefined ? order.warehouseId : 0;
    const orderDate = order.orderDate !== undefined ? order.orderDate : MOCK_CURRENT_DATE.toISOString().slice(0, 10);
    const orderStatus = order.status !== undefined ? order.status : 'Draft';
    const orderVatPercent = order.vatPercent !== undefined ? order.vatPercent : 0;
    const orderCurrency = selectedCurrency;
    const orderExchangeRate = selectedCurrency === 'AZN' ? undefined : (currentExchangeRateToAZN ?? undefined);
    const orderProductMovementId = order.productMovementId !== undefined ? order.productMovementId : undefined;
    const orderIncomingPaymentId = order.incomingPaymentId !== undefined ? order.incomingPaymentId : undefined;

    const orderToSave: SellOrder = {
      id: orderId,
      contactId: orderContactId,
      warehouseId: orderWarehouseId,
      orderDate: orderDate,
      status: orderStatus,
      items: finalOrderItems,
      vatPercent: orderVatPercent,
      total: order.total || 0,
      currency: orderCurrency,
      exchangeRate: orderExchangeRate,
      productMovementId: orderProductMovementId,
      incomingPaymentId: orderIncomingPaymentId,
    };

    if (!orderToSave.contactId || !orderToSave.warehouseId || !orderToSave.orderDate) {
      showAlertModal('Validation Error', 'Customer, Warehouse, and Order Date are required before generating an incoming payment.');
      return;
    }

    saveItem('sellOrders', orderToSave);

    if (orderToSave.incomingPaymentId) {
      showAlertModal('Info', t('incomingPaymentAlreadyGenerated'));
      return;
    }

    // --- Use incomingPayments from the top-level useData call ---
    const existingIncomingPayment = incomingPayments.find(p => p.orderId === orderToSave.id);
    if (existingIncomingPayment) {
      showAlertModal('Info', t('incomingPaymentAlreadyExists'));
      const updatedOrderWithPayment = { ...orderToSave, incomingPaymentId: existingIncomingPayment.id };
      saveItem('sellOrders', updatedOrderWithPayment);
      setOrder(updatedOrderWithPayment); // Update local state to disable button
      return;
    }

    const newPaymentId = getNextId('incomingPayments');
    const newPayment: Payment = {
      id: newPaymentId,
      orderId: orderToSave.id,
      paymentCategory: 'products',
      date: MOCK_CURRENT_DATE.toISOString().slice(0, 10),
      amount: orderToSave.total,
      paymentCurrency: mainCurrency,
      paymentExchangeRate: undefined,
      method: t('autoGenerated'),
    };

    saveItem('incomingPayments', newPayment);

    const updatedOrderWithPayment = { ...orderToSave, incomingPaymentId: newPaymentId };
    saveItem('sellOrders', updatedOrderWithPayment);
    setOrder(updatedOrderWithPayment); // Update local state to disable button

    toast.success(t('success'), { description: `Incoming Payment #${newPaymentId} generated successfully for ${t('orderId')} #${orderToSave.id}.` });

  }, [order, orderItems, showAlertModal, getNextId, saveItem, selectedCurrency, currentExchangeRateToAZN, packingUnitMap, incomingPayments, mainCurrency, setOrder]);


  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (!order.contactId || !order.warehouseId || !order.orderDate) {
      showAlertModal('Validation Error', 'Customer, Warehouse, and Order Date are required.');
      return;
    }

    const validOrderItems = orderItems.filter(item => item.productId !== '' && parseFloat(String(item.packingQuantity)) > 0 && parseFloat(String(item.price)) >= 0);
    if (validOrderItems.length === 0) {
      showAlertModal('Validation Error', 'Please add at least one valid order item with a product, packing quantity, and price greater than zero.');
      return;
    }

    if (selectedCurrency !== 'AZN' && (!manualExchangeRate || manualExchangeRate <= 0)) {
      showAlertModal('Validation Error', 'Please enter a valid exchange rate for the selected currency.');
      return;
    }

    const finalOrderItems: OrderItem[] = validOrderItems.map(item => {
      // --- Safely get packing unit ---
      let packingUnit;
      if (item.packingUnitId !== undefined && item.packingUnitId !== null) {
          if (typeof item.packingUnitId === 'number') {
              packingUnit = packingUnitMap[item.packingUnitId];
          } else {
              item.packingUnitId = undefined;
          }
      } else {
          packingUnit = undefined;
      }

      const packingQtyNum = parseFloat(String(item.packingQuantity)) || 0;
      const baseQty = packingUnit ? packingQtyNum * packingUnit.conversionFactor : packingQtyNum;

      return {
        productId: item.productId as number,
        qty: baseQty,
        price: parseFloat(String(item.price)) || 0,
        currency: selectedCurrency,
        landedCostPerUnit: item.landedCost,
        packingUnitId: item.packingUnitId,
        packingQuantity: packingQtyNum,
      };
    });

    // --- Safely construct orderToSave object ---
    const orderId = order.id !== undefined ? order.id : getNextId('sellOrders');
    const orderContactId = order.contactId !== undefined ? order.contactId : 0;
    const orderWarehouseId = order.warehouseId !== undefined ? order.warehouseId : 0;
    const orderDate = order.orderDate !== undefined ? order.orderDate : MOCK_CURRENT_DATE.toISOString().slice(0, 10);
    const orderStatus = order.status !== undefined ? order.status : 'Draft';
    const orderVatPercent = order.vatPercent !== undefined ? order.vatPercent : 0;
    const orderCurrency = selectedCurrency;
    const orderExchangeRate = selectedCurrency === 'AZN' ? undefined : (currentExchangeRateToAZN ?? undefined);
    const orderProductMovementId = order.productMovementId !== undefined ? order.productMovementId : undefined;
    const orderIncomingPaymentId = order.incomingPaymentId !== undefined ? order.incomingPaymentId : undefined;

    const orderToSave: SellOrder = {
      id: orderId,
      contactId: orderContactId,
      warehouseId: orderWarehouseId,
      orderDate: orderDate,
      status: orderStatus,
      items: finalOrderItems,
      vatPercent: orderVatPercent,
      total: order.total || 0,
      currency: orderCurrency,
      exchangeRate: orderExchangeRate,
      productMovementId: orderProductMovementId,
      incomingPaymentId: orderIncomingPaymentId,
    };

    const oldOrder = isEdit ? sellOrders.find(o => o.id === orderToSave.id) : null;

    saveItem('sellOrders', orderToSave);
    updateStockFromOrder(orderToSave, oldOrder);
    onSuccess();
    toast.success(t('success'), { description: `Sell Order #${orderToSave.id || 'new'} saved successfully.` });
  }, [order, orderItems, selectedCurrency, manualExchangeRate, currentExchangeRateToAZN, onSuccess, isEdit, sellOrders, saveItem, updateStockFromOrder, showAlertModal, getNextId, packingUnitMap]);

  // --- Debug Logs for Button States ---
  const isGenerateMovementDisabled = useMemo(() => {
    const disabled =
      !order ||
      !order.warehouseId ||
      !mainWarehouse ||
      order.warehouseId === mainWarehouse.id ||
      order.status !== 'Shipped' ||
      order.productMovementId ||
      orderItems.filter(item => item.productId !== '' && parseFloat(String(item.packingQuantity)) > 0).length === 0;

    console.log("DEBUG: [Button State] Generate Product Movement Button:");
    console.log("  - order exists:", !!order);
    if (order) {
      console.log("  - order.warehouseId:", order.warehouseId);
      console.log("  - order.status:", order.status);
      console.log("  - order.productMovementId:", order.productMovementId);
    }
    console.log("  - mainWarehouse exists:", !!mainWarehouse);
    if (mainWarehouse && order) {
      console.log("  - order.warehouseId === mainWarehouse.id:", order.warehouseId === mainWarehouse.id);
    }
    console.log("  - valid items count:", orderItems.filter(item => item.productId !== '' && parseFloat(String(item.packingQuantity)) > 0).length);
    console.log("  -> DISABLED:", disabled);

    return disabled;
  }, [order, mainWarehouse, orderItems]);

  const isGeneratePaymentDisabled = useMemo(() => {
    const disabled =
      !order ||
      order.status !== 'Shipped' ||
      order.incomingPaymentId ||
      orderItems.filter(item => item.productId !== '' && parseFloat(String(item.packingQuantity)) > 0).length === 0;

    console.log("DEBUG: [Button State] Generate Incoming Payment Button:");
    console.log("  - order exists:", !!order);
    if (order) {
      console.log("  - order.status:", order.status);
      console.log("  - order.incomingPaymentId:", order.incomingPaymentId);
    }
    console.log("  - valid items count:", orderItems.filter(item => item.productId !== '' && parseFloat(String(item.packingQuantity)) > 0).length);
    console.log("  -> DISABLED:", disabled);

    return disabled;
  }, [order, orderItems]);

  return {
    handleGenerateProductMovement,
    handleGenerateIncomingPayment,
    handleSubmit,
    isGenerateMovementDisabled,
    isGeneratePaymentDisabled,
  };
};