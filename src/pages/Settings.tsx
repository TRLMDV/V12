"use client";

import React from 'react';
import { useData } from '@/context/DataContext';
import { t } from '@/utils/i18n';
import { Currency } from '@/types';

// Import new modular components
import CompanyDetailsSettings from '@/components/settings/CompanyDetailsSettings';
import ThemeSettings from '@/components/settings/ThemeSettings';
// import DisplayScalingSettings from '@/components/settings/DisplayScalingSettings'; // Removed
import DefaultVatSettings from '@/components/settings/DefaultVatSettings';
import LanguageSettings from '@/components/settings/LanguageSettings';
import DefaultMarkupSettings from '@/components/settings/DefaultMarkupSettings';
import MainCurrencySettings from '@/components/settings/MainCurrencySettings';
import ActiveCurrenciesSettings from '@/components/settings/ActiveCurrenciesSettings';
import CurrencyRatesSettings from '@/components/settings/CurrencyRatesSettings';
import PaymentCategoriesSettings from '@/components/settings/PaymentCategoriesSettings';
import EraseAllDataSection from '@/components/settings/EraseAllDataSection';
import DashboardCurrencyRatesToggle from '@/components/settings/DashboardCurrencyRatesToggle';
import PackingSettings from '@/components/settings/PackingSettings';
import QuickButtonsSettings from '@/components/settings/QuickButtonsSettings';
import SalesChartSettings from '@/components/settings/SalesChartSettings'; // New import
import ClockSettings from '@/components/settings/ClockSettings'; // New import
import CalendarSettings from '@/components/settings/CalendarSettings'; // New import
import ExpeditorSettings from '@/components/settings/ExpeditorSettings';

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

  // Local state for activeCurrencies, passed to MainCurrencySettings and ActiveCurrenciesSettings
  // This allows these components to manage their own activeCurrencies state before saving to global settings
  const [activeCurrencies, setActiveCurrencies] = React.useState<Currency[]>(settings.activeCurrencies);

  // Update local activeCurrencies state when global settings.activeCurrencies changes
  React.useEffect(() => {
    setActiveCurrencies(settings.activeCurrencies);
  }, [settings.activeCurrencies]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-200 mb-6">{t('settings') || 'Settings'}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        <LanguageSettings />
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
        <DashboardCurrencyRatesToggle
          settings={settings}
          setSettings={setSettings}
          t={t}
        />
        <CalendarSettings
          settings={settings}
          setSettings={setSettings}
          t={t}
        />
        <ClockSettings
          settings={settings}
          setSettings={setSettings}
          t={t}
        />
        <PackingSettings
          settings={settings}
          setSettings={setSettings}
          t={t}
          showConfirmationModal={showConfirmationModal}
          getNextId={getNextId}
          setNextIdForCollection={setNextIdForCollection}
        />
        <QuickButtonsSettings
          settings={settings}
          setSettings={setSettings}
          t={t}
          showConfirmationModal={showConfirmationModal}
          getNextId={(key: 'quickButtons') => getNextId('quickButtons')}
          setNextIdForCollection={(key: 'quickButtons', nextId: number) => setNextIdForCollection('quickButtons', nextId)}
        />
        <ExpeditorSettings />
        <CurrencyRatesSettings
          currencyRates={currencyRates}
          setCurrencyRates={setCurrencyRates}
          t={t}
          activeCurrencies={settings.activeCurrencies}
          mainCurrency={settings.mainCurrency}
        />
        <EraseAllDataSection
          t={t}
          showConfirmationModal={showConfirmationModal}
        />
      </div>

      {/* Added footer phrase with Cinzel font and enhanced styling */}
      <div className="mt-8 text-center text-3xl md:text-4xl font-cinzel uppercase tracking-widest text-muted-foreground">
        Oculus qui universa conspicit
      </div>

      {/* Monochrome logo below, tinted to current page text color */}
      <div className="mt-4 flex justify-center">
        <img
          src="/omnia-eye.png"
          alt="Omnia logo"
          className="h-48 md:h-64 w-auto"
          loading="lazy"
        />
      </div>
    </div>
  );
};

export default SettingsPage;