"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Settings } from '@/types';
import { t } from '@/utils/i18n';

interface WeatherSettingsProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

const WeatherSettings: React.FC<WeatherSettingsProps> = ({ settings, setSettings, t }) => {
  const [showWeather, setShowWeather] = useState(settings.showWeatherOnDashboard);
  const [defaultCity, setDefaultCity] = useState(settings.defaultWeatherCity);

  useEffect(() => {
    setShowWeather(settings.showWeatherOnDashboard);
    setDefaultCity(settings.defaultWeatherCity);
  }, [settings.showWeatherOnDashboard, settings.defaultWeatherCity]);

  const handleToggleShowWeather = (checked: boolean) => {
    setShowWeather(checked);
    setSettings(prev => ({ ...prev, showWeatherOnDashboard: checked }));
    toast.success(t('success'), { description: t('weatherVisibilityUpdated') });
  };

  const handleSaveDefaultCity = () => {
    if (!defaultCity.trim()) {
      toast.error(t('validationError'), { description: t('weatherCityRequired') });
      return;
    }
    setSettings(prev => ({ ...prev, defaultWeatherCity: defaultCity.trim() }));
    toast.success(t('success'), { description: t('defaultWeatherCityUpdated') });
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4">{t('weatherSettings')}</h2>
      <div className="flex items-center justify-between mb-4">
        <Label htmlFor="show-weather-on-dashboard" className="text-sm font-medium text-gray-700 dark:text-slate-300">
          {t('showWeatherOnDashboard')}
        </Label>
        <Switch
          id="show-weather-on-dashboard"
          checked={showWeather}
          onCheckedChange={handleToggleShowWeather}
        />
      </div>

      <div className="grid grid-cols-4 items-center gap-4 mt-4">
        <Label htmlFor="defaultWeatherCity" className="text-right">{t('defaultWeatherCity')}</Label>
        <Input
          id="defaultWeatherCity"
          type="text"
          value={defaultCity}
          onChange={(e) => setDefaultCity(e.target.value)}
          className="col-span-3"
          placeholder={t('enterCityName')}
        />
      </div>
      <div className="flex justify-end mt-4">
        <Button onClick={handleSaveDefaultCity}>{t('saveDefaultWeatherCity')}</Button>
      </div>
    </div>
  );
};

export default WeatherSettings;