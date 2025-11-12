"use client";

import React from 'react';
import { useData } from '@/context/DataContext';
import { useTranslation } from '@/hooks/useTranslation'; // Updated import
import { Currency } from '@/types';

// Import new modular components
import CompanyDetailsSettings from '@/components/settings/CompanyDetailsSettings';
import ThemeSettings from '@/components/settings/ThemeSettings';
import DefaultVatSettings from '@/components/settings/DefaultVatSettings';
import DefaultMarkupSettings from '@/components/settings/DefaultMarkupSettings';
import MainCurrencySettings from '@/components/settings/MainCurrencySettings';
import ActiveCurrenciesSettings from '@/components/settings/ActiveCurrenciesSettings';
import CurrencyRatesSettings from '@/components/settings/CurrencyRatesSettings';
import PaymentCategoriesSettings from '@/components/settings/PaymentCategoriesSettings';
import EraseAllDataSection from '@/components/settings/EraseAllDataSection';
import DashboardCurrencyRatesToggle from '@/components/settings/DashboardCurrencyRatesToggle';
import PackingSettings from '@/components/settings/PackingSettings';
import LanguageSettings from '@/components/settings/LanguageSettings'; // New import

// Define ALL_CURRENCIES here as it's a global constant for currency selection
const ALL_CURRENCIES: Currency[] = [
  'AZN', 'USD', 'EUR', 'RUB', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'CNY', 'KWD', 'BHD', 'OMR', 'JOD', 'GIP', 'KYD', 'KRW', 'SGD', 'INR', 'MXN', 'SEK', 'THB', 'AFN', 'ALL', 'DZD', 'AOA', 'XCD', 'ARS', 'AMD', 'AWG', 'SHP', 'BSD', 'BDT', 'BBD', 'BYN', 'BZD', 'XOF', 'BMD', 'BTN', 'BOB', 'BAM', 'BWP', 'BRL', 'BND', 'BGN', 'BIF', 'KHR', 'XAF', 'CVE', 'CDF', 'KMF', 'NZD', 'CRC', 'CUP', 'XCG', 'CZK', 'DKK', 'DJF', 'DOP', 'EGP', 'ERN', 'SZL', 'ZAR', 'ETB', 'FKP', 'FJD', 'XPF', 'GMD', 'GEL', 'GHS', 'GTQ', 'GNF', 'GYD', 'HTG', 'HNL', 'HKD', 'HUF', 'ISK', 'IDR', 'IRR', 'IQD', 'ILS', 'JMD', 'KZT', 'KES', 'KPW', 'KGS', 'LAK', 'LBP', 'LSL', 'LRD', 'LYD', 'MDL', 'MOP', 'MGA', 'MWK', 'MYR', 'MVR', 'MRU', 'MZN', 'MMK', 'NAD', 'NPR', 'NIO', 'NGN', 'NOK', 'PKR', 'PGK', 'PYG', 'PEN', 'PHP', 'PLN', 'QAR', 'RON', 'RSD', 'SCR', 'SLE', 'SBD', 'SOS', 'SSP', 'STN', 'SRD', 'SYP', 'TWD', 'TJS', 'TZS', 'TTD', 'TND', 'TRY', 'TMT', 'UGX', 'UAH', 'AED', 'UYU', 'UZS', 'VUV', 'VES', 'VED', 'VND', 'YER', 'ZMW', 'ZWG'
];

const SettingsPage: React.FC = () => {
  const {
    settings,
    setSettings,
    currencyRates,
    setCurrencyRates,
    showConfirmationModal,
    getNextId,
    setNextIdForCollection,
  } = useData();
  const { t } = useTranslation(); // Use the new hook

  // Local state for activeCurrencies, passed to MainCurrencySettings and ActiveCurrenciesSettings
  // This allows these components to manage their own activeCurrencies state before saving to global settings
  const [activeCurrencies, setActiveCurrencies] = React.useState<Currency[]>(settings.activeCurrencies);

  // Update local activeCurrencies state when global settings.activeCurrencies changes
  React.useEffect(() => {
    setActiveCurrencies(settings.activeCurrencies);
  }, [settings.activeCurrencies]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-200 mb-6">{t('settings')}</h1>

      <CompanyDetailsSettings
        settings={settings}
        setSettings={setSettings}
        t={t}
      />

      <ThemeSettings
        settings={settings}
        setSettings={setSettings}
        t={t}
      />

      {/* Removed DisplayScalingSettings */}

      <DefaultVatSettings
        settings={settings}
        setSettings={setSettings}
        t={t}
      />

      <DefaultMarkupSettings
        settings={settings}
        setSettings={setSettings}
        t={t}
      />

      <MainCurrencySettings
        settings={settings}
        setSettings={setSettings}
        t={t}
        ALL_CURRENCIES={ALL_CURRENCIES}
        activeCurrencies={activeCurrencies}
        setActiveCurrencies={setActiveCurrencies}
      />

      <ActiveCurrenciesSettings
        settings={settings}
        setSettings={setSettings}
        t={t}
        ALL_CURRENCIES={ALL_CURRENCIES}
        mainCurrency={settings.mainCurrency}
      />

      <CurrencyRatesSettings
        currencyRates={currencyRates}
        setCurrencyRates={setCurrencyRates}
        t={t}
        activeCurrencies={settings.activeCurrencies} // Use global activeCurrencies for rates display
        mainCurrency={settings.mainCurrency} // Pass mainCurrency
      />

      <PaymentCategoriesSettings
        settings={settings}
        setSettings={setSettings}
        t={t}
        showConfirmationModal={showConfirmationModal}
        getNextId={(key) => getNextId(key as 'paymentCategories')} // Cast key
        setNextIdForCollection={(key, nextId) => setNextIdForCollection(key as 'paymentCategories', nextId)} // Cast key
      />

      <PackingSettings
        settings={settings}
        setSettings={setSettings}
        t={t}
        showConfirmationModal={showConfirmationModal}
        getNextId={(key) => getNextId(key as 'packingUnits')} // Cast key
        setNextIdForCollection={(key, nextId) => setNextIdForCollection(key as 'packingUnits', nextId)} // Cast key
      />

      <DashboardCurrencyRatesToggle
        settings={settings}
        setSettings={setSettings}
        t={t}
      />

      <LanguageSettings /> {/* New Language Settings component */}

      <EraseAllDataSection
        t={t}
        showConfirmationModal={showConfirmationModal}
      />
    </div>
  );
};

export default SettingsPage;