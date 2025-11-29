"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud, Sun, CloudRain, CloudSnow, CloudFog, Wind, Thermometer, AlertCircle } from 'lucide-react';
import { t } from '@/utils/i18n';
import { toast } from 'sonner';

interface WeatherWidgetProps {
  city: string;
}

interface WeatherData {
  name: string;
  main: {
    temp: number;
    feels_like: number;
  };
  weather: Array<{
    description: string;
    icon: string;
    main: string;
  }>;
  wind: {
    speed: number;
  };
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ city }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_KEY = import.meta.env.VITE_OPEN_WEATHER_API_KEY;
  const API_URL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;

  const fetchWeather = useCallback(async () => {
    if (!API_KEY) {
      setError(t('weatherApiKeyMissing'));
      setLoading(false);
      toast.error(t('weatherError'), { description: t('weatherApiKeyMissing') });
      return;
    }
    if (!city) {
      setError(t('weatherCityMissing'));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(t('cityNotFound', { city }));
        }
        throw new Error(`${t('failedToFetchWeather')}: ${response.statusText}`);
      }
      const data: WeatherData = await response.json();
      setWeather(data);
    } catch (err: any) {
      console.error("Weather fetch error:", err);
      setError(err.message || t('failedToFetchWeatherGeneric'));
      toast.error(t('weatherError'), { description: err.message || t('failedToFetchWeatherGeneric') });
    } finally {
      setLoading(false);
    }
  }, [city, API_KEY, API_URL, t]);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 10 * 60 * 1000); // Refresh every 10 minutes
    return () => clearInterval(interval);
  }, [fetchWeather]);

  const getWeatherIcon = (mainCondition: string) => {
    switch (mainCondition.toLowerCase()) {
      case 'clear':
        return <Sun className="w-8 h-8 text-yellow-500" />;
      case 'clouds':
        return <Cloud className="w-8 h-8 text-gray-500" />;
      case 'rain':
      case 'drizzle':
        return <CloudRain className="w-8 h-8 text-blue-500" />;
      case 'snow':
        return <CloudSnow className="w-8 h-8 text-blue-300" />;
      case 'thunderstorm':
        return <CloudRain className="w-8 h-8 text-purple-500" />; // Using rain for thunderstorm
      case 'fog':
      case 'mist':
      case 'haze':
        return <CloudFog className="w-8 h-8 text-gray-400" />;
      case 'wind':
        return <Wind className="w-8 h-8 text-gray-500" />;
      default:
        return <Sun className="w-8 h-8 text-gray-400" />; // Default icon
    }
  };

  if (loading) {
    return (
      <Card className="dark:bg-slate-800 dark:border-slate-700 text-center">
        <CardContent className="p-4 flex items-center justify-center h-full">
          <p className="text-gray-500 dark:text-slate-400">{t('weatherLoading')}</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="dark:bg-slate-800 dark:border-slate-700 text-center">
        <CardContent className="p-4 flex flex-col items-center justify-center h-full text-red-500">
          <AlertCircle className="w-8 h-8 mb-2" />
          <p className="text-sm font-medium">{t('weatherError')}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!weather) {
    return (
      <Card className="dark:bg-slate-800 dark:border-slate-700 text-center">
        <CardContent className="p-4 flex items-center justify-center h-full">
          <p className="text-gray-500 dark:text-slate-400">{t('noWeatherData')}</p>
        </CardContent>
      </Card>
    );
  }

  const mainWeather = weather.weather[0];

  return (
    <Card className="dark:bg-slate-800 dark:border-slate-700 text-center">
      <CardContent className="p-4 flex flex-col items-center justify-center">
        <div className="flex items-center space-x-2 mb-2">
          {getWeatherIcon(mainWeather.main)}
          <h3 className="text-2xl font-bold text-gray-800 dark:text-slate-200">{weather.name}</h3>
        </div>
        <div className="flex items-center space-x-1 text-gray-700 dark:text-slate-300 text-lg">
          <Thermometer className="w-5 h-5" />
          <span>{weather.main.temp.toFixed(1)}°C</span>
        </div>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          {mainWeather.description.charAt(0).toUpperCase() + mainWeather.description.slice(1)}
        </p>
        <p className="text-xs text-gray-500 dark:text-slate-400">
          {t('feelsLike')}: {weather.main.feels_like.toFixed(1)}°C
        </p>
      </CardContent>
    </Card>
  );
};

export default WeatherWidget;