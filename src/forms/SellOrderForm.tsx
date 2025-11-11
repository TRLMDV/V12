"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, DollarSign } from 'lucide-react'; // Added DollarSign icon
import { t } from '@/utils/i18n';
import { useSellOrderForm } from '@/hooks/useSellOrderForm';
import SellOrderItemsField from '@/components/SellOrderItemsField';
import { Product, Customer, Warehouse, Currency } from '@/types'; // Import types from types file

interface SellOrderFormProps {
  orderId?: number;
  onSuccess: () => void;
}

const SellOrderForm: React.FC<SellOrderFormProps> = ({ orderId, onSuccess }) => {
  const {
    order,
    orderItems,
    customerMap,
    warehouseMap,
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
    products,
    customers,
    warehouses,
    productMap,
    totalVatAmount,
    totalCleanProfit,
    selectedCurrency,
    manualExchangeRateInput,
    mainCurrency,
    subtotalInOrderCurrency,
  } = useSellOrderForm({ orderId, onSuccess });

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
              {settings.activeCurrencies.map(c => (
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
          warehouseId={order.warehouseId as number}
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
          disabled={isGeneratePaymentDisabled}
        >
          <DollarSign className="w-4 h-4 mr-2" />
          {t('generateIncomingPayment')}
        </Button>
        <Button 
          type="button" 
          onClick={handleGenerateProductMovement} 
          variant="secondary" 
          className="flex items-center"
          disabled={isGenerateMovementDisabled}
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