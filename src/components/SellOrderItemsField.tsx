"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/utils/i18n';
import { Product, PackingUnit } from '@/types'; // Import PackingUnit

interface SellOrderItemState {
  productId: number | '';
  qty: number | string; // This will be the quantity in base units
  price: number | string;
  itemTotal: number | string;
  cleanProfit?: number; // New field for calculated clean profit per item
  landedCost?: number; // Added: Landed cost for the product
  packingUnitId?: number; // New: ID of the selected packing unit
  packingQuantity?: number | string; // New: Quantity in terms of the selected packing unit
}

interface SellOrderItemsFieldProps {
  orderItems: SellOrderItemState[];
  handleOrderItemChange: (index: number, field: keyof SellOrderItemState, value: any) => void;
  removeOrderItem: (index: number) => void;
  addOrderItem: () => void;
  products: Product[];
  productMap: { [key: number]: Product };
  packingUnits: PackingUnit[]; // New: Pass packingUnits array
  packingUnitMap: { [key: number]: PackingUnit }; // New: Pass packingUnitMap
  warehouseId?: number;
}

const SellOrderItemsField: React.FC<SellOrderItemsFieldProps> = ({
  orderItems,
  handleOrderItemChange,
  removeOrderItem,
  addOrderItem,
  products,
  productMap,
  packingUnits, // Destructure new prop
  packingUnitMap, // Destructure new prop
  warehouseId,
}) => {
  const [searchQuery, setSearchQuery] = useState(''); // Local state for the search input

  // Filter products based on exact SKU match
  const filteredProducts = products.filter(product => {
    const trimmedProductSku = String(product.sku).trim().toLowerCase();
    const trimmedSearchQuery = searchQuery.trim().toLowerCase();
    console.log(`DEBUG: Filtering product SKU='${trimmedProductSku}' against search='${trimmedSearchQuery}'`);
    return trimmedSearchQuery === '' || trimmedProductSku === trimmedSearchQuery;
  });

  return (
    <>
      <h3 className="font-semibold mt-4 mb-2 text-gray-700 dark:text-slate-200">{t('orderItems')}</h3>
      <div className="grid grid-cols-12 gap-2 mb-2 items-center text-sm font-medium text-gray-700 dark:text-slate-300">
        <Label className="col-span-3">{t('product')}</Label>
        <Label className="col-span-2">{t('packingUnit')}</Label> {/* New column */}
        <Label className="col-span-1">{t('qty')}</Label> {/* Now refers to packing quantity */}
        <Label className="col-span-2">{t('price')}</Label>
        <Label className="col-span-2">{t('itemTotal')}</Label>
        <Label className="col-span-1">{t('cleanProfit')}</Label>
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
                    className="col-span-3 justify-between"
                  >
                    {item.productId
                      ? selectedProduct?.name || t('selectProduct')
                      : t('selectProduct')}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command shouldFilter={false}> {/* Disable internal filtering */}
                    <CommandInput
                      placeholder={t('searchProductByExactSku')}
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <CommandEmpty>{t('noProductFound')}</CommandEmpty>
                    <CommandGroup>
                      {filteredProducts.map((product) => ( // Use filteredProducts here
                        <CommandItem
                          key={product.id}
                          value={product.sku}
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
                          {warehouseId !== undefined && product.stock && product.stock[warehouseId] !== undefined && (
                            <span className="ml-2 text-xs text-gray-500 dark:text-slate-400">
                              ({t('stockAvailable')}: {product.stock[warehouseId]} {t('piece')})
                            </span>
                          )}
                        </CommandItem>
                      ))}
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
                onChange={(e) => handleOrderItemChange(index, 'itemTotal', e.target.value)}
                className="col-span-2"
              />
              <Input
                type="text"
                value={item.cleanProfit !== undefined ? item.cleanProfit.toFixed(2) : '0.00'}
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

export default SellOrderItemsField;