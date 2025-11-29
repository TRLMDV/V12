"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings } from '@/types';
import { t } from '@/utils/i18n';

interface ClockSettingsProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

const ClockSettings: React.FC<ClockSettingsProps> = ({ settings, setSettings, t }) => {
  const handleToggle = (checked: boolean) => {
    setSettings(prev => ({ ...prev, showClockOnDashboard: checked }));
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4">{t('clockSettings')}</h2>
      <div className="flex items-center justify-between">
        <Label htmlFor="show-clock-on-dashboard" className="text-sm font-medium text-gray-700 dark:text-slate-300">
          {t('showClockOnDashboard')}
        </Label>
        <Switch
          id="show-clock-on-dashboard"
          checked={settings.showClockOnDashboard}
          onCheckedChange={handleToggle}
        />
      </div>
    </div>
  );
};

export default ClockSettings;