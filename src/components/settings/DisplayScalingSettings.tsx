"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { Settings } from '@/types';

interface DisplayScalingSettingsProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

const DisplayScalingSettings: React.FC<DisplayScalingSettingsProps> = ({ settings, setSettings, t }) => {
  const [displayScale, setDisplayScale] = useState(settings.displayScale);

  useEffect(() => {
    setDisplayScale(settings.displayScale);
  }, [settings.displayScale]);

  const handleSaveDisplayScale = () => {
    if (isNaN(displayScale) || displayScale < 50 || displayScale > 150) {
      toast.error('Validation Error', { description: 'Display scale must be between 50% and 150%.' });
      return;
    }
    setSettings(prev => ({ ...prev, displayScale }));
    toast.success(t('success'), { description: t('displayScaleUpdated') });
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4">{t('programDisplayScaling')}</h2>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="displayScale" className="text-right">{t('displayScale')}</Label>
          <div className="col-span-2 flex items-center gap-2">
            <Slider
              id="displayScale"
              min={50}
              max={150}
              step={1}
              value={[displayScale]}
              onValueChange={(value) => setDisplayScale(value[0])}
              className="w-full"
            />
          </div>
          <Input
            type="number"
            min="50"
            max="150"
            step="1"
            value={displayScale}
            onChange={(e) => setDisplayScale(parseInt(e.target.value) || 0)}
            className="col-span-1 text-center"
          />
          <span className="text-gray-700 dark:text-slate-300">%</span>
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSaveDisplayScale}>{t('saveDisplayScale')}</Button>
      </div>
    </div>
  );
};

export default DisplayScalingSettings;