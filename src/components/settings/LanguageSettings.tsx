"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useData } from '@/context/DataContext';
import { useTranslation } from '@/hooks/useTranslation';
import { AppLanguage } from '@/types';

const LanguageSettings: React.FC = () => {
  const { settings, setSettings } = useData();
  const { t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = React.useState<AppLanguage>(settings.language);

  React.useEffect(() => {
    setSelectedLanguage(settings.language);
  }, [settings.language]);

  const handleSaveLanguage = () => {
    setSettings(prev => ({ ...prev, language: selectedLanguage }));
    toast.success(t('success'), { description: t('languageUpdated') });
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4">{t('language')}</h2>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="language-select" className="text-right">{t('language')}</Label>
        <Select onValueChange={(value: AppLanguage) => setSelectedLanguage(value)} value={selectedLanguage}>
          <SelectTrigger id="language-select" className="col-span-3">
            <SelectValue placeholder={t('selectLanguage')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="ru">Русский</SelectItem>
            <SelectItem value="az">Azərbaycanca</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end mt-4">
        <Button onClick={handleSaveLanguage}>{t('save')}</Button>
      </div>
    </div>
  );
};

export default LanguageSettings;