"use client";

import { useCallback } from 'react';
import { Currency, CurrencyRates } from '@/types';

interface UseCurrencyConverterProps {
  currencyRates: CurrencyRates;
}

export function useCurrencyConverter({ currencyRates }: UseCurrencyConverterProps) {
  const convertCurrency = useCallback((amount: number, fromCurrency: Currency, toCurrency: Currency): number => {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rateFromAZN = currencyRates[fromCurrency];
    const rateToAZN = currencyRates[toCurrency];

    if (!rateFromAZN || !rateToAZN) {
      console.warn(`Missing currency rate for conversion: ${fromCurrency} or ${toCurrency}`);
      return amount; // Return original amount if rates are missing
    }

    // Convert to AZN first, then to target currency
    const amountInAZN = amount * rateFromAZN;
    return amountInAZN / rateToAZN;
  }, [currencyRates]);

  return {
    convertCurrency,
  };
}