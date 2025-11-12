"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { t } from '@/utils/i18n';
import { usePurchaseOrderForm } from '@/hooks/usePurchaseOrderForm';
import PurchaseOrderItemsField from '@/components/PurchaseOrderItemsField'; // New component

interface PurchaseOrderFormProps {
  orderId?: number;
  onSuccess: () => void;
}

const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({ orderId, onSuccess }) => {
  const {
    order,
    orderItems,
    suppliers,
    warehouses,
    products,
    productMap,
    packingUnits, // New: packingUnits
    packingUnitMap, // New: packingUnitMap
    activeCurrencies,
    mainCurrency,
    handleChange,
    handleNumericChange,
    handleSelectChange,
    handleCurrencyChange,
    handleExchangeRateChange,
    addOrderItem,
    removeOrderItem,
    handleOrderItemChange,
    handleSubmit,
    productsSubtotalNative,
    displayedFeesBreakdown,
    selectedCurrency,
    manualExchangeRateInput,
    openComboboxIndex,
    setOpenComboboxIndex,
  } = usePurchaseOrderForm({ orderId, onSuccess });

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
          <Label htmlFor="orderDate" className="text-right">{t('orderDate')}</Label>
          <Input
            id="orderDate"
            type="date"
            value={order.orderDate || ''}
            onChange={handleChange}
            className="col-span-3"
            required
          />
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
          <Label htmlFor="transportationFees" className="text-right">{t('transportationFees')}</Label>
          <Input
            id="transportationFees"
            type="number"
            step="0.01"
            value={String(order.transportationFees || 0)}
            onChange={(e) => handleNumericChange('transportationFees', e.target.value)}
            className="col-span-2"
            min="0"
          />
          <Select onValueChange={(value: Currency) => handleSelectChange('transportationFeesCurrency', value)} value={order.transportationFeesCurrency || 'AZN'}>
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
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="customFees" className="text-right">{t('customFees')}</Label>
          <Input
            id="customFees"
            type="number"
            step="0.01"
            value={String(order.customFees || 0)}
            onChange={(e) => handleNumericChange('customFees', e.target.value)}
            className="col-span-2"
            min="0"
          />
          <Select onValueChange={(value: Currency) => handleSelectChange('customFeesCurrency', value)} value={order.customFeesCurrency || 'AZN'}>
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
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="additionalFees" className="text-right">{t('additionalFees')}</Label>
          <Input
            id="additionalFees"
            type="number"
            step="0.01"
            value={String(order.additionalFees || 0)}
            onChange={(e) => handleNumericChange('additionalFees', e.target.value)}
            className="col-span-2"
            min="0"
          />
          <Select onValueChange={(value: Currency) => handleSelectChange('additionalFeesCurrency', value)} value={order.additionalFeesCurrency || 'AZN'}>
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