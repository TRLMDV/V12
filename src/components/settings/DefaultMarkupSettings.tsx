"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Settings } from '@/types';

interface DefaultMarkupSettingsProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

const DefaultMarkupSettings: React.FC<DefaultMarkupSettingsProps> = ({ settings, setSettings, t }) => {
  const [defaultMarkup, setDefaultMarkup] = useState(settings.defaultMarkup);

  useEffect(() => {
    setDefaultMarkup(settings.defaultMarkup);
  }, [settings.defaultMarkup]);

  const handleSaveDefaultMarkup = () => {
    if (isNaN(defaultMarkup) || defaultMarkup < 0) {
      toast.error('Validation Error', { description: 'Markup percentage cannot be negative.' });
      return;
    }
    setSettings(prev => ({ ...prev, defaultMarkup }));
    toast.success(t('success'), { description: t('markupUpdated') });
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4">{t('defaultMarkup')}</h2>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="defaultMarkup" className="text-right">{t('defaultMarkup')}</Label>
        <Input
          id="defaultMarkup"
          type="number"
          step="0.01"
          value={defaultMarkup}
          onChange={(e) => setDefaultMarkup(parseFloat(e.target.value) || 0)}
          className="col-span-3"
          min="0"
        />
      </div>
      <div className="flex justify-end mt-4">
        <Button onClick={handleSaveDefaultMarkup}>{t('saveDefaultMarkup')}</Button>
      </div>
    </div>
  );
};

export default DefaultMarkupSettings;