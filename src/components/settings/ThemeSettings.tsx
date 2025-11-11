"use client";

import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings } from '@/types';

interface ThemeSettingsProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

const ThemeSettings: React.FC<ThemeSettingsProps> = ({ settings, setSettings, t }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(settings.theme);

  useEffect(() => {
    setTheme(settings.theme);
  }, [settings.theme]);

  const handleThemeChange = (value: 'light' | 'dark') => {
    setTheme(value);
    setSettings(prev => ({ ...prev, theme: value }));
    // The MainLayout useEffect will handle applying the class to document.documentElement
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4">{t('theme')}</h2>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="theme-select" className="text-right">{t('theme')}</Label>
        <Select onValueChange={handleThemeChange} value={theme}>
          <SelectTrigger id="theme-select" className="col-span-3">
            <SelectValue placeholder={t('light')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">{t('light')}</SelectItem>
            <SelectItem value="dark">{t('dark')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ThemeSettings;