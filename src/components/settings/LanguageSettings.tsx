"use client";

import React from 'react';
import { useData } from '@/context/DataContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { t, setLanguage as i18nSetLanguage } from '@/utils/i18n';

type AppLanguage = 'en' | 'ru';

const LanguageSettings: React.FC = () => {
  const { settings, setSettings } = useData();

  const currentLanguage: AppLanguage = (settings as any).language || 'en';

  const handleLanguageChange = (value: AppLanguage) => {
    // Update settings
    setSettings(prev => ({ ...prev, language: value }));
    // Update i18n module language
    i18nSetLanguage(value);
  };

  return (
    <Card className="dark:bg-slate-800 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="text-gray-800 dark:text-slate-200">{t('language')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          <Label htmlFor="app-language" className="text-sm text-gray-700 dark:text-slate-300">{t('language')}</Label>
          <Select value={currentLanguage} onValueChange={(v: string) => handleLanguageChange(v as AppLanguage)}>
            <SelectTrigger id="app-language" className="w-[260px]">
              <SelectValue placeholder={t('language')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ru">Русский</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default LanguageSettings;