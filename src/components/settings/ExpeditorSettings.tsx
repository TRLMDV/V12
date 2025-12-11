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
  const [divisor, setDivisor] = useState<number>(settings.expeditorProfitDivisor || 1.17);

  useEffect(() => {
    setDivisor(settings.expeditorProfitDivisor || 1.17);
  }, [settings.expeditorProfitDivisor]);

  const handleSave = () => {
    const value = Number(divisor);
    if (!isFinite(value) || value <= 0) {
      alert('Please enter a valid positive number.');
      return;
    }
    setSettings(prev => ({ ...prev, expeditorProfitDivisor: value }));
  };

  return (
    <Card className="dark:bg-slate-800 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="text-gray-800 dark:text-slate-200">{t('divisorSettings')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          <Label htmlFor="expeditor-divisor" className="text-sm text-gray-700 dark:text-slate-300">{t('profitDivisor')}</Label>
          <Input
            id="expeditor-divisor"
            type="number"
            step="0.01"
            min="0.01"
            value={divisor}
            onChange={(e) => setDivisor(parseFloat(e.target.value))}
            className="w-[200px]"
          />
          <Button onClick={handleSave}>{t('saveDivisor')}</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpeditorSettings;