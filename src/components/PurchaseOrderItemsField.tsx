"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
import { formatNumberInput } from '@/utils/formatters'; // Import the new formatter

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

  // Filter products based on 'starts with' for SKU or name
  const filteredProducts = useMemo(() => {
    const trimmedSearchQuery = searchQuery.trim().toLowerCase();
    if (trimmedSearchQuery === '') {
      return products; // Show all products when search is empty
    }
    return products.filter(product => {
      const productName = String(product.name).trim().toLowerCase();
      const productSku = String(product.sku).trim().toLowerCase();
      return productName.startsWith(trimmedSearchQuery) || productSku.startsWith(trimmedSearchQuery);
    });
  }, [products, searchQuery]);

  return (
    <>
      <h3 className="font-semibold mt-4 mb-2 text-gray-700 dark:text-slate-200">{t('orderItems')}</h3>
      <div className="grid grid-cols-12 gap-2 mb-2 items-center text-sm font-medium text-gray-700 dark:text-slate-300">
        <Label className="col-span-4">{t('product')}</Label> {/* Changed from col-span-3 to col-span-4 */}
        <Label className="col-span-2">{t('sku')}</Label> {/* Changed from col-span-3 to col-span-2 */}
        <Label className="col-span-1">{t('packingUnit')}</Label>
        <Label className="col-span-1">{t('qty')}</Label>
        <Label className="col-span-1">{t('price')}</Label>
        <Label className="col-span-1">{t('itemTotal')}</Label>
        <Label className="col-span-1">{t('landedCostPerUnit')}</Label>
        <Label className="col-span-1"></Label>
      </div>
      <div id="order-items">
        {orderItems.map((item, index) => {
          const selectedProduct = item.productId ? productMap[item.productId] : undefined;
          const selectedPackingUnit = item.packingUnitId ? packingUnitMap[item.packingUnitId] : undefined;
          const stockInBaseUnits = selectedProduct?.stock?.[warehouseId as number] || 0;

          return (
            <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-center">
              <Popover open={openComboboxIndex === index} onOpenChange={(open) => {
                setOpenComboboxIndex(open ? index : null);
                if (!open) {
                  setSearchQuery(''); // Reset search query when popover closes
                }
              }}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openComboboxIndex === index}
                    // Changed from col-span-3 to col-span-4
                    className="col-span-4 justify-between"
                  >
                    {item.productId
                      ? selectedProduct?.name || t('selectProduct')
                      : t('selectProduct')}
                    {/* Removed ChevronsUpDown icon */}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder={t('searchProductBySku')}
                      value={searchQuery}
                      onValueChange={(currentValue) => setSearchQuery(currentValue)}
                      className="w-full" // Removed no-spin-buttons as it's not a number input
                    />
                    <CommandEmpty>{t('noProductFound')}</CommandEmpty>
                    <CommandGroup key={searchQuery}>
                      {filteredProducts.map((product) => {
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
                            {product.name} ({product.sku})
                            {warehouseId !== undefined && product.stock && product.stock[warehouseId] !== undefined ? (
                              <span className="ml-2 text-xs text-gray-500 dark:text-slate-400">
                                ({t('stockAvailable')}: {product.stock[warehouseId]} {t('piece')})
                              </span>
                            ) : (
                              <span className="ml-2 text-xs text-gray-500 dark:text-slate-400">
                                ({t('selectWarehouseToSeeStock')})
                              </span>
                            )}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* New SKU Input Field */}
              <Input
                type="text"
                value={selectedProduct?.sku || ''}
                readOnly
                // Changed from col-span-3 to col-span-2
                className="col-span-2 bg-gray-50 dark:bg-slate-700"
              />

              <Select onValueChange={(value) => handleOrderItemChange(index, 'packingUnitId', value)} value={String(item.packingUnitId || 'none-selected')}>
                <SelectTrigger className="col-span-1">
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
                className="col-span-1 no-spin-buttons"
                value={formatNumberInput(item.packingQuantity)} // Use raw string from state
                onChange={(e) => handleOrderItemChange(index, 'packingQuantity', e.target.value)}
                disabled={!item.packingUnitId}
                inputMode="decimal"
                pattern="^\d*\.?\d*$"
              />
              <Input
                type="text"
                className="col-span-1 no-spin-buttons"
                value={formatNumberInput(item.price)} // Use raw string from state
                onChange={(e) => handleOrderItemChange(index, 'price', e.target.value)}
                inputMode="decimal"
                pattern="^\d*\.?\d*$"
              />
              <Input
                type="text"
                className="col-span-1 no-spin-buttons"
                value={formatNumberInput(item.itemTotal)} // Use raw string from state
                onChange={(e) => handleOrderItemChange(index, 'itemTotal', e.target.value)}
                inputMode="decimal"
                pattern="^\d*\.?\d*$"
              />
              <Input
                type="text"
                value={item.landedCostPerUnit !== undefined ? formatNumberInput(item.landedCostPerUnit) + ' AZN' : 'N/A'}
                readOnly
                className="col-span-1 bg-gray-50 dark:bg-slate-700"
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