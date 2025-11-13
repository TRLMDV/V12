"use client";

import { useCallback } from 'react';
import { useData } from '@/context/DataContext';
import { MOCK_CURRENT_DATE } from '@/data/initialData'; // Corrected import
import { toast } from 'sonner';
import { PurchaseOrder, Product, OrderItem, Currency, PackingUnit } from '@/types';
import { t } from '@/utils/i18n';

interface UsePurchaseOrderActionsProps {
  order: Partial<PurchaseOrder>;
  orderItems: OrderItem[]; // Changed from PurchaseOrderItemState[] to OrderItem[]
  selectedCurrency: Currency;
  manualExchangeRate?: number;
  currentExchangeRate: number;
  onSuccess: () => void;
  isEdit: boolean;
}

export const usePurchaseOrderActions = ({
  order,
  orderItems,
  selectedCurrency,
  manualExchangeRate,
  currentExchangeRate,
  onSuccess,
  isEdit,
}: UsePurchaseOrderActionsProps) => {
  const {
    purchaseOrders,
    saveItem,
    updateStockFromOrder,
    updateAverageCosts,
    showAlertModal,
    getNextId,
    packingUnitMap,
  } = useData();

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (!order.contactId || !order.warehouseId || !order.orderDate) {
      showAlertModal('Validation Error', 'Supplier, Warehouse, and Order Date are required.');
      return;
    }

    // Filter for valid items. Since orderItems are already OrderItem[], productId, qty, price are numbers.
    const validOrderItems = orderItems.filter(item =>
      item.productId !== undefined && item.productId !== null && // Ensure productId is a number
      item.qty > 0 &&
      item.price >= 0
    );

    if (validOrderItems.length === 0) {
      showAlertModal('Validation Error', 'Please add at least one valid order item with a product, quantity, and price greater than zero.');
      return;
    }

    if (selectedCurrency !== 'AZN' && (!manualExchangeRate || manualExchangeRate <= 0)) {
      showAlertModal('Validation Error', 'Please enter a valid exchange rate for the selected currency.');
      return;
    }

    // validOrderItems are already in the correct OrderItem structure, no need to re-map
    const finalOrderItems: OrderItem[] = validOrderItems;

    const orderToSave: PurchaseOrder = {
      ...order,
      id: order.id || getNextId('purchaseOrders'), // Use getNextId for new orders
      contactId: order.contactId as number,
      warehouseId: order.warehouseId as number,
      orderDate: order.orderDate,
      status: order.status || 'Draft',
      items: finalOrderItems,
      currency: selectedCurrency,
      exchangeRate: selectedCurrency === 'AZN' ? undefined : currentExchangeRate,
      transportationFees: order.transportationFees || 0,
      transportationFeesCurrency: order.transportationFeesCurrency || 'AZN',
      customFees: order.customFees || 0,
      customFeesCurrency: order.customFeesCurrency || 'AZN',
      additionalFees: order.additionalFees || 0,
      additionalFeesCurrency: order.additionalFeesCurrency || 'AZN',
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
    order, orderItems, selectedCurrency, manualExchangeRate, currentExchangeRate, onSuccess, isEdit,
    purchaseOrders, saveItem, updateStockFromOrder, updateAverageCosts, showAlertModal, getNextId, packingUnitMap
  ]);

  return {
    handleSubmit,
  };
};