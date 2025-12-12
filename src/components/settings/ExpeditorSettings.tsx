"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { t } from '@/utils/i18n';
import { useData } from '@/context/DataContext';

const ExpeditorSettings: React.FC = () => {
  const { settings, setSettings } = useData();
  const [percent, setPercent] = useState<number>(settings.expeditorProfitPercent ?? 15);

  useEffect(() => {
    setPercent(settings.expeditorProfitPercent ?? 15);
  }, [settings.expeditorProfitPercent]);

  const handleSave = () => {
    const value = Number(percent);
    if (!isFinite(value) || value < 0 || value > 100) {
      alert('Please enter a valid percentage between 0 and 100.');
      return;
    }
    setSettings(prev => ({ ...prev, expeditorProfitPercent: value }));
  };

  return (
    <Card className="dark:bg-slate-800 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="text-gray-800 dark:text-slate-200">{t('expeditorPercentSettings')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          <Label htmlFor="expeditor-percent" className="text-sm text-gray-700 dark:text-slate-300">{t('expeditorPercent')}</Label>
          <Input
            id="expeditor-percent"
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={percent}
            onChange={(e) => setPercent(parseFloat(e.target.value))}
            className="w-[200px]"
          />
          <Button onClick={handleSave}>{t('saveExpeditorPercent')}</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpeditorSettings;