"use client";

import React, { useState, useEffect } from 'react';
import FlipCard from './FlipCard';
import { format } from 'date-fns';
import { t } from '@/utils/i18n';
import { Card, CardContent } from '@/components/ui/card';

const FlipClock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  const hours = format(time, 'HH');
  const minutes = format(time, 'mm');
  const seconds = format(time, 'ss');
  const formattedDate = format(time, 'PPP'); // e.g., "Oct 26, 2023"

  return (
    <Card className="dark:bg-slate-800 dark:border-slate-700 text-center p-4 flex flex-col items-center justify-center h-full">
      <CardContent className="p-0 flex flex-col items-center justify-center w-full h-full">
        <div className="text-sm text-gray-500 dark:text-slate-400 mb-4">
          {formattedDate}
        </div>
        <div className="flex space-x-2 md:space-x-4 items-center justify-center w-full">
          <FlipCard value={hours} label={t('hours')} />
          <FlipCard value={minutes} label={t('minutes')} />
          <FlipCard value={seconds} label={t('seconds')} />
        </div>
      </CardContent>
    </Card>
  );
};

export default FlipClock;