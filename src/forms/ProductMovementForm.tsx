"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { t } from '@/utils/i18n';
import { Id, ProductMovement, SellOrder, Warehouse, Product } from '@/types';
import { format, parseISO } from 'date-fns';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { toast } from 'sonner';
import { formatNumberInput } from '@/utils/formatters'; // Import formatNumberInput

interface ProductMovementFormProps {
  movementId?: number;
  onSuccess: () => void;
}

interface MovementItemState {
  productId: number | '';
  quantity: number;
}

const ProductMovementForm: React.FC<ProductMovementFormProps> = ({ movementId, onSuccess }) => {
  const { productMovements, products, warehouses, saveItem, showAlertModal, setProducts, packingUnits } = useData();
  const isEdit = movementId !== undefined;
  const [sellOrderId, setSellOrderId] = React.useState<Id | ''>('');
  const [searchQuery, setSearchQuery] = useState<string>(''); // Added: state for product search input
  const [openComboboxIndex, setOpenComboboxIndex] = useState<number | null>(null); // Added: controls which combobox is open

  const { sellOrders } = useData();

  React.useEffect(() => {
    if (isEdit) {
      const existingMovement = productMovements.find(m => m.id === movementId);
      if (existingMovement) {
        setSourceWarehouseId(existingMovement.sourceWarehouseId);
        setDestWarehouseId(existingMovement.destWarehouseId);
        setMovementItems(existingMovement.items.map(item => ({ productId: item.productId, quantity: item.quantity })));
        setDate(format(parseISO(existingMovement.date), 'yyyy-MM-dd'));
        setSelectedHour(String(new Date(existingMovement.date).getHours()).padStart(2, '0'));
        setSelectedMinute(String(new Date(existingMovement.date).getMinutes()).padStart(2, '0'));
      }
    } else {
      setSourceWarehouseId('');
      setDestWarehouseId('');
      setMovementItems([{ productId: '', quantity: 1 }]);
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setSelectedHour(String(new Date().getHours()).padStart(2, '0'));
      setSelectedMinute(String(new Date().getMinutes()).padStart(2, '0'));
    }
  }, [movementId, isEdit, productMovements]);

  const addMovementItem = useCallback(() => {
    setMovementItems(prev => [...prev, { productId: '', quantity: 1 }]);
  }, []);

  const removeMovementItem = useCallback((index: number) => {
    setMovementItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleItemChange = useCallback((index: number, field: keyof MovementItemState, value: any) => {
    setMovementItems(prev => {
      const newItems = [...prev];
      const item = { ...newItems[index] };

      if (field === 'quantity') {
        // Standardize decimal separator to '.' before parsing
        const standardizedValue = String(value).replace(',', '.');
        item.quantity = parseFloat(standardizedValue) || 0;
      } else {
        item[field] = value;
      }
      newItems[index] = item;
      return newItems;
    });
  }, []);

  const filteredProducts = useMemo(() => {
    const trimmedSearchQuery = searchQuery.trim().toLowerCase();
    if (trimmedSearchQuery === '') {
      return products;
    }
    return products.filter(product => {
      const productName = String(product.name).trim().toLowerCase();
      const productSku = String(product.sku).trim().toLowerCase();
      return productName.startsWith(trimmedSearchQuery) || productSku.startsWith(trimmedSearchQuery);
    });
  }, [products, searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (sourceWarehouseId === '' || destWarehouseId === '') {
      showAlertModal('Validation Error', 'Please select both source and destination warehouses.');
      return;
    }
    if (sourceWarehouseId === destWarehouseId) {
      showAlertModal('Validation Error', 'Source and Destination warehouses cannot be the same.');
      return;
    }

    const newItems = movementItems.filter(item => item.productId !== '' && item.quantity > 0);
    if (newItems.length === 0) {
      showAlertModal('Validation Error', 'Please ensure all items have a selected product and a quantity greater than zero.');
      return;
    }

    const movementDateTime = `${date}T${selectedHour}:${selectedMinute}:00.000Z`;

    const productsCopy: Product[] = JSON.parse(JSON.stringify(products));
    const currentMovement = isEdit ? productMovements.find(m => m.id === movementId) : null;

    if (isEdit && currentMovement) {
      currentMovement.items.forEach(item => {
        const p = productsCopy.find(p => p.id === item.productId);
        if (p && p.stock) {
          p.stock[currentMovement.sourceWarehouseId] = (p.stock[currentMovement.sourceWarehouseId] || 0) + item.quantity;
          p.stock[currentMovement.destWarehouseId] = (p.stock[currentMovement.destWarehouseId] || 0) - item.quantity;
        }
      });
    }

    for (const item of newItems) {
      const p = productsCopy.find(p => p.id === item.productId);
      if (!p || !p.stock) {
        showAlertModal('Error', `Product data missing for item ID ${item.productId}`);
        return;
      }

      const stockInSource = p.stock[sourceWarehouseId as number] || 0;
      if (stockInSource < item.quantity) {
        const originalProduct = products.find(prod => prod.id === item.productId);
        const safeProductName = originalProduct?.name || 'Unknown Product';
        showAlertModal('Stock Error', `${t('notEnoughStock')} ${safeProductName}. ${t('available')}: ${stockInSource}, ${t('requested')}: ${item.quantity}.`);
        return;
      }
      p.stock[sourceWarehouseId as number] = stockInSource - item.quantity;
      p.stock[destWarehouseId as number] = (p.stock[destWarehouseId as number] || 0) + item.quantity;
    }

    setProducts(productsCopy);

    const movementToSave: ProductMovement = {
      id: movementId,
      sourceWarehouseId,
      destWarehouseId,
      items: movementItems,
      date,
      sellOrderId: sellOrderId === '' ? undefined : sellOrderId,
    };

    saveItem('productMovements', movementToSave);
    onSuccess();
  };

  const hoursArray = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutesArray = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const handleBarcodeScanned = (barcode: string) => {
    const product = products.find(p => p.barcode === barcode);
    if (product) {
      setMovementItems(prevItems => {
        const newItems = [...prevItems];
        const existingItemIndex = newItems.findIndex(item => item.productId === product.id);

        if (existingItemIndex !== -1) {
          const existingItem = newItems[existingItemIndex];
          newItems[existingItemIndex] = { ...existingItem, quantity: existingItem.quantity + 1 };
          handleItemChange(existingItemIndex, 'quantity', existingItem.quantity + 1);
          toast.success(t('barcodeScanned'), { description: `${product.name} ${t('quantityIncremented')}.` });
          return newItems;
        } else {
          newItems.push({
            productId: product.id,
            quantity: 1,
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
          <Label htmlFor="date" className="text-right">
            {t('date')}
          </Label>
          <div className="col-span-3 flex gap-2">
            <Input
              id="date"
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
          <Label htmlFor="sourceWarehouseId" className="text-right">
            {t('fromWarehouse')}
          </Label>
          <Select onValueChange={(value) => setSourceWarehouseId(parseInt(value))} value={String(sourceWarehouseId)}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder={t('sourceWarehouse')} />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map(w => (
                <SelectItem key={w.id} value={String(w.id)}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="destWarehouseId" className="text-right">
            {t('toWarehouse')}
          </Label>
          <Select onValueChange={(value) => setDestWarehouseId(parseInt(value))} value={String(destWarehouseId)}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder={t('destinationWarehouse')} />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map(w => (
                <SelectItem key={w.id} value={String(w.id)}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">{t('sellOrders')}</Label>
          <div className="col-span-3">
            <Select
              onValueChange={(val) => setSellOrderId(val ? Number(val) : '')}
              value={sellOrderId === '' ? '' : String(sellOrderId)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('selectCustomer') || 'Select Sell Order'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('none')}</SelectItem>
                {sellOrders.map((so) => (
                  <SelectItem key={so.id} value={String(so.id)}>
                    {t('order')} #{so.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <h4 className="font-semibold mt-4 mb-2 text-gray-700 dark:text-slate-200">{t('productsToMove')}</h4>
        <div id="movement-items">
          {movementItems.map((item, index) => (
            <div key={index} className="grid grid-cols-10 gap-2 mb-2 items-center">
              <Popover open={openComboboxIndex === index} onOpenChange={(open) => {
                setOpenComboboxIndex(open ? index : null);
                if (!open) {
                  setSearchQuery('');
                }
              }}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openComboboxIndex === index}
                    className="col-span-6 justify-between"
                  >
                    {item.productId
                      ? products.find(p => p.id === item.productId)?.name || t('selectProduct')
                      : t('selectProduct')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command shouldFilter={false}>
                    <div className="p-1">
                      <Input
                        placeholder={t('searchProductBySku')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <CommandEmpty>{t('noProductFound')}</CommandEmpty>
                    <CommandGroup key={searchQuery}>
                      {filteredProducts.map((product) => (
                        <CommandItem
                          key={product.id}
                          value={product.id.toString()}
                          onSelect={() => {
                            handleItemChange(index, 'productId', product.id);
                            setOpenComboboxIndex(null);
                            setSearchQuery('');
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              item.productId === product.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {product.name} ({product.sku})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <Input
                type="text" // Changed to text
                className="col-span-3 no-spin-buttons"
                value={formatNumberInput(item.quantity)} // Use formatter
                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                min="1"
                inputMode="decimal" // Added
                pattern="^\d*\.?\d*$" // Added
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeMovementItem(index)}
                className="col-span-1 text-red-500 hover:text-red-700"
              >
                &times;
              </Button>
            </div>
          ))}
        </div>
        <Button type="button" onClick={addMovementItem} variant="outline" className="mt-2">
          {t('addItem')}
        </Button>
      </div>
      <div className="flex justify-end mt-6 border-t pt-4 dark:border-slate-700">
        <Button type="submit">{t('saveMovement')}</Button>
      </div>
    </form>
  );
};

export default ProductMovementForm;