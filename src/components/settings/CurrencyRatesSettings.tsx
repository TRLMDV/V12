"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CurrencyRates, Currency } from '@/types';

interface CurrencyRatesSettingsProps {
  currencyRates: CurrencyRates;
  setCurrencyRates: React.Dispatch<React.SetStateAction<CurrencyRates>>;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
  activeCurrencies: Currency[];
}

const CurrencyRatesSettings: React.FC<CurrencyRatesSettingsProps> = ({
  currencyRates,
  setCurrencyRates,
  t,
  activeCurrencies,
}) => {
  const [rates, setRates] = useState<CurrencyRates>(currencyRates);

  useEffect(() => {
    setRates(currencyRates);
  }, [currencyRates]);

  const handleSaveCurrencyRates = () => {
    const currenciesToValidate = Array.from(new Set([...activeCurrencies, 'AZN']));
    const invalidRates = currenciesToValidate.filter(c => c !== 'AZN' && (isNaN(rates[c]) || rates[c] <= 0));
    if (invalidRates.length > 0) {
      toast.error(t('invalidRates'), { description: `Please enter valid positive numbers for: ${invalidRates.join(', ')}` });
      return;
    }
    
    const newRates: Partial<CurrencyRates> = { AZN: 1.00 };
    activeCurrencies.forEach(c => {
      if (c !== 'AZN') {
        newRates[c] = rates[c] || 0;
      }
    });

    setCurrencyRates(prev => ({ ...prev, ...newRates }));
    toast.success(t('success'), { description: t('ratesUpdated') });
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4">{t('currencyRatesSettings')}</h2>
      <p className="text-gray-600 dark:text-slate-400 mb-4">{t('currencyRatesDescription')}</p>
      <div className="grid gap-4 py-4">
        {activeCurrencies.filter(c => c !== 'AZN').map(c => (
          <div key={c} className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor={`${c}-to-azn`} className="text-right">{c} {t('toAzn')}</Label>
            <Input
              id={`${c}-to-azn`}
              type="number"
              step="0.0001"
              value={rates[c]}
              onChange={(e) => setRates(prev => ({ ...prev, [c]: parseFloat(e.target.value) || 0 }))}
              className="col-span-3"
              min="0.0001"
            />
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSaveCurrencyRates}>{t('saveCurrencyRates')}</Button>
      </div>
    </div>
  );
};

export default CurrencyRatesSettings;