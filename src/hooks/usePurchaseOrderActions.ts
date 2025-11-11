"use client";

import { useCallback } from 'react';
import { useData, MOCK_CURRENT_DATE } from '@/context/DataContext';
import { toast } from 'sonner';
import { PurchaseOrder, Product, OrderItem, Currency } from '@/types';
import { t } from '@/utils/i18n';

interface PurchaseOrderItemState {
  productId: number | '';
  qty: number | string;
  price: number | string;
  itemTotal: number | string;
  currency?: Currency;
  landedCostPerUnit?: number;
}

interface UsePurchaseOrderActionsProps {
  order: Partial<PurchaseOrder>;
  orderItems: PurchaseOrderItemState[];
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
  } = useData();

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (!order.contactId || !order.warehouseId || !order.orderDate) {
      showAlertModal('Validation Error', 'Supplier, Warehouse, and Order Date are required.');
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

    const finalOrderItems: OrderItem[] = validOrderItems.map(item => ({
      productId: item.productId as number,
      qty: parseFloat(String(item.qty)) || 0,
      price: parseFloat(String(item.price)) || 0,
      currency: selectedCurrency,
      landedCostPerUnit: item.landedCostPerUnit,
    }));

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
    purchaseOrders, saveItem, updateStockFromOrder, updateAverageCosts, showAlertModal, getNextId
  ]);

  return {
    handleSubmit,
  };
};