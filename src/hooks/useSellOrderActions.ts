"use client";

import { useCallback, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { MOCK_CURRENT_DATE } from '@/data/initialData';
import { toast } from 'sonner';
import { SellOrder, Product, OrderItem, ProductMovement, Payment, Currency, PackingUnit, Warehouse } from '@/types';
import { t } from '@/utils/i18n';
import { roundToPrecision } from '@/utils/formatters';

interface SellOrderItemState {
  productId: number | '';
  qty: number | string; // This will be the quantity in base units
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
  setOrder: React.Dispatch<React.SetStateAction<Partial<SellOrder>>>;
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
  setOrder,
}: UseSellOrderActionsProps) => {
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
    bankAccounts,
    incomingPayments,
  } = useData();

  const mainCurrency = settings.mainCurrency;
  const currentExchangeRateToAZN = selectedCurrency === 'AZN' ? 1 : (manualExchangeRate !== undefined ? manualExchangeRate : currencyRates[selectedCurrency]);

  // Helper function for validating and preparing order items
  const validateAndPrepareOrderData = useCallback((): { finalOrderItems: OrderItem[]; isValid: boolean } => {
    if (!order.contactId || !order.warehouseId || !order.orderDate) {
      showAlertModal('Validation Error', 'Customer, Warehouse, and Order Date are required.');
      return { finalOrderItems: [], isValid: false };
    }

    const validOrderItems = orderItems.filter(item => item.productId !== '' && parseFloat(String(item.packingQuantity)) > 0 && parseFloat(String(item.price)) >= 0);
    if (validOrderItems.length === 0) {
      showAlertModal('Validation Error', 'Please add at least one valid order item with a product, packing quantity, and price greater than zero.');
      return { finalOrderItems: [], isValid: false };
    }

    if (selectedCurrency !== 'AZN' && (!manualExchangeRate || manualExchangeRate <= 0)) {
      showAlertModal('Validation Error', 'Please enter a valid exchange rate for the selected currency.');
      return { finalOrderItems: [], isValid: false };
    }

    const finalOrderItems: OrderItem[] = validOrderItems.map(item => {
      let packingUnit: PackingUnit | undefined;
      if (item.packingUnitId !== undefined && item.packingUnitId !== null) {
        if (typeof item.packingUnitId === 'number') {
          packingUnit = packingUnitMap[item.packingUnitId];
        }
      }

      const packingQtyNum = parseFloat(String(item.packingQuantity)) || 0;
      const baseQty = packingUnit ? packingQtyNum * (packingUnit?.conversionFactor || 1) : packingQtyNum;

      return {
        productId: item.productId as number,
        qty: roundToPrecision(baseQty, 4),
        price: roundToPrecision(parseFloat(String(item.price)), 4),
        currency: selectedCurrency,
        landedCostPerUnit: item.landedCost,
        packingUnitId: item.packingUnitId,
        packingQuantity: roundToPrecision(packingQtyNum, 4),
      };
    });

    return { finalOrderItems, isValid: true };
  }, [order, orderItems, selectedCurrency, manualExchangeRate, showAlertModal, packingUnitMap, t]);

  // Helper function for pre-save stock validation
  const performPreSaveStockValidation = useCallback((
    orderToSave: SellOrder,
    finalOrderItems: OrderItem[],
    currentProducts: Product[],
    isEditMode: boolean,
    existingOrder: SellOrder | null,
  ): { updatedProducts: Product[]; isValid: boolean } => {
    const productsCopy: Product[] = JSON.parse(JSON.stringify(currentProducts));

    // If editing an order that was previously 'Shipped', temporarily "return" its items to stock for accurate validation
    if (isEditMode && existingOrder && existingOrder.status === 'Shipped') {
      (existingOrder.items || []).forEach(item => {
        const p = productsCopy.find(prod => prod.id === item.productId);
        if (p && p.stock) {
          p.stock[existingOrder.warehouseId] = (p.stock[existingOrder.warehouseId] || 0) + item.qty;
        }
      });
    }

    // Perform stock validation for the new/updated order if its status is 'Shipped'
    if (orderToSave.status === 'Shipped') {
      for (const item of finalOrderItems) {
        const p = productsCopy.find(prod => prod.id === item.productId);
        if (!p || !p.stock) {
          showAlertModal('Error', `Product data missing for item ID ${item.productId}`);
          return { updatedProducts: currentProducts, isValid: false };
        }
        const stockInWarehouse = p.stock[orderToSave.warehouseId as number] || 0;
        if (stockInWarehouse < item.qty) {
          const productName = productMap[item.productId as number]?.name || 'Unknown Product';
          showAlertModal('Stock Error', `${t('notEnoughStock')} ${productName} (${productMap[item.productId as number]?.sku}). ${t('available')}: ${stockInWarehouse}, ${t('requested')}: ${item.qty}.`);
          return { updatedProducts: currentProducts, isValid: false };
        }
      }
    }
    return { updatedProducts: productsCopy, isValid: true };
  }, [showAlertModal, products, productMap, t]);

  const handleGenerateProductMovement = useCallback(() => {
    const { finalOrderItems, isValid } = validateAndPrepareOrderData();
    if (!isValid) return;

    // --- Safely construct orderToSave object ---
    const orderId = order.id !== undefined ? order.id : getNextId('sellOrders');
    const orderContactId = order.contactId !== undefined ? order.contactId : 0;
    const orderWarehouseId = order.warehouseId !== undefined ? order.warehouseId : 0;
    const orderDate = order.orderDate !== undefined ? order.orderDate : MOCK_CURRENT_DATE.toISOString();
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
        console.error("DEBUG: FAILED to save orderToSave:", saveError);
        console.error("DEBUG: The object that failed to save:", orderToSave);
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
    const productsCopy: Product[] = JSON.parse(JSON.stringify(products));

    for (const item of finalOrderItems) {
      const qtyNum = item.qty;
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
        const productName = productMap[item.productId as number]?.name || 'Unknown Product';
        showAlertModal('Stock Error', `${t('notEnoughStock')} ${productName} (${product.sku}). ${t('available')}: ${sourceStock}, ${t('requested')}: ${qtyNum}.`);
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

    try {
        setProducts(productsCopy);
    } catch (setProductsError) {
        console.error("DEBUG: FAILED to update products state:", setProductsError);
        console.error("DEBUG: The productsCopy object:", productsCopy);
        showAlertModal('Error', 'Failed to update product stock data. It might be corrupted. Please check the console.');
        return;
    }

    const newMovementId = getNextId('productMovements');
    const newMovement: ProductMovement = {
      id: newMovementId,
      sourceWarehouseId: mainWarehouse.id,
      destWarehouseId: orderToSave.warehouseId as number,
      items: newMovementItems,
      date: orderToSave.orderDate,
    };

    saveItem('productMovements', newMovement);

    const updatedOrderWithMovement = { ...orderToSave, productMovementId: newMovementId };
    saveItem('sellOrders', updatedOrderWithMovement);
    setOrder(updatedOrderWithMovement);

    toast.success(t('success'), { description: `Product Movement #${newMovementId} generated successfully from ${mainWarehouse.name} to ${warehouseMap[orderToSave.warehouseId as number]?.name}.` });

  }, [order, products, mainWarehouse, showAlertModal, setProducts, getNextId, saveItem, warehouseMap, sellOrders, selectedCurrency, currentExchangeRateToAZN, packingUnitMap, productMap, setOrder, t, validateAndPrepareOrderData]);


  const handleGenerateIncomingPayment = useCallback(() => {
    const { finalOrderItems, isValid } = validateAndPrepareOrderData();
    if (!isValid) return;

    // --- Safely construct orderToSave object ---
    const orderId = order.id !== undefined ? order.id : getNextId('sellOrders');
    const orderContactId = order.contactId !== undefined ? order.contactId : 0;
    const orderWarehouseId = order.warehouseId !== undefined ? order.warehouseId : 0;
    const orderDate = order.orderDate !== undefined ? order.orderDate : MOCK_CURRENT_DATE.toISOString();
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

    const existingIncomingPayment = incomingPayments.find(p => p.orderId === orderToSave.id);
    if (existingIncomingPayment) {
      showAlertModal('Info', t('incomingPaymentAlreadyExists'));
      const updatedOrderWithPayment = { ...orderToSave, incomingPaymentId: existingIncomingPayment.id };
      saveItem('sellOrders', updatedOrderWithPayment);
      setOrder(updatedOrderWithPayment);
      return;
    }

    const defaultBankAccount = bankAccounts.find(ba => ba.currency === mainCurrency);
    if (!defaultBankAccount) {
      showAlertModal('Error', t('noBankAccountsAvailable'));
      return;
    }

    const newPaymentId = getNextId('incomingPayments');
    const newPayment: Payment = {
      id: newPaymentId,
      orderId: orderToSave.id,
      paymentCategory: 'products',
      date: orderToSave.orderDate,
      amount: orderToSave.total,
      paymentCurrency: mainCurrency,
      paymentExchangeRate: undefined,
      method: t('autoGenerated'),
      bankAccountId: defaultBankAccount.id,
    };

    saveItem('incomingPayments', newPayment);

    const updatedOrderWithPayment = { ...orderToSave, incomingPaymentId: newPaymentId };
    saveItem('sellOrders', updatedOrderWithPayment);
    setOrder(updatedOrderWithPayment);

    toast.success(t('success'), { description: `Incoming Payment #${newPaymentId} generated successfully for ${t('orderId')} #${orderToSave.id}.` });

  }, [order, showAlertModal, getNextId, saveItem, selectedCurrency, currentExchangeRateToAZN, packingUnitMap, incomingPayments, mainCurrency, setOrder, bankAccounts, t, validateAndPrepareOrderData]);


  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    const { finalOrderItems, isValid } = validateAndPrepareOrderData();
    if (!isValid) return;

    // --- Safely construct orderToSave object ---
    const orderId = order.id !== undefined ? order.id : getNextId('sellOrders');
    const orderContactId = order.contactId !== undefined ? order.contactId : 0;
    const orderWarehouseId = order.warehouseId !== undefined ? order.warehouseId : 0;
    const orderDate = order.orderDate !== undefined ? order.orderDate : MOCK_CURRENT_DATE.toISOString();
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

    const existingOrder = isEdit ? sellOrders.find(o => o.id === orderToSave.id) : null;
    const { updatedProducts, isValid: isStockValid } = performPreSaveStockValidation(orderToSave, finalOrderItems, products, isEdit, existingOrder);

    if (!isStockValid) {
      return;
    }

    setProducts(updatedProducts); // Update products state with the validated stock changes

    saveItem('sellOrders', orderToSave);
    updateStockFromOrder(orderToSave, existingOrder); // Pass existingOrder for correct stock reversal
    onSuccess();
    toast.success(t('success'), { description: `Sell Order #${orderToSave.id || 'new'} saved successfully.` });
  }, [
    order, isEdit, sellOrders, products, selectedCurrency, manualExchangeRate, currentExchangeRateToAZN,
    onSuccess, saveItem, updateStockFromOrder, showAlertModal, getNextId, packingUnitMap, productMap, setProducts, t,
    validateAndPrepareOrderData, performPreSaveStockValidation
  ]);

  const isGenerateMovementDisabled = useMemo(() => {
    const noOrder = !order;
    const noWarehouseId = !order?.warehouseId;
    const noMainWarehouse = !mainWarehouse;
    const sameWarehouse = order?.warehouseId === mainWarehouse?.id;
    const notShipped = order?.status !== 'Shipped';
    const movementAlreadyGenerated = !!order?.productMovementId;
    const noValidItems = orderItems.filter(item => item.productId !== '' && parseFloat(String(item.packingQuantity)) > 0).length === 0;

    const disabled = noOrder || noWarehouseId || noMainWarehouse || sameWarehouse || notShipped || movementAlreadyGenerated || noValidItems;

    return disabled;
  }, [order, mainWarehouse, orderItems]);

  const isGeneratePaymentDisabled = useMemo(() => {
    const noOrder = !order;
    const notShipped = order?.status !== 'Shipped';
    const paymentAlreadyGenerated = !!order?.incomingPaymentId;
    const noValidItems = orderItems.filter(item => item.productId !== '' && parseFloat(String(item.packingQuantity)) > 0).length === 0;
    const noMainCurrencyBankAccount = !bankAccounts.some(ba => ba.currency === mainCurrency);

    const disabled = noOrder || notShipped || paymentAlreadyGenerated || noValidItems || noMainCurrencyBankAccount;

    return disabled;
  }, [order, orderItems, bankAccounts, mainCurrency]);

  return {
    handleGenerateProductMovement,
    handleGenerateIncomingPayment,
    handleSubmit,
    isGenerateMovementDisabled,
    isGeneratePaymentDisabled,
  };
};