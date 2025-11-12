"use client";

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { t } from '@/utils/i18n';
import { PaymentCategorySetting } from '@/types';

interface PaymentCategoryFormProps {
  category?: PaymentCategorySetting;
  onSuccess: (category: PaymentCategorySetting) => void;
  onCancel: () => void;
}

const PaymentCategoryForm: React.FC<PaymentCategoryFormProps> = ({ category, onSuccess, onCancel }) => {
  const [categoryName, setCategoryName] = useState(category?.name || '');

  useEffect(() => {
    setCategoryName(category?.name || '');
  }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      alert(t('categoryNameRequired'));
      return;
    }
    onSuccess({
      id: category?.id || 0, // ID will be handled by parent logic for new items
      name: categoryName.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="categoryName" className="text-right">
            {t('categoryName')}
          </Label>
          <Input
            id="categoryName"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className="col-span-3"
            required
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('cancel')}
        </Button>
        <Button type="submit">{t('saveCategory')}</Button>
      </div>
    </form>
  );
};

export default PaymentCategoryForm;