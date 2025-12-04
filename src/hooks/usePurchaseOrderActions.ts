"use client";

import { useCallback, useMemo } from 'react'; // Added useMemo
import { useData } from '@/context/DataContext';
import { MOCK_CURRENT_DATE } from '@/data/initialData'; // Corrected import
import { toast } from 'sonner';
import { PurchaseOrder, Product, OrderItem, ProductMovement, Payment, Currency, PackingUnit, Warehouse } from '@/types';
import { t } from '@/utils/i18n';
import { roundToPrecision } from '@/utils/formatters'; // Import roundToPrecision

interface UsePurchaseOrderActionsProps {
  order: Partial<PurchaseOrder>;
  orderItems: OrderItem[]; // Changed from PurchaseOrderItemState[] to OrderItem[]
  selectedCurrency: Currency;
  manualExchangeRate?: number;
  manualFeesExchangeRate?: number; // New: Pass manualFeesExchangeRate
  currentExchangeRate: number;
  onSuccess: () => void;
  isEdit: boolean;
  setOrder: React.Dispatch<React.SetStateAction<Partial<PurchaseOrder>>>; // ADDED: setOrder prop
}

export const usePurchaseOrderActions = ({
  order,
  orderItems, // This is OrderItem[] (already converted to numbers)
  selectedCurrency,
  manualExchangeRate,
  manualFeesExchangeRate, // Destructure new prop
  currentExchangeRate,
  onSuccess,
  isEdit,
  setOrder, // ADDED: Destructure setOrder
}: UsePurchaseOrderActionsProps) => {
  // --- Get all necessary data from useData at the top level ---
  const {
    purchaseOrders,
    saveItem,
    updateStockFromOrder,
    updateAverageCosts,
    showAlertModal,
    getNextId,
    packingUnitMap,
    currencyRates,
    settings,
    convertCurrency,
    incomingPayments, // Get incomingPayments here
    bankAccounts, // Get bankAccounts here
    products, // ADDED: products array
    setProducts, // ADDED: setProducts for product movement
    warehouses, // ADDED: warehouses for mainWarehouse lookup
    warehouseMap, // ADDED: warehouseMap for product movement
    sellOrders, // ADDED: sellOrders for product movement
    productMap, // ADDED: productMap
  } = useData();

  const mainCurrency = settings.mainCurrency;
  const mainWarehouse = warehouses.find(w => w.type === 'Main'); // Derive mainWarehouse here

  const currentExchangeRateToAZN = selectedCurrency === 'AZN' ? 1 : (manualExchangeRate !== undefined ? manualExchangeRate : currencyRates[selectedCurrency]);

  // This function is for generating a Product Movement from a Purchase Order.
  // This functionality is typically associated with Sell Orders (moving from main to customer warehouse).
  // For Purchase Orders, products are received INTO a warehouse.
  // If the intent is to move products from the received warehouse to another, that would be a separate Product Movement.
  // For now, I'm removing this as it seems misplaced for a Purchase Order's direct actions.
  const handleGenerateProductMovement = useCallback(() => {
    showAlertModal('Info', t('featureNotApplicable'), 'Product movement generation is not directly applicable from a Purchase Order. Products are received into the warehouse upon order completion.');
  }, [showAlertModal, t]);


  // This function is for generating an Incoming Payment from a Purchase Order.
  // Incoming payments are typically for Sell Orders. Outgoing payments are for Purchase Orders.
  // This seems like a misplaced function for a Purchase Order's direct actions.
  // For now, I'm removing this.
  const handleGenerateIncomingPayment = useCallback(() => {
    showAlertModal('Info', t('featureNotApplicable'), 'Incoming payment generation is not directly applicable from a Purchase Order. Please use the Outgoing Payments section for payments related to Purchase Orders.');
  }, [showAlertModal, t]);


  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (!order.contactId || !order.warehouseId || !order.orderDate) {
      showAlertModal('Validation Error', 'Supplier, Warehouse, and Order Date are required.');
      return;
    }

    const validOrderItems = orderItems.filter(item => item.productId !== undefined && item.productId !== null && item.qty > 0 && item.price >= 0);
    if (validOrderItems.length === 0) {
      showAlertModal('Validation Error', 'Please add at least one valid order item with a product, quantity, and price greater than zero.');
      return;
    }

    if (selectedCurrency !== 'AZN' && (!manualExchangeRate || manualExchangeRate <= 0)) {
      showAlertModal('Validation Error', 'Please enter a valid exchange rate for the selected currency.');
      return;
    }

    if (order.feesCurrency !== 'AZN' && (!manualFeesExchangeRate || manualFeesExchangeRate <= 0)) {
      showAlertModal('Validation Error', 'Please enter a valid exchange rate for the selected fees currency.');
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
      const baseQty = packingUnit ? packingQtyNum * (packingUnit?.conversionFactor || 1) : packingQtyNum; // Use optional chaining and default

      return {
        productId: item.productId as number,
        qty: roundToPrecision(baseQty, 4), // Ensure final qty is rounded
        price: roundToPrecision(parseFloat(String(item.price)), 4), // Ensure final price is rounded
        currency: selectedCurrency,
        landedCostPerUnit: item.landedCostPerUnit,
        packingUnitId: item.packingUnitId,
        packingQuantity: roundToPrecision(packingQtyNum, 4), // Ensure final packingQuantity is rounded
      };
    });

    // --- Safely construct orderToSave object ---
    const orderIdToSave = order.id !== undefined ? order.id : getNextId('purchaseOrders');
    const orderContactId = order.contactId !== undefined ? order.contactId : 0;
    const orderWarehouseId = order.warehouseId !== undefined ? order.warehouseId : 0;
    const orderDate = order.orderDate !== undefined ? order.orderDate : MOCK_CURRENT_DATE.toISOString();
    const orderStatus = order.status !== undefined ? order.status : 'Draft';
    const orderCurrency = selectedCurrency;
    const orderExchangeRate = selectedCurrency === 'AZN' ? undefined : (currentExchangeRateToAZN ?? undefined);
    const orderFees = order.fees !== undefined ? order.fees : 0;
    const orderFeesCurrency = order.feesCurrency !== undefined ? order.feesCurrency : 'AZN';
    const orderFeesExchangeRate = orderFeesCurrency === 'AZN' ? undefined : (manualFeesExchangeRate ?? undefined);
    const orderComment = order.comment !== undefined ? order.comment : undefined;

    const orderToSave: PurchaseOrder = {
      id: orderIdToSave,
      contactId: orderContactId,
      warehouseId: orderWarehouseId,
      orderDate: orderDate,
      status: orderStatus,
      items: finalOrderItems,
      currency: orderCurrency,
      exchangeRate: orderExchangeRate,
      fees: orderFees,
      feesCurrency: orderFeesCurrency,
      feesExchangeRate: orderFeesExchangeRate,
      comment: orderComment,
      total: order.total || 0,
    };

    const oldOrder = isEdit ? purchaseOrders.find(o => o.id === orderToSave.id) : null;

    saveItem('purchaseOrders', orderToSave);
    updateStockFromOrder(orderToSave, oldOrder);
    if (orderToSave.status === 'Received') {
      updateAverageCosts(orderToSave);
    }
    onSuccess();
    toast.success(t('success'), { description: `Purchase Order #${orderToSave.id || 'new'} saved successfully.` });
  }, [
    order, orderItems, selectedCurrency, manualExchangeRate, manualFeesExchangeRate, currentExchangeRateToAZN,
    onSuccess, isEdit, purchaseOrders, saveItem, updateStockFromOrder, updateAverageCosts, showAlertModal, getNextId, packingUnitMap,
    settings.mainCurrency, currencyRates, t
  ]);

  // These are SellOrder-specific button states and should not be in PurchaseOrder actions.
  // They are being removed.
  const isGenerateMovementDisabled = true;
  const isGeneratePaymentDisabled = true;

  return {
    handleGenerateProductMovement,
    handleGenerateIncomingPayment,
    handleSubmit,
    isGenerateMovementDisabled,
    isGeneratePaymentDisabled,
  };
};