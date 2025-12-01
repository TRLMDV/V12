"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useData } from '@/context/DataContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/utils/i18n';
import { UtilizationOrder, Product, Warehouse } from '@/types';
import { Textarea } from '@/components/ui/textarea'; // Import Textarea
import { format, parseISO } from 'date-fns'; // Import format and parseISO

interface UtilizationFormProps {
  orderId?: number;
  onSuccess: () => void;
}

interface UtilizationItemState {
  productId: number | '';
  quantity: number;
}

const UtilizationForm: React.FC<UtilizationFormProps> = ({ orderId, onSuccess }) => {
  const { utilizationOrders, products, warehouses, saveItem, showAlertModal } = useData();
  const isEdit = orderId !== undefined;

  const [date, setDate] = useState(() => {
    if (isEdit && orderId !== undefined) {
      const existingOrder = utilizationOrders.find(o => o.id === orderId);
      if (existingOrder) return format(parseISO(existingOrder.date), 'yyyy-MM-dd');
    }
    return format(new Date(), 'yyyy-MM-dd');
  });
  const [warehouseId, setWarehouseId] = useState<number | ''>('');
  const [utilizationItems, setUtilizationItems] = useState<UtilizationItemState[]>([{ productId: '', quantity: 1 }]);
  const [comment, setComment] = useState(''); // New state for comment
  const [openComboboxIndex, setOpenComboboxIndex] = useState<number | null>(null);

  // New states for hour and minute
  const [selectedHour, setSelectedHour] = useState<string>(() => {
    if (isEdit && orderId !== undefined) {
      const existingOrder = utilizationOrders.find(o => o.id === orderId);
      if (existingOrder && existingOrder.date) {
        return String(new Date(existingOrder.date).getHours()).padStart(2, '0');
      }
    }
    return String(new Date().getHours()).padStart(2, '0');
  });
  const [selectedMinute, setSelectedMinute] = useState<string>(() => {
    if (isEdit && orderId !== undefined) {
      const existingOrder = utilizationOrders.find(o => o.id === orderId);
      if (existingOrder && existingOrder.date) {
        return String(new Date(existingOrder.date).getMinutes()).padStart(2, '0');
      }
    }
    return String(new Date().getMinutes()).padStart(2, '0');
  });

  useEffect(() => {
    if (isEdit) {
      const existingOrder = utilizationOrders.find(o => o.id === orderId);
      if (existingOrder) {
        setDate(format(parseISO(existingOrder.date), 'yyyy-MM-dd'));
        setWarehouseId(existingOrder.warehouseId);
        setUtilizationItems(existingOrder.items.map(item => ({ productId: item.productId, quantity: item.quantity })));
        setComment(existingOrder.comment || ''); // Load existing comment
        setSelectedHour(String(new Date(existingOrder.date).getHours()).padStart(2, '0'));
        setSelectedMinute(String(new Date(existingOrder.date).getMinutes()).padStart(2, '0'));
      }
    } else {
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setWarehouseId('');
      setUtilizationItems([{ productId: '', quantity: 1 }]);
      setComment(''); // Reset comment for new order
      setSelectedHour(String(new Date().getHours()).padStart(2, '0'));
      setSelectedMinute(String(new Date().getMinutes()).padStart(2, '0'));
    }
  }, [orderId, isEdit, utilizationOrders]);

  const addUtilizationItem = useCallback(() => {
    setUtilizationItems(prev => [...prev, { productId: '', quantity: 1 }]);
  }, []);

  const removeUtilizationItem = useCallback((index: number) => {
    setUtilizationItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleItemChange = useCallback((index: number, field: keyof UtilizationItemState, value: any) => {
    setUtilizationItems(prev =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (warehouseId === '') {
      showAlertModal('Validation Error', 'Please select a warehouse.');
      return;
    }

    const newItems = utilizationItems.filter(item => item.productId !== '' && item.quantity > 0);
    if (newItems.length === 0) {
      showAlertModal('Validation Error', 'Please ensure all items have a selected product and a quantity greater than zero.');
      return;
    }

    // Combine date and time into a single ISO string
    const utilizationDateTime = `${date}T${selectedHour}:${selectedMinute}:00.000Z`;

    const orderToSave: UtilizationOrder = {
      id: orderId || 0,
      date: utilizationDateTime, // Use the combined date and time
      warehouseId: warehouseId as number,
      items: newItems.map(item => ({ productId: item.productId as number, quantity: item.quantity })),
      comment: comment.trim() || undefined, // Save comment, or undefined if empty
    };

    saveItem('utilizationOrders', orderToSave);
    onSuccess();
  };

  const hoursArray = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutesArray = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

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
          <Label htmlFor="warehouseId" className="text-right">
            {t('fromWarehouse')}
          </Label>
          <Select onValueChange={(value) => setWarehouseId(parseInt(value))} value={String(warehouseId)}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder={t('selectWarehouse')} />
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

        <h4 className="font-semibold mt-4 mb-2 text-gray-700 dark:text-slate-200">{t('items')}</h4>
        <div id="utilization-items">
          {utilizationItems.map((item, index) => {
            const product = products.find(p => p.id === item.productId);
            const stockInWarehouse = product?.stock?.[warehouseId as number] || 0;

            return (
              <div key={index} className="grid grid-cols-10 gap-2 mb-2 items-center">
                <Popover open={openComboboxIndex === index} onOpenChange={(open) => setOpenComboboxIndex(open ? index : null)}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openComboboxIndex === index}
                      className="col-span-6 justify-between"
                    >
                      {item.productId
                        ? product?.name || t('selectProduct')
                        : t('selectProduct')}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput placeholder={t('searchProductBySku')} />
                      <CommandEmpty>{t('noProductFound')}</CommandEmpty>
                      <CommandGroup>
                        {products.map((p) => (
                          <CommandItem
                            key={p.id}
                            value={`${p.name} ${p.sku}`}
                            onSelect={() => {
                              handleItemChange(index, 'productId', p.id);
                              setOpenComboboxIndex(null);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                item.productId === p.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {p.name} ({p.sku})
                            {warehouseId !== '' && p.stock && p.stock[warehouseId as number] !== undefined && (
                              <span className="ml-2 text-xs text-gray-500 dark:text-slate-400">
                                ({t('stockAvailable')}: {p.stock[warehouseId as number]} {t('piece')})
                              </span>
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                  className="col-span-3"
                  min="1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeUtilizationItem(index)}
                  className="col-span-1 text-red-500 hover:text-red-700"
                >
                  &times;
                </Button>
              </div>
            );
          })}
        </div>
        <Button type="button" onClick={addUtilizationItem} variant="outline" className="mt-2">
          {t('addItem')}
        </Button>

        <div className="grid grid-cols-4 items-start gap-4 mt-4">
          <Label htmlFor="comment" className="text-right">
            {t('comment')}
          </Label>
          <Textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="col-span-3"
            placeholder={t('utilizationCommentPlaceholder')}
          />
        </div>
      </div>
      <div className="flex justify-end mt-6 border-t pt-4 dark:border-slate-700">
        <Button type="submit">{t('saveUtilizationOrder')}</Button>
      </div>
    </form>
  );
};

export default UtilizationForm;