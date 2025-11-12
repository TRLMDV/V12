"use client";

import { useCallback } from 'react';
import { useData, MOCK_CURRENT_DATE } from '@/context/DataContext';
import { toast } from 'sonner';
import { PurchaseOrder, Product, OrderItem, Currency } from '@/types';
import { useTranslation } from '@/hooks/useTranslation'; // Updated import

interface PurchaseOrderItemState {
  productId: number | '';
  qty: number | string; // This will be the quantity in base units
  price: number | string;
  itemTotal: number | string;
  currency?: Currency;
  landedCostPerUnit?: number;
  packingUnitId?: number; // New: ID of the selected packing unit
  packingQuantity?: number | string; // New: Quantity in terms of the selected packing unit
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
    packingUnitMap, // New: Access packingUnitMap
  } = useData();
  const { t } = useTranslation(); // Use the new hook

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (!order.contactId || !order.warehouseId || !order.orderDate) {
      showAlertModal(t('validationError'), t('supplierWarehouseAndOrderDateAreRequired'));
      return;
    }

    const validOrderItems = orderItems.filter(item => item.productId !== '' && parseFloat(String(item.packingQuantity)) > 0 && parseFloat(String(item.price)) >= 0);
    if (validOrderItems.length === 0) {
      showAlertModal(t('validationError'), t('pleaseAddAtLeastOneValidOrderItem'));
      return;
    }

    if (selectedCurrency !== 'AZN' && (!manualExchangeRate || manualExchangeRate <= 0)) {
      showAlertModal(t('validationError'), t('pleaseEnterAValidExchangeRate'));
      return;
    }

    const finalOrderItems: OrderItem[] = validOrderItems.map(item => {
      const packingUnit = item.packingUnitId ? packingUnitMap[item.packingUnitId] : undefined;
      const packingQtyNum = parseFloat(String(item.packingQuantity)) || 0;
      const baseQty = packingUnit ? packingQtyNum * packingUnit.conversionFactor : packingQtyNum; // Calculate base quantity

      return {
        productId: item.productId as number,
        qty: baseQty, // Store quantity in base units
        price: parseFloat(String(item.price)) || 0,
        currency: selectedCurrency,
        landedCostPerUnit: item.landedCostPerUnit,
        packingUnitId: item.packingUnitId, // Store packing unit ID
        packingQuantity: packingQtyNum, // Store quantity in packing units
      };
    });

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
    toast.success(t('success'), { description: t('purchaseOrderSavedSuccessfully', { orderId: String(orderToSave.id || 'new') }) });
  }, [
    order, orderItems, selectedCurrency, manualExchangeRate, currentExchangeRate, onSuccess, isEdit,
    purchaseOrders, saveItem, updateStockFromOrder, updateAverageCosts, showAlertModal, getNextId, packingUnitMap, t
  ]);

  return {
    handleSubmit,
  };
};