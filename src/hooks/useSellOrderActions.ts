"use client";

import { useCallback, useMemo } from 'react'; // Added useMemo
import { useData } from '@/context/DataContext';
import { MOCK_CURRENT_DATE } from '@/data/initialData'; // Corrected import
import { toast } from 'sonner';
import { SellOrder, Product, OrderItem, ProductMovement, Payment, Currency, PackingUnit, Warehouse } from '@/types';
import { t } from '@/utils/i18n';
import { roundToPrecision } from '@/utils/formatters'; // Import roundToPrecision

interface SellOrderItemState {
  productId: number | '';
  qty: number | string; // This will be the quantity in base units
  price: number | string;
  itemTotal: number | string;
  cleanProfit?: number; // New field for calculated clean profit per item
  landedCost?: number; // Added: Landed cost for the product
  packingUnitId?: number; // New: ID of the selected packing unit
  packingQuantity?: number | string; // New: Quantity in terms of the selected packing unit
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
    bankAccounts, // Get bankAccounts here
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
      let packingUnit: PackingUnit | undefined;
      if (item.packingUnitId !== undefined && item.packingUnitId !== null) {
          if (typeof item.packingUnitId === 'number') {
              packingUnit = packingUnitMap[item.packingUnitId];
          }
      }

      const packingQtyNum = parseFloat(String(item.packingQuantity)) || 0;
      // Calculate base quantity based on packing unit
      const baseQty = packingUnit ? packingQtyNum * (packingUnit.conversionFactor || 1) : packingQtyNum;

      return {
        productId: item.productId as number,
        qty: roundToPrecision(baseQty, 4), // Ensure final qty is rounded
        price: roundToPrecision(parseFloat(String(item.price)), 4), // Ensure final price is rounded
        currency: selectedCurrency,
        landedCostPerUnit: item.landedCost,
        packingUnitId: item.packingUnitId, // Store the selected packing unit ID
        packingQuantity: roundToPrecision(packingQtyNum, 4), // Store the packing quantity entered by the user, rounded
      };
    });

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
      date: MOCK_CURRENT_DATE.toISOString(),
    };

    saveItem('productMovements', newMovement);

    const updatedOrderWithMovement = { ...orderToSave, productMovementId: newMovementId };
    saveItem('sellOrders', updatedOrderWithMovement);
    setOrder(updatedOrderWithMovement); // Update local state to disable button

    toast.success(t('success'), { description: `Product Movement #${newMovementId} generated successfully from ${mainWarehouse.name} to ${warehouseMap[orderToSave.warehouseId as number]?.name}.` });

  }, [order, orderItems, products, mainWarehouse, showAlertModal, setProducts, getNextId, saveItem, warehouseMap, sellOrders, selectedCurrency, currentExchangeRateToAZN, packingUnitMap, productMap, setOrder, t]);


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
      let packingUnit: PackingUnit | undefined;
      if (item.packingUnitId !== undefined && item.packingUnitId !== null) {
          if (typeof item.packingUnitId === 'number') {
              packingUnit = packingUnitMap[item.packingUnitId];
          }
      }

      const packingQtyNum = parseFloat(String(item.packingQuantity)) || 0;
      const baseQty = packingUnit ? packingQtyNum * (packingUnit?.conversionFactor || 1) : packingQtyNum; // Use optional chaining and default

      return {
        productId: item.productId as number,
        qty: roundToPrecision(baseQty, 4), // Ensure final qty is rounded
        price: roundToPrecision(parseFloat(String(item.price)), 4), // Ensure final price is rounded
        currency: selectedCurrency,
        landedCostPerUnit: item.landedCost,
        packingUnitId: item.packingUnitId,
        packingQuantity: roundToPrecision(packingQtyNum, 4), // Ensure final packingQuantity is rounded
      };
    });

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

    // --- Use incomingPayments from the top-level useData call ---
    const existingIncomingPayment = incomingPayments.find(p => p.orderId === orderToSave.id);
    if (existingIncomingPayment) {
      showAlertModal('Info', t('incomingPaymentAlreadyExists'));
      const updatedOrderWithPayment = { ...orderToSave, incomingPaymentId: existingIncomingPayment.id };
      saveItem('sellOrders', updatedOrderWithPayment);
      setOrder(updatedOrderWithPayment); // Update local state to disable button
      return;
    }

    // Find a default bank account for the main currency
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
      date: MOCK_CURRENT_DATE.toISOString(),
      amount: orderToSave.total,
      paymentCurrency: mainCurrency,
      paymentExchangeRate: undefined,
      method: t('autoGenerated'),
      bankAccountId: defaultBankAccount.id, // Set the default bank account ID
    };

    saveItem('incomingPayments', newPayment);

    const updatedOrderWithPayment = { ...orderToSave, incomingPaymentId: newPaymentId };
    saveItem('sellOrders', updatedOrderWithPayment);
    setOrder(updatedOrderWithPayment); // Update local state to disable button

    toast.success(t('success'), { description: `Incoming Payment #${newPaymentId} generated successfully for ${t('orderId')} #${orderToSave.id}.` });

  }, [order, orderItems, showAlertModal, getNextId, saveItem, selectedCurrency, currentExchangeRateToAZN, packingUnitMap, incomingPayments, mainCurrency, setOrder, bankAccounts, t]);


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
      let packingUnit: PackingUnit | undefined;
      if (item.packingUnitId !== undefined && item.packingUnitId !== null) {
          if (typeof item.packingUnitId === 'number') {
              packingUnit = packingUnitMap[item.packingUnitId];
          }
      }

      const packingQtyNum = parseFloat(String(item.packingQuantity)) || 0;
      const baseQty = packingUnit ? packingQtyNum * (packingUnit?.conversionFactor || 1) : packingQtyNum; // Use optional chaining and default

      return {
        productId: item.productId as number,
        qty: roundToPrecision(baseQty, 4), // Ensure final qty is rounded
        price: roundToPrecision(parseFloat(String(item.price)), 4), // Ensure final price is rounded
        currency: selectedCurrency,
        landedCostPerUnit: item.landedCost,
        packingUnitId: item.packingUnitId,
        packingQuantity: roundToPrecision(packingQtyNum, 4), // Ensure final packingQuantity is rounded
      };
    });

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

    const oldOrder = isEdit ? sellOrders.find(o => o.id === orderToSave.id) : null;

    saveItem('sellOrders', orderToSave);
    updateStockFromOrder(orderToSave, oldOrder);
    onSuccess();
    toast.success(t('success'), { description: `Sell Order #${orderToSave.id || 'new'} saved successfully.` });
  }, [order, orderItems, selectedCurrency, manualExchangeRate, currentExchangeRateToAZN, onSuccess, isEdit, sellOrders, saveItem, updateStockFromOrder, showAlertModal, getNextId, packingUnitMap]);

  // --- Debug Logs for Button States ---
  const isGenerateMovementDisabled = useMemo(() => {
    const noOrder = !order;
    const noWarehouseId = !order?.warehouseId;
    const noMainWarehouse = !mainWarehouse;
    const sameWarehouse = order?.warehouseId === mainWarehouse?.id;
    const notShipped = order?.status !== 'Shipped';
    const movementAlreadyGenerated = !!order?.productMovementId;
    const noValidItems = orderItems.filter(item => item.productId !== '' && parseFloat(String(item.packingQuantity)) > 0).length === 0;

    const disabled = noOrder || noWarehouseId || noMainWarehouse || sameWarehouse || notShipped || movementAlreadyGenerated || noValidItems;

    console.log("DEBUG: [Movement Button State] Conditions for DISABLED:");
    console.log(`  - No Order (!order): ${noOrder}`);
    console.log(`  - No Order Warehouse ID (!order.warehouseId): ${noWarehouseId}`);
    console.log(`  - No Main Warehouse (!mainWarehouse): ${noMainWarehouse}`);
    console.log(`  - Same Warehouse (order.warehouseId === mainWarehouse.id): ${sameWarehouse}`);
    console.log(`  - Not Shipped (order.status !== 'Shipped'): ${notShipped}`);
    console.log(`  - Movement Already Generated (!!order.productMovementId): ${movementAlreadyGenerated}`);
    console.log(`  - No Valid Items (orderItems.filter(...).length === 0): ${noValidItems}`);
    console.log(`  -> FINAL DISABLED STATE: ${disabled}`);

    return disabled;
  }, [order, mainWarehouse, orderItems]);

  const isGeneratePaymentDisabled = useMemo(() => {
    const noOrder = !order;
    const notShipped = order?.status !== 'Shipped';
    const paymentAlreadyGenerated = !!order?.incomingPaymentId;
    const noValidItems = orderItems.filter(item => item.productId !== '' && parseFloat(String(item.packingQuantity)) > 0).length === 0;
    const noMainCurrencyBankAccount = !bankAccounts.some(ba => ba.currency === mainCurrency);

    const disabled = noOrder || notShipped || paymentAlreadyGenerated || noValidItems || noMainCurrencyBankAccount;

    console.log("DEBUG: [Payment Button State] Conditions for DISABLED:");
    console.log(`  - No Order (!order): ${noOrder}`);
    console.log(`  - Not Shipped (order.status !== 'Shipped'): ${notShipped}`);
    console.log(`  - Payment Already Generated (!!order.incomingPaymentId): ${paymentAlreadyGenerated}`);
    console.log(`  - No Valid Items (orderItems.filter(...).length === 0): ${noValidItems}`);
    console.log(`  - No Main Currency Bank Account (!bankAccounts.some(...)): ${noMainCurrencyBankAccount}`);
    console.log(`  -> FINAL DISABLED STATE: ${disabled}`);

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