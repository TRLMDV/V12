"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings } from '@/types';
import { t } from '@/utils/i18n';

interface CalendarSettingsProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

const CalendarSettings: React.FC<CalendarSettingsProps> = ({ settings, setSettings, t }) => {
  const handleToggle = (checked: boolean) => {
    setSettings(prev => ({ ...prev, showCalendarOnDashboard: checked }));
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4">{t('calendarSettings')}</h2>
      <div className="flex items-center justify-between">
        <Label htmlFor="show-calendar-on-dashboard" className="text-sm font-medium text-gray-700 dark:text-slate-300">
          {t('showCalendarOnDashboard')}
        </Label>
        <Switch
          id="show-calendar-on-dashboard"
          checked={settings.showCalendarOnDashboard}
          onCheckedChange={handleToggle}
        />
      </div>
    </div>
  );
};

export default CalendarSettings;