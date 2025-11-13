"use client";

import { useCallback } from 'react';
import { useData, MOCK_CURRENT_DATE } from '@/context/DataContext';
import { toast } from 'sonner';
import { SellOrder, Product, OrderItem, ProductMovement, Payment, Currency } from '@/types';
import { t } from '@/utils/i18n';

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
    packingUnitMap, // New: Access packingUnitMap
  } = useData();

  const currentExchangeRateToAZN = selectedCurrency === 'AZN' ? 1 : (manualExchangeRate !== undefined ? manualExchangeRate : currencyRates[selectedCurrency]);

  const handleGenerateProductMovement = useCallback(() => {
    if (!order) {
      console.error("DEBUG: Order object is null or undefined in handleGenerateProductMovement.");
      showAlertModal('Error', 'Order data is missing. Please try again.');
      return;
    }

    // --- Focused Log on the incoming 'order' object ---
    console.log("DEBUG: [Currency Clue] Raw 'order' object passed to handleGenerateProductMovement:", order);
    console.log("DEBUG: [Currency Clue] Order currency:", order.currency);
    console.log("DEBUG: [Currency Clue] Order exchangeRate:", order.exchangeRate);
    console.log("DEBUG: [Currency Clue] Order total:", order.total);
    console.log("DEBUG: [Currency Clue] Order items:", order.items);
    if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item, index) => {
            console.log(`DEBUG: [Currency Clue] Order item[${index}] currency:`, item?.currency);
            console.log(`DEBUG: [Currency Clue] Order item[${index}] price:`, item?.price);
            console.log(`DEBUG: [Currency Clue] Order item[${index}] landedCostPerUnit:`, item?.landedCostPerUnit);
        });
    }
    // --- End Focused Log ---

    const validOrderItems = orderItems.filter(item => item.productId !== '' && parseFloat(String(item.packingQuantity)) > 0 && parseFloat(String(item.price)) >= 0);
    if (validOrderItems.length === 0) {
      showAlertModal('Validation Error', 'Please add at least one valid order item with a product, packing quantity, and price greater than zero before generating a product movement.');
      return;
    }

    const finalOrderItems: OrderItem[] = validOrderItems.map(item => {
      // Ensure item.packingUnitId is a valid number or null/undefined before accessing packingUnitMap
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
      const baseQty = packingUnit ? packingQtyNum * packingUnit.conversionFactor : packingQtyNum; // Calculate base quantity

      return {
        productId: item.productId as number,
        qty: baseQty, // Store quantity in base units
        price: parseFloat(String(item.price)) || 0,
        currency: selectedCurrency, // Sell orders are always in main currency, but keeping this for consistency
        landedCostPerUnit: item.landedCost, // This is actually averageLandedCost from product
        packingUnitId: item.packingUnitId, // Store packing unit ID (could be undefined)
        packingQuantity: packingQtyNum, // Store quantity in packing units
      };
    });

    // --- Log finalOrderItems for inspection ---
    console.log("DEBUG: finalOrderItems (Product Movement) constructed:", finalOrderItems);
    // --- End Log ---

    // --- Explicitly check for undefined properties from 'order' ---
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

    // --- Focused Log on the constructed 'orderToSave' object ---
    console.log("DEBUG: [Currency Clue] Constructed 'orderToSave' object:", orderToSave);
    console.log("DEBUG: [Currency Clue] orderToSave total:", orderToSave.total);
    console.log("DEBUG: [Currency Clue] orderToSave currency:", orderToSave.currency);
    console.log("DEBUG: [Currency Clue] orderToSave exchangeRate:", orderToSave.exchangeRate);
    // --- End Focused Log ---

    // --- Attempt to stringify orderToSave (This is where the original error was) ---
    try {
        const orderToSaveClone = JSON.parse(JSON.stringify(orderToSave));
        console.log("DEBUG: [Currency Clue] orderToSave successfully cloned:", orderToSaveClone);
    } catch (cloneError) {
        console.error("DEBUG: [Currency Clue] FAILED to clone orderToSave:", cloneError);
        console.error("DEBUG: [Currency Clue] The object that failed to clone:", orderToSave);
        showAlertModal('Error', 'Failed to process order data. It might be corrupted due to recent currency changes. Please check the console for details.');
        return; // Stop execution if cloning fails
    }
    // --- End Stringify Attempt ---

    if (!orderToSave.contactId || !orderToSave.warehouseId || !orderToSave.orderDate) {
      showAlertModal('Validation Error', 'Customer, Warehouse, and Order Date are required before generating a product movement.');
      return;
    }

    saveItem('sellOrders', orderToSave);

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

    for (const item of finalOrderItems) { // Use finalOrderItems which has baseQty
      const qtyNum = item.qty; // This is already in base units
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

  }, [order, orderItems, products, mainWarehouse, showAlertModal, setProducts, getNextId, saveItem, warehouseMap, sellOrders, selectedCurrency, currentExchangeRateToAZN, packingUnitMap, productMap]);

  // ... (rest of the hook remains largely unchanged, removing previous debug logs for brevity) ...

  const handleGenerateIncomingPayment = useCallback(() => {
    // Similar focused logging can be added here if needed, but the primary suspect is handleGenerateProductMovement
    if (!order) {
      console.error("DEBUG: Order object is null or undefined in handleGenerateIncomingPayment.");
      showAlertModal('Error', 'Order data is missing. Please try again.');
      return;
    }
    // ... rest of the function ...
  }, [order, orderItems, showAlertModal, getNextId, saveItem, incomingPayments, sellOrders, selectedCurrency, currentExchangeRateToAZN, packingUnitMap]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    // ... similar focused logging can be added here ...
    if (!order) {
      console.error("DEBUG: Order object is null or undefined in handleSubmit.");
      showAlertModal('Error', 'Order data is missing. Please try again.');
      return;
    }
    // ... rest of the function ...
  }, [order, orderItems, products, isEdit, sellOrders, showAlertModal, productMap, getNextId, saveItem, updateStockFromOrder, onSuccess, selectedCurrency, manualExchangeRate, currentExchangeRateToAZN, packingUnitMap]);

  const isGenerateMovementDisabled = !!order.productMovementId;
  const isGeneratePaymentDisabled = !!order.incomingPaymentId || (order.total ?? 0) <= 0;

  return {
    handleGenerateProductMovement,
    handleGenerateIncomingPayment,
    handleSubmit,
    isGenerateMovementDisabled,
    isGeneratePaymentDisabled,
  };
};