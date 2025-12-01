"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, DollarSign } from 'lucide-react';
import { t } from '@/utils/i18n';
import { useSellOrderForm } from '@/hooks/useSellOrderForm';
import SellOrderItemsField from '@/components/SellOrderItemsField';
import { Product, Customer, Warehouse, Currency } from '@/types';
import { useData } from '@/context/DataContext';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'; // Import useBarcodeScanner
import { toast } from 'sonner'; // Import toast

interface SellOrderFormProps {
  orderId?: number;
  onSuccess: () => void;
}

const SellOrderForm: React.FC<SellOrderFormProps> = ({ orderId, onSuccess }) => {
  const {
    order,
    orderItems,
    setOrderItems, // Need setter for barcode integration
    products, // Need products for barcode lookup
    productMap,
    packingUnits,
    packingUnitMap,
    customers,
    warehouses,
    isGenerateMovementDisabled,
    isGeneratePaymentDisabled,
    handleChange,
    handleNumericChange,
    handleSelectChange,
    handleCurrencyChange,
    handleExchangeRateChange,
    addOrderItem,
    removeOrderItem,
    handleOrderItemChange,
    handleGenerateProductMovement,
    handleGenerateIncomingPayment,
    handleSubmit,
    totalVatAmount,
    totalCleanProfit,
    selectedCurrency,
    manualExchangeRateInput,
    mainCurrency,
    subtotalInOrderCurrency,
    activeCurrencies,
    openComboboxIndex, // Destructure openComboboxIndex
    setOpenComboboxIndex, // Destructure setOpenComboboxIndex
    date, // New: date state from hook
    setDate, // New: setDate from hook
    selectedHour, // New: selectedHour state from hook
    setSelectedHour, // New: setSelectedHour from hook
    selectedMinute, // New: selectedMinute state from hook
    setSelectedMinute, // New: setSelectedMinute from hook
  } = useSellOrderForm({ orderId, onSuccess });

  const { settings } = useData(); // Get settings for defaultMarkup
  const defaultMarkup = settings.defaultMarkup / 100; // Get default markup

  const hoursArray = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutesArray = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  // Barcode scanner integration
  const handleBarcodeScanned = (barcode: string) => {
    const product = products.find(p => p.barcode === barcode); // Changed to search by barcode
    if (product) {
      setOrderItems(prevItems => {
        const newItems = [...prevItems];
        // Check if product already exists in items, if so, increment quantity
        const existingItemIndex = newItems.findIndex(item => item.productId === product.id);
        if (existingItemIndex !== -1) {
          const existingItem = newItems[existingItemIndex];
          const currentQty = parseFloat(String(existingItem.qty)) || 0;
          const currentPackingQty = parseFloat(String(existingItem.packingQuantity)) || 0;
          
          // If a packing unit is selected, increment packing quantity
          if (existingItem.packingUnitId && packingUnitMap[existingItem.packingUnitId]) {
            const newPackingQty = currentPackingQty + 1;
            // Directly update the item in the array and then call handleOrderItemChange
            newItems[existingItemIndex] = { ...existingItem, packingQuantity: String(newPackingQty) };
            handleOrderItemChange(existingItemIndex, 'packingQuantity', String(newPackingQty));
          } else {
            // Otherwise, increment base quantity
            // Directly update the item in the array and then call handleOrderItemChange
            newItems[existingItemIndex] = { ...existingItem, qty: String(currentQty + 1) };
            handleOrderItemChange(existingItemIndex, 'qty', String(currentQty + 1));
          }
          toast.success(t('barcodeScanned'), { description: `${product.name} ${t('quantityIncremented')}.` });
          return newItems; // Return updated array
        } else {
          // Add new item
          const sellingPrice = (product.averageLandedCost || 0) * (1 + defaultMarkup);
          const piecePackingUnitId = packingUnits.find(pu => pu.name === 'Piece')?.id;

          newItems.push({
            productId: product.id,
            qty: '1', // Default to 1 base unit
            price: sellingPrice.toFixed(2),
            itemTotal: sellingPrice.toFixed(2),
            landedCost: product.averageLandedCost,
            packingUnitId: product.defaultPackingUnitId || piecePackingUnitId, // Use product's default or 'Piece'
            packingQuantity: '1', // Default to 1 packing unit if a default is set
          });
          toast.success(t('barcodeScanned'), { description: `${product.name} ${t('addedToOrder')}.` });
          return newItems;
        }
      });
    } else {
      toast.error(t('productNotFound'), { description: t('productNotFoundDescription', { barcode }) });
    }
  };

  useBarcodeScanner({ onBarcodeScanned: handleBarcodeScanned });

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="contactId" className="text-right">{t('customer')}</Label>
          <Select onValueChange={(value) => handleSelectChange('contactId', value)} value={String(order.contactId || '')}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder={t('selectCustomer')} />
            </SelectTrigger>
            <SelectContent>
              {customers.map(c => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="warehouseId" className="text-right">{t('warehouse')}</Label>
          <Select onValueChange={(value) => handleSelectChange('warehouseId', value)} value={String(order.warehouseId || '')}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder={t('selectWarehouse')} />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map(w => (
                <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="orderDate" className="text-right">
            {t('orderDate')}
          </Label>
          <div className="col-span-3 flex gap-2">
            <Input
              id="orderDate"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-grow"
              required
            />
            <Select onValueChange={setSelectedHour} value={selectedHour}>
              <SelectTrigger className="w-[80px]">
                <SelectValue placeholder={t('hours')} />
              </SelectTrigger>
              <SelectContent>
                {hoursArray.map(h => (
                  <SelectItem key={h} value={h}>{h}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={setSelectedMinute} value={selectedMinute}>
              <SelectTrigger className="w-[80px]">
                <SelectValue placeholder={t('minutes')} />
              </SelectTrigger>
              <SelectContent>
                {minutesArray.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="status" className="text-right">{t('orderStatus')}</Label>
          <Select onValueChange={(value) => handleSelectChange('status', value)} value={order.status || 'Draft'}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder={t('status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Draft">{t('draft')}</SelectItem>
              <SelectItem value="Confirmed">{t('confirmed')}</SelectItem>
              <SelectItem value="Shipped">{t('shipped')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="currency" className="text-right">{t('orderCurrency')}</Label>
          <Select onValueChange={handleCurrencyChange} value={selectedCurrency}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder={mainCurrency} />
            </SelectTrigger>
            <SelectContent>
              {activeCurrencies.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCurrency !== 'AZN' && (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="exchangeRate" className="text-right">{t('exchangeRateToAZN')}</Label>
            <div className="col-span-3">
              <Input
                id="exchangeRate"
                type="text"
                value={manualExchangeRateInput}
                onChange={handleExchangeRateChange}
                placeholder={t('exchangeRatePlaceholder')}
                className="mb-1"
                required
              />
              <p className="text-xs text-gray-500 dark:text-slate-400">{t('exchangeRateHelpText')}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="vatPercent" className="text-right">{t('vatPercent')}</Label>
          <Input
            id="vatPercent"
            type="number"
            step="0.01"
            value={String(order.vatPercent || 0)}
            onChange={(e) => handleNumericChange('vatPercent', e.target.value)}
            className="col-span-3"
            min="0"
            max="100"
          />
        </div>

        <SellOrderItemsField
          orderItems={orderItems}
          handleOrderItemChange={handleOrderItemChange}
          removeOrderItem={removeOrderItem}
          addOrderItem={addOrderItem}
          products={products}
          productMap={productMap}
          packingUnits={packingUnits}
          packingUnitMap={packingUnitMap}
          warehouseId={order.warehouseId as number}
          openComboboxIndex={openComboboxIndex} // Pass openComboboxIndex
          setOpenComboboxIndex={setOpenComboboxIndex} // Pass setOpenComboboxIndex
        />

        <div className="grid grid-cols-4 items-center gap-4 mt-6 border-t pt-4 dark:border-slate-700">
          <Label className="text-right text-md font-semibold">{t('productsSubtotal')}</Label>
          <Input
            id="productsSubtotal"
            type="text"
            value={`${subtotalInOrderCurrency.toFixed(2)} ${selectedCurrency}`}
            readOnly
            className="col-span-3 font-semibold bg-gray-50 dark:bg-slate-700"
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right text-md font-semibold">{t('totalVat')}</Label>
          <Input
            id="totalVat"
            type="text"
            value={`${totalVatAmount.toFixed(2)} ${mainCurrency}`}
            readOnly
            className="col-span-3 font-semibold bg-gray-50 dark:bg-slate-700"
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right text-md font-semibold">{t('totalCleanProfit')}</Label>
          <Input
            id="totalCleanProfit"
            type="text"
            value={`${totalCleanProfit.toFixed(2)} ${mainCurrency}`}
            readOnly
            className="col-span-3 font-semibold bg-gray-50 dark:bg-slate-700"
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4 mt-4 border-t pt-4 dark:border-slate-700">
          <Label className="text-right text-lg font-bold">{t('total')}</Label>
          <Input
            id="total"
            type="text"
            value={`${order.total?.toFixed(2) || '0.00'} ${mainCurrency}`}
            readOnly
            className="col-span-3 font-bold text-lg bg-gray-50 dark:bg-slate-700"
          />
        </div>
      </div>
      <div className="flex justify-end mt-6 border-t pt-4 dark:border-slate-700 space-x-2">
        <Button
          type="button"
          onClick={handleGenerateIncomingPayment}
          variant="secondary"
          className="flex items-center"
          disabled={isGeneratePaymentDisabled as boolean}
        >
          <DollarSign className="w-4 h-4 mr-2" />
          {t('generateIncomingPayment')}
        </Button>
        <Button
          type="button"
          onClick={handleGenerateProductMovement}
          variant="secondary"
          className="flex items-center"
          disabled={isGenerateMovementDisabled as boolean}
        >
          <ArrowRight className="w-4 h-4 mr-2" />
          {t('generateProductMovement')}
        </Button>
        <Button type="submit">{t('saveOrder')}</Button>
      </div>
    </form>
  );
};

export default SellOrderForm;