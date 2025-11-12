"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings } from '@/types';

interface DashboardCurrencyRatesToggleProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

const DashboardCurrencyRatesToggle: React.FC<DashboardCurrencyRatesToggleProps> = ({ settings, setSettings, t }) => {
  const handleToggle = (checked: boolean) => {
    setSettings(prev => ({ ...prev, showDashboardCurrencyRates: checked }));
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4">{t('dashboardCurrencyRates')}</h2>
      <div className="flex items-center justify-between">
        <Label htmlFor="show-dashboard-currency-rates" className="text-sm font-medium text-gray-700 dark:text-slate-300">
          {t('showCurrencyRatesOnDashboard')}
        </Label>
        <Switch
          id="show-dashboard-currency-rates"
          checked={settings.showDashboardCurrencyRates}
          onCheckedChange={handleToggle}
        />
      </div>
    </div>
  );
};

export default DashboardCurrencyRatesToggle;