"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Settings, Currency } from '@/types';

interface MainCurrencySettingsProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
  ALL_CURRENCIES: Currency[];
  activeCurrencies: Currency[];
  setActiveCurrencies: React.Dispatch<React.SetStateAction<Currency[]>>;
}

const MainCurrencySettings: React.FC<MainCurrencySettingsProps> = ({
  settings,
  setSettings,
  t,
  ALL_CURRENCIES,
  activeCurrencies,
  setActiveCurrencies,
}) => {
  const [mainCurrency, setMainCurrency] = useState<Currency>(settings.mainCurrency);

  useEffect(() => {
    setMainCurrency(settings.mainCurrency);
  }, [settings.mainCurrency]);

  const handleSaveMainCurrency = () => {
    // Ensure main currency is always in activeCurrencies
    const updatedActiveCurrencies = Array.from(new Set([...activeCurrencies, mainCurrency]));
    setSettings(prev => ({ ...prev, mainCurrency, activeCurrencies: updatedActiveCurrencies }));
    setActiveCurrencies(updatedActiveCurrencies); // Update local state immediately
    toast.success(t('success'), { description: t('mainCurrencyUpdated') });
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4">{t('mainCurrencySettings')}</h2>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="mainCurrency-select" className="text-right">{t('mainCurrency')}</Label>
        <Select onValueChange={(value: Currency) => setMainCurrency(value)} value={mainCurrency}>
          <SelectTrigger id="mainCurrency-select" className="col-span-3">
            <SelectValue placeholder="AZN" />
          </SelectTrigger>
          <SelectContent>
            {ALL_CURRENCIES.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end mt-4">
        <Button onClick={handleSaveMainCurrency}>{t('saveMainCurrency')}</Button>
      </div>
    </div>
  );
};

export default MainCurrencySettings;