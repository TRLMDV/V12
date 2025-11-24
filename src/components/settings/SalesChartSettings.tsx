"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings } from '@/types';
import { t } from '@/utils/i18n';

interface SalesChartSettingsProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

const SalesChartSettings: React.FC<SalesChartSettingsProps> = ({ settings, setSettings, t }) => {
  const handleToggle = (checked: boolean) => {
    setSettings(prev => ({ ...prev, showSalesChartOnDashboard: checked }));
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4">{t('salesChart')}</h2>
      <div className="flex items-center justify-between">
        <Label htmlFor="show-sales-chart-on-dashboard" className="text-sm font-medium text-gray-700 dark:text-slate-300">
          {t('showSalesChartOnDashboard')}
        </Label>
        <Switch
          id="show-sales-chart-on-dashboard"
          checked={settings.showSalesChartOnDashboard}
          onCheckedChange={handleToggle}
        />
      </div>
    </div>
  );
};

export default SalesChartSettings;