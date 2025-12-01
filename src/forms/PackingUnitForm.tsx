"use client";

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { t } from '@/utils/i18n';
import { PackingUnit } from '@/types';

interface PackingUnitFormProps {
  packingUnit?: PackingUnit;
  onSuccess: (packingUnit: PackingUnit) => void;
  onCancel: () => void;
}

const PackingUnitForm: React.FC<PackingUnitFormProps> = ({ packingUnit, onSuccess, onCancel }) => {
  const [name, setName] = useState(packingUnit?.name || '');
  const [baseUnit, setBaseUnit] = useState<string>(packingUnit?.baseUnit || 'piece');
  const [conversionFactor, setConversionFactor] = useState(String(packingUnit?.conversionFactor || 1));

  useEffect(() => {
    setName(packingUnit?.name || '');
    setBaseUnit(packingUnit?.baseUnit || 'piece');
    setConversionFactor(String(packingUnit?.conversionFactor || 1));
  }, [packingUnit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert(t('packingUnitNameRequired'));
      return;
    }
    if (!baseUnit) {
      alert(t('baseUnitRequired'));
      return;
    }
    const factor = parseFloat(conversionFactor);
    if (isNaN(factor) || factor <= 0) {
      alert(t('conversionFactorPositive'));
      return;
    }
    if (name.toLowerCase() === 'piece' && (baseUnit !== 'piece' || factor !== 1)) {
      alert(t('pieceConversionFactor'));
      return;
    }

    onSuccess({
      id: packingUnit?.id || 0, // ID will be handled by parent logic for new items
      name: name.trim(),
      baseUnit,
      conversionFactor: factor,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">
            {t('packingUnitName')}
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="col-span-3"
            required
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="baseUnit" className="text-right">
            {t('baseUnit')}
          </Label>
          <Select onValueChange={(value: string) => setBaseUnit(value)} value={baseUnit}>
            <SelectTrigger id="baseUnit" className="col-span-3">
              <SelectValue placeholder={t('selectBaseUnit')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="piece">{t('piece')}</SelectItem>
              <SelectItem value="ml">{t('ml')}</SelectItem>
              <SelectItem value="liter">{t('liter')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="conversionFactor" className="text-right">
            {t('conversionFactor')}
          </Label>
          <Input
            id="conversionFactor"
            type="number"
            step="0.01"
            value={conversionFactor}
            onChange={(e) => setConversionFactor(e.target.value)}
            className="col-span-3"
            min="0.01"
            required
            disabled={name.toLowerCase() === 'piece'} // Disable for "Piece"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('cancel')}
        </Button>
        <Button type="submit">{t('savePackingUnit')}</Button>
      </div>
    </form>
  );
};

export default PackingUnitForm;