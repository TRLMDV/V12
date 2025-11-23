"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { Settings, Currency } from '@/types';

interface ActiveCurrenciesSettingsProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
  ALL_CURRENCIES: Currency[];
  mainCurrency: Currency;
}

const ActiveCurrenciesSettings: React.FC<ActiveCurrenciesSettingsProps> = ({
  settings,
  setSettings,
  t,
  ALL_CURRENCIES,
  mainCurrency,
}) => {
  const [activeCurrencies, setActiveCurrencies] = useState<Currency[]>(settings.activeCurrencies);
  const [isCurrenciesListOpen, setIsCurrenciesListOpen] = useState(false);

  useEffect(() => {
    setActiveCurrencies(settings.activeCurrencies);
  }, [settings.activeCurrencies]);

  const handleToggleActiveCurrency = (currency: Currency, isChecked: boolean) => {
    if (currency === mainCurrency) {
      toast.info(t('mainCurrencyCannotBeDeactivated'));
      return;
    }
    setActiveCurrencies(prev => {
      if (isChecked) {
        return Array.from(new Set([...prev, currency])).sort();
      } else {
        return prev.filter(c => c !== currency);
      }
    });
  };

  const handleSelectAll = () => {
    const allButMain = ALL_CURRENCIES.filter(c => c !== mainCurrency);
    setActiveCurrencies(Array.from(new Set([...allButMain, mainCurrency])).sort());
    toast.info(t('allCurrenciesSelected'));
  };

  const handleDeselectAll = () => {
    setActiveCurrencies([mainCurrency]);
    toast.info(t('allCurrenciesDeselected'));
  };

  const handleSaveActiveCurrencies = () => {
    setSettings(prev => ({ ...prev, activeCurrencies }));
    toast.success(t('success'), { description: t('activeCurrenciesUpdated') });
    setIsCurrenciesListOpen(false); // Collapse the list after saving
  };

  // Sort ALL_CURRENCIES alphabetically for display
  const sortedAllCurrencies = [...ALL_CURRENCIES].sort((a, b) => a.localeCompare(b));

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6">
      <button
        type="button"
        onClick={() => setIsCurrenciesListOpen(!isCurrenciesListOpen)}
        className="flex justify-between items-center w-full text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4 focus:outline-none"
      >
        {t('activeCurrenciesSelection')}
        {isCurrenciesListOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      <p className="text-gray-600 dark:text-slate-400 mb-4">{t('activeCurrenciesDescription')}</p>

      {isCurrenciesListOpen && (
        <>
          <div className="flex justify-end gap-2 mb-4">
            <Button variant="outline" onClick={handleSelectAll} size="sm">
              {t('selectAll')}
            </Button>
            <Button variant="outline" onClick={handleDeselectAll} size="sm">
              {t('deselectAll')}
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-4">
            {sortedAllCurrencies.map(c => (
              <div key={c} className="flex items-center space-x-2">
                <Checkbox
                  id={`currency-${c}`}
                  checked={activeCurrencies.includes(c)}
                  onCheckedChange={(checked) => handleToggleActiveCurrency(c, checked as boolean)}
                  disabled={c === mainCurrency}
                />
                <Label htmlFor={`currency-${c}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {c} {c === mainCurrency && `(${t('mainCurrency')})`}
                </Label>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveActiveCurrencies}>{t('saveActiveCurrencies')}</Button>
          </div>
        </>
      )}
    </div>
  );
};

export default ActiveCurrenciesSettings;