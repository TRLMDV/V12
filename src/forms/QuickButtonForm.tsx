"use client";

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { t } from '@/utils/i18n';
import { QuickButton, QuickButtonAction, QuickButtonSize, QuickButtonColor } from '@/types';

interface QuickButtonFormProps {
  button?: QuickButton;
  onSuccess: (button: QuickButton) => void;
  onCancel: () => void;
}

const QuickButtonForm: React.FC<QuickButtonFormProps> = ({ button, onSuccess, onCancel }) => {
  const [label, setLabel] = useState(button?.label || '');
  const [action, setAction] = useState<QuickButtonAction>(button?.action || 'addPurchaseOrder');
  const [size, setSize] = useState<QuickButtonSize>(button?.size || 'md');
  const [color, setColor] = useState<QuickButtonColor>(button?.color || 'bg-blue-500 hover:bg-blue-600');

  useEffect(() => {
    setLabel(button?.label || '');
    setAction(button?.action || 'addPurchaseOrder');
    setSize(button?.size || 'md');
    setColor(button?.color || 'bg-blue-500 hover:bg-blue-600');
  }, [button]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      alert(t('buttonLabelRequired'));
      return;
    }
    onSuccess({
      id: button?.id || 0, // ID will be handled by parent logic for new items
      label: label.trim(),
      action,
      size,
      color,
    });
  };

  const availableActions: { value: QuickButtonAction; label: string }[] = [
    { value: 'addPurchaseOrder', label: t('quickPurchaseOrderAdd') },
    { value: 'addSellOrder', label: t('quickSellOrderAdd') },
    { value: 'addProductMovement', label: t('quickProductMovement') },
    { value: 'addProduct', label: t('quickProductAdd') },
    { value: 'addSupplier', label: t('quickSupplierAdd') },
    { value: 'addCustomer', label: t('quickCustomerAdd') },
    { value: 'addIncomingPayment', label: t('quickIncomingPaymentsAdd') },
    { value: 'addOutgoingPayment', label: t('quickOutgoingPaymentsAdd') },
    { value: 'addWarehouse', label: t('quickWarehouseAdd') },
    { value: 'addUtilizationOrder', label: t('quickUtilization') },
    { value: 'bankDeposit', label: t('quickBankDeposit') },
    { value: 'bankWithdrawal', label: t('quickBankWithdrawal') },
  ];

  const availableSizes: { value: QuickButtonSize; label: string }[] = [
    { value: 'sm', label: t('sizeSm') },
    { value: 'md', label: t('sizeMd') },
    { value: 'lg', label: t('sizeLg') },
  ];

  const availableColors: { value: QuickButtonColor; label: string }[] = [
    { value: 'bg-blue-500 hover:bg-blue-600', label: t('colorBlue') },
    { value: 'bg-green-500 hover:bg-green-600', label: t('colorGreen') },
    { value: 'bg-red-500 hover:bg-red-600', label: t('colorRed') },
    { value: 'bg-purple-500 hover:bg-purple-600', label: t('colorPurple') },
    { value: 'bg-orange-500 hover:bg-orange-600', label: t('colorOrange') },
    { value: 'bg-yellow-500 hover:bg-yellow-600', label: t('colorYellow') },
    { value: 'bg-emerald-500 hover:bg-emerald-600', label: t('colorEmerald') },
    { value: 'bg-indigo-500 hover:bg-indigo-600', label: t('colorIndigo') },
    { value: 'bg-pink-500 hover:bg-pink-600', label: t('colorPink') },
    { value: 'bg-teal-500 hover:bg-teal-600', label: t('colorTeal') },
  ];

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="buttonLabel" className="text-right">
            {t('buttonLabel')}
          </Label>
          <Input
            id="buttonLabel"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="col-span-3"
            required
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="buttonAction" className="text-right">
            {t('buttonAction')}
          </Label>
          <Select onValueChange={(value: QuickButtonAction) => setAction(value)} value={action}>
            <SelectTrigger id="buttonAction" className="col-span-3">
              <SelectValue placeholder={t('selectButtonAction')} />
            </SelectTrigger>
            <SelectContent>
              {availableActions.map(act => (
                <SelectItem key={act.value} value={act.value}>
                  {act.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="buttonSize" className="text-right">
            {t('buttonSize')}
          </Label>
          <Select onValueChange={(value: QuickButtonSize) => setSize(value)} value={size}>
            <SelectTrigger id="buttonSize" className="col-span-3">
              <SelectValue placeholder={t('selectButtonSize')} />
            </SelectTrigger>
            <SelectContent>
              {availableSizes.map(s => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="buttonColor" className="text-right">
            {t('buttonColor')}
          </Label>
          <Select onValueChange={(value: QuickButtonColor) => setColor(value)} value={color}>
            <SelectTrigger id="buttonColor" className="col-span-3">
              <SelectValue placeholder={t('selectButtonColor')} />
            </SelectTrigger>
            <SelectContent>
              {availableColors.map(c => (
                <SelectItem key={c.value} value={c.value}>
                  <div className="flex items-center">
                    <span className={`w-4 h-4 rounded-full mr-2 ${c.value.split(' ')[0]}`}></span>
                    {c.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('cancel')}
        </Button>
        <Button type="submit">{t('saveQuickButton')}</Button>
      </div>
    </form>
  );
};

export default QuickButtonForm;