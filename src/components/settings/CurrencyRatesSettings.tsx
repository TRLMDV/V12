"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { CurrencyRates, Currency } from '@/types';

interface CurrencyRatesSettingsProps {
  currencyRates: CurrencyRates;
  setCurrencyRates: React.Dispatch<React.SetStateAction<CurrencyRates>>;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
  activeCurrencies: Currency[];
  mainCurrency: Currency; // New prop
}

const CurrencyRatesSettings: React.FC<CurrencyRatesSettingsProps> = ({
  currencyRates,
  setCurrencyRates,
  t,
  activeCurrencies,
  mainCurrency, // Destructure new prop
}) => {
  // Internal state for rates, stored as "Foreign to Main Currency" for display/editing
  const [ratesToMain, setRatesToMain] = useState<Partial<CurrencyRates>>({});
  const [isRatesListOpen, setIsRatesListOpen] = useState(false);

  // Helper to convert from AZN-based rates to MainCurrency-based rates for display
  const convertToMainCurrencyRates = useMemo(() => {
    const newRates: Partial<CurrencyRates> = {};
    const mainCurrencyRateToAZN = currencyRates[mainCurrency] || 1; // Rate of 1 MainCurrency to AZN

    activeCurrencies.forEach(c => {
      if (c === mainCurrency) {
        newRates[c] = 1.00; // Main currency to itself is 1
      } else {
        const foreignCurrencyRateToAZN = currencyRates[c] || 1; // Rate of 1 ForeignCurrency to AZN
        // Calculate: (1 ForeignCurrency = X AZN) / (1 MainCurrency = Y AZN) = (1 ForeignCurrency = (X/Y) MainCurrency)
        newRates[c] = foreignCurrencyRateToAZN / mainCurrencyRateToAZN;
      }
    });
    return newRates;
  }, [currencyRates, activeCurrencies, mainCurrency]);

  useEffect(() => {
    setRatesToMain(convertToMainCurrencyRates);
  }, [convertToMainCurrencyRates]);

  const handleSaveCurrencyRates = () => {
    const currenciesToValidate = Array.from(new Set([...activeCurrencies, mainCurrency]));
    const invalidRates = currenciesToValidate.filter(c => c !== mainCurrency && (isNaN(ratesToMain[c] || 0) || (ratesToMain[c] || 0) <= 0));
    if (invalidRates.length > 0) {
      toast.error(t('invalidRates'), { description: `Please enter valid positive numbers for: ${invalidRates.join(', ')}` });
      return;
    }
    
    const updatedGlobalRates: Partial<CurrencyRates> = { ...currencyRates }; // Start with existing global rates
    const mainCurrencyRateToAZN = currencyRates[mainCurrency] || 1; // Get current main currency rate to AZN

    activeCurrencies.forEach(c => {
      if (c === mainCurrency) {
        updatedGlobalRates[c] = mainCurrencyRateToAZN; // Keep main currency's rate to AZN as is
      } else {
        const rateForeignToMain = ratesToMain[c] || 0; // User-entered rate (Foreign to Main)
        // Convert back to Foreign to AZN: (Foreign to Main) * (Main to AZN)
        updatedGlobalRates[c] = rateForeignToMain * mainCurrencyRateToAZN;
      }
    });
    updatedGlobalRates['AZN'] = 1.00; // Ensure AZN is always 1.00

    setCurrencyRates(prev => ({ ...prev, ...updatedGlobalRates }));
    toast.success(t('success'), { description: t('ratesUpdated') });
    setIsRatesListOpen(false); // Collapse the list after saving
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6">
      <button
        type="button"
        onClick={() => setIsRatesListOpen(!isRatesListOpen)}
        className="flex justify-between items-center w-full text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4 focus:outline-none"
      >
        {t('currencyRatesSettings', { mainCurrency })}
        {isRatesListOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      <p className="text-gray-600 dark:text-slate-400 mb-4">{t('currencyRatesDescription', { mainCurrency })}</p>

      {isRatesListOpen && (
        <>
          <div className="grid gap-4 py-4">
            {activeCurrencies.filter(c => c !== mainCurrency).map(c => (
              <div key={c} className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={`${c}-to-main`} className="text-right">{c} {t('toCurrency', { targetCurrency: mainCurrency })}</Label>
                <Input
                  id={`${c}-to-main`}
                  type="number"
                  step="0.0001"
                  value={ratesToMain[c]?.toFixed(4) || '0.0000'}
                  onChange={(e) => setRatesToMain(prev => ({ ...prev, [c]: parseFloat(e.target.value) || 0 }))}
                  className="col-span-3"
                  min="0.0001"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveCurrencyRates}>{t('saveCurrencyRates')}</Button>
          </div>
        </>
      )}
    </div>
  );
};

export default CurrencyRatesSettings;