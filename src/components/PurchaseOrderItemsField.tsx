"use client";

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/utils/i18n';
import { Product, Currency, PackingUnit, PurchaseOrderItemState } from '@/types';

interface PurchaseOrderItemsFieldProps {
  orderItems: PurchaseOrderItemState[];
  handleOrderItemChange: (index: number, field: keyof PurchaseOrderItemState, value: any) => void;
  removeOrderItem: (index: number) => void;
  addOrderItem: () => void;
  products: Product[];
  productMap: { [key: number]: Product };
  packingUnits: PackingUnit[];
  packingUnitMap: { [key: number]: PackingUnit };
  warehouseId?: number;
  selectedCurrency: Currency;
  openComboboxIndex: number | null;
  setOpenComboboxIndex: React.Dispatch<React.SetStateAction<number | null>>;
}

const PurchaseOrderItemsField: React.FC<PurchaseOrderItemsFieldProps> = ({
  orderItems,
  handleOrderItemChange,
  removeOrderItem,
  addOrderItem,
  products,
  productMap,
  packingUnits,
  packingUnitMap,
  warehouseId,
  selectedCurrency,
  openComboboxIndex,
  setOpenComboboxIndex,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    console.log("DEBUG: [PurchaseOrderItemsField] searchQuery updated to:", searchQuery);
  }, [searchQuery]);

  // Filter products based on exact SKU match
  const filteredProducts = products.filter(product => {
    const trimmedProductSku = String(product.sku).trim().toLowerCase();
    const trimmedSearchQuery = searchQuery.trim().toLowerCase();
    // console.log(`DEBUG: [PurchaseOrderItemsField] Filtering product SKU='${trimmedProductSku}' against search='${trimmedSearchQuery}'`);
    return trimmedSearchQuery === '' || trimmedProductSku === trimmedSearchQuery;
  });

  useEffect(() => {
    console.log("DEBUG: [PurchaseOrderItemsField] Filtered products for display:", filteredProducts.map(p => ({ id: p.id, name: p.name, sku: p.sku })));
  }, [filteredProducts]);

  return (
    <>
      <h3 className="font-semibold mt-4 mb-2 text-gray-700 dark:text-slate-200">{t('orderItems')}</h3>
      <div className="grid grid-cols-12 gap-2 mb-2 items-center text-sm font-medium text-gray-700 dark:text-slate-300">
        <Label className="col-span-2">{t('product')}</Label>
        <Label className="col-span-2">{t('packingUnit')}</Label>
        <Label className="col-span-1">{t('qty')}</Label>
        <Label className="col-span-2">{t('price')}</Label>
        <Label className="col-span-2">{t('itemTotal')}</Label>
        <Label className="col-span-2">{t('landedCostPerUnit')}</Label>
        <Label className="col-span-1"></Label>
      </div>
      <div id="order-items">
        {orderItems.map((item, index) => {
          const selectedProduct = item.productId ? productMap[item.productId] : undefined;
          const selectedPackingUnit = item.packingUnitId ? packingUnitMap[item.packingUnitId] : undefined;
          const stockInBaseUnits = selectedProduct?.stock?.[warehouseId as number] || 0;

          return (
            <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-center">
              <Popover open={openComboboxIndex === index} onOpenChange={(open) => setOpenComboboxIndex(open ? index : null)}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openComboboxIndex === index}
                    className="col-span-2 justify-between"
                  >
                    {item.productId
                      ? selectedProduct?.name || t('selectProduct')
                      : t('selectProduct')}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command shouldFilter={false} filter={() => 0}> {/* Explicitly disable internal filtering */}
                    <CommandInput
                      placeholder={t('searchProductByExactSku')}
                      value={searchQuery}
                      onValueChange={(currentValue) => {
                        console.log("DEBUG: [PurchaseOrderItemsField] CommandInput onValueChange:", currentValue);
                        setSearchQuery(currentValue);
                      }}
                    />
                    <CommandEmpty>{t('noProductFound')}</CommandEmpty>
                    <CommandGroup>
                      {filteredProducts.map((product) => {
                        console.log("DEBUG: [PurchaseOrderItemsField] Rendering CommandItem for product SKU:", product.sku);
                        return (
                          <CommandItem
                            key={product.id}
                            value={product.id.toString()} // Use product ID as value
                            onSelect={() => {
                              handleOrderItemChange(index, 'productId', product.id);
                              setOpenComboboxIndex(null);
                              setSearchQuery(''); // Clear search query after selection
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                item.productId === product.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {product.name} ({product.sku}) ({t('stockAvailable')}: {product.stock?.[warehouseId as number] || 0} {t('piece')})
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>

              <Select onValueChange={(value) => handleOrderItemChange(index, 'packingUnitId', value)} value={String(item.packingUnitId || 'none-selected')}>
                <SelectTrigger className="col-span-2">
                  <SelectValue placeholder={t('selectPackingUnit')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none-selected">{t('selectPackingUnit')}</SelectItem>
                  {packingUnits.map(pu => (
                    <SelectItem key={pu.id} value={String(pu.id)}>
                      {pu.name} ({pu.conversionFactor} {t(pu.baseUnit)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="text"
                value={item.packingQuantity}
                onChange={(e) => handleOrderItemChange(index, 'packingQuantity', e.target.value)}
                className="col-span-1"
                disabled={!item.packingUnitId}
              />
              <Input
                type="text"
                step="0.01"
                value={item.price}
                onChange={(e) => handleOrderItemChange(index, 'price', e.target.value)}
                className="col-span-2"
              />
              <Input
                type="text"
                step="0.01"
                value={item.itemTotal}
                readOnly
                className="col-span-2 bg-gray-50 dark:bg-slate-700"
              />
              <Input
                type="text"
                value={item.landedCostPerUnit !== undefined ? `${item.landedCostPerUnit.toFixed(2)} AZN` : 'N/A'}
                readOnly
                className="col-span-2 bg-gray-50 dark:bg-slate-700"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeOrderItem(index)}
                className="col-span-1 text-red-500 hover:text-red-700"
              >
                &times;
              </Button>
            </div>
          );
        })}
      </div>
      <Button type="button" onClick={addOrderItem} variant="outline" className="mt-2">
        {t('addItem')}
      </Button>
    </>
  );
};

export default PurchaseOrderItemsField;