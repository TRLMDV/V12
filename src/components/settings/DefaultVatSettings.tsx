"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Settings } from '@/types';

interface DefaultVatSettingsProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

const DefaultVatSettings: React.FC<DefaultVatSettingsProps> = ({ settings, setSettings, t }) => {
  const [defaultVat, setDefaultVat] = useState(settings.defaultVat);

  useEffect(() => {
    setDefaultVat(settings.defaultVat);
  }, [settings.defaultVat]);

  const handleSaveDefaultVat = () => {
    if (isNaN(defaultVat) || defaultVat < 0 || defaultVat > 100) {
      toast.error('Validation Error', { description: 'VAT percentage must be between 0 and 100.' });
      return;
    }
    setSettings(prev => ({ ...prev, defaultVat }));
    toast.success(t('success'), { description: t('vatUpdated') });
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4">{t('defaultVat')}</h2>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="defaultVat" className="text-right">{t('defaultVat')}</Label>
        <Input
          id="defaultVat"
          type="number"
          step="0.01"
          value={defaultVat}
          onChange={(e) => setDefaultVat(parseFloat(e.target.value) || 0)}
          className="col-span-3"
          min="0"
          max="100"
        />
      </div>
      <div className="flex justify-end mt-4">
        <Button onClick={handleSaveDefaultVat}>{t('saveDefaultVat')}</Button>
      </div>
    </div>
  );
};

export default DefaultVatSettings;