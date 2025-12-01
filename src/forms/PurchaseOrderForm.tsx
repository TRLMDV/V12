"use client";

import React from 'react'; // Ensure React is imported for JSX
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea'; // Import Textarea
import { t } from '@/utils/i18n';
import { usePurchaseOrderForm } from '@/hooks/usePurchaseOrderForm';
import PurchaseOrderItemsField from '@/components/PurchaseOrderItemsField'; // New component
import { Currency } from '@/types'; // Import Currency type
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'; // Import useBarcodeScanner
import { toast } from 'sonner'; // Import toast

interface PurchaseOrderFormProps {
  orderId?: number;
  onSuccess: () => void;
}

const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({ orderId, onSuccess }) => {
  const {
    order,
    orderItems,
    setOrderItems, // Need setter for barcode integration
    products, // Need products for barcode lookup
    productMap,
    packingUnits, // New: packingUnits
    packingUnitMap, // New: packingUnitMap
    suppliers,
    warehouses,
    activeCurrencies,
    mainCurrency,
    handleChange,
    handleNumericChange,
    handleSelectChange,
    handleCurrencyChange,
    handleExchangeRateChange,
    handleFeesExchangeRateChange, // New: Fees exchange rate handler
    addOrderItem,
    removeOrderItem,
    handleOrderItemChange,
    handleSubmit,
    productsSubtotalNative,
    displayedFeesBreakdown,
    selectedCurrency,
    manualExchangeRateInput,
    manualFeesExchangeRateInput, // New: Fees exchange rate input state
    openComboboxIndex,
    setOpenComboboxIndex,
    date, // New: date state from hook
    setDate, // New: setDate from hook
    selectedHour, // New: selectedHour state from hook
    setSelectedHour, // New: setSelectedHour from hook
    selectedMinute, // New: selectedMinute state from hook
    setSelectedMinute, // New: setSelectedMinute from hook
  } = usePurchaseOrderForm({ orderId, onSuccess });

  const hoursArray = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutesArray = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  // Barcode scanner integration
  const handleBarcodeScanned = (barcode: string) => {
    const product = products.find(p => p.sku === barcode);
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
            handleOrderItemChange(existingItemIndex, 'packingQuantity', String(newPackingQty));
          } else {
            // Otherwise, increment base quantity
            handleOrderItemChange(existingItemIndex, 'qty', String(currentQty + 1));
          }
          toast.success(t('barcodeScanned'), { description: `${product.name} ${t('quantityIncremented')}.` });
          return newItems; // Return original array as handleOrderItemChange will trigger state update
        } else {
          // Add new item
          newItems.push({
            productId: product.id,
            qty: '1', // Default to 1 base unit
            price: '', // Price is user-inputted for PO
            itemTotal: '',
            currency: selectedCurrency,
            packingUnitId: product.defaultPackingUnitId || packingUnits.find(pu => pu.name === 'Piece')?.id,
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
          <Label htmlFor="contactId" className="text-right">{t('supplier')}</Label>
          <Select onValueChange={(value) => handleSelectChange('contactId', value)} value={String(order.contactId || '')}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder={t('selectSupplier')} />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map(s => (
                <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
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
          <Label htmlFor="status" className="text-right">{t('status')}</Label>
          <Select onValueChange={(value) => handleSelectChange('status', value)} value={order.status || 'Draft'}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder={t('status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Draft">{t('draft')}</SelectItem>
              <SelectItem value="Ordered">{t('ordered')}</SelectItem>
              <SelectItem value="Received">{t('received')}</SelectItem>
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

        <PurchaseOrderItemsField
          orderItems={orderItems}
          handleOrderItemChange={handleOrderItemChange}
          removeOrderItem={removeOrderItem}
          addOrderItem={addOrderItem}
          products={products}
          productMap={productMap}
          packingUnits={packingUnits} // Pass packingUnits
          packingUnitMap={packingUnitMap} // Pass packingUnitMap
          warehouseId={order.warehouseId as number}
          selectedCurrency={selectedCurrency}
          openComboboxIndex={openComboboxIndex}
          setOpenComboboxIndex={setOpenComboboxIndex}
        />

        <h3 className="font-semibold mt-4 mb-2 text-gray-700 dark:text-slate-200">{t('fees')}</h3>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="fees" className="text-right">{t('fees')}</Label>
          <Input
            id="fees"
            type="number"
            step="0.0001"
            value={String(order.fees || 0)}
            onChange={(e) => handleNumericChange('fees', e.target.value)}
            className="col-span-2"
            min="0"
          />
          <Select onValueChange={(value: Currency) => handleSelectChange('feesCurrency', value)} value={order.feesCurrency || 'AZN'}>
            <SelectTrigger className="col-span-1">
              <SelectValue placeholder="AZN" />
            </SelectTrigger>
            <SelectContent>
              {activeCurrencies.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {order.feesCurrency !== 'AZN' && (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="feesExchangeRate" className="text-right">{t('feesExchangeRateToAZN')}</Label>
            <div className="col-span-3">
              <Input
                id="feesExchangeRate"
                type="text"
                value={manualFeesExchangeRateInput}
                onChange={handleFeesExchangeRateChange}
                placeholder={t('exchangeRatePlaceholder')}
                className="mb-1 w-1/6"
                required
              />
              <p className="text-xs text-gray-500 dark:text-slate-400">{t('exchangeRateHelpText')}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 items-start gap-4 mt-4">
          <Label htmlFor="comment" className="text-right">
            {t('comment')}
          </Label>
          <Textarea
            id="comment"
            value={order.comment || ''}
            onChange={handleChange}
            className="col-span-3"
            placeholder={t('orderCommentPlaceholder')}
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4 mt-6 border-t pt-4 dark:border-slate-700">
          <Label className="text-right text-md font-semibold">{t('productsSubtotal')}</Label>
          <Input
            id="productsSubtotal"
            type="text"
            value={`${productsSubtotalNative.toFixed(2)} ${selectedCurrency}`}
            readOnly
            className="col-span-3 font-semibold bg-gray-50 dark:bg-slate-700"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right text-md font-semibold">{t('totalFees')}</Label>
          <Input
            id="totalFees"
            type="text"
            value={Object.entries(displayedFeesBreakdown)
              .sort(([currencyA], [currencyB]) => currencyA.localeCompare(currencyB))
              .map(([currency, amount]) => `${amount.toFixed(2)} ${currency}`)
              .join(', ')}
            readOnly
            className="col-span-3 font-semibold bg-gray-50 dark:bg-slate-700"
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4 mt-6 border-t pt-4 dark:border-slate-700">
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
      <div className="flex justify-end mt-6 border-t pt-4 dark:border-slate-700">
        <Button type="submit">{t('saveOrder')}</Button>
      </div>
    </form>
  );
};

export default PurchaseOrderForm;