"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { t } from '@/utils/i18n';

const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedDate = time.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Card className="dark:bg-slate-800 dark:border-slate-700 text-center">
      <CardContent className="p-4">
        <div className="text-sm text-gray-500 dark:text-slate-400">{formattedDate}</div>
        <div className="text-4xl font-bold text-gray-800 dark:text-slate-200 mt-2">{formattedTime}</div>
      </CardContent>
    </Card>
  );
};

export default Clock;