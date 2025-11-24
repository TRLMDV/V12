"use client";

import React, { useState, useMemo, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  format, parseISO, getYear, getMonth, getDate, setMonth, setYear, addYears, subYears, addMonths, subMonths,
  eachMonthOfInterval, eachDayOfInterval, startOfMonth, endOfMonth, startOfYear, endOfYear
} from 'date-fns';
import { useData } from '@/context/DataContext';
import { t } from '@/utils/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MOCK_CURRENT_DATE } from '@/data/initialData';

type ChartPeriod = 'yearly' | 'monthly';

interface SalesChartProps {
  // No props needed, data comes from context
}

const SalesChart: React.FC<SalesChartProps> = () => {
  const { sellOrders, settings, convertCurrency } = useData();
  const mainCurrency = settings.mainCurrency;

  const [chartType, setChartType] = useState<ChartPeriod>('yearly');
  const [currentDate, setCurrentDate] = useState(MOCK_CURRENT_DATE); // Use MOCK_CURRENT_DATE for initial state

  const currentYear = getYear(currentDate);
  const currentMonth = getMonth(currentDate); // 0-indexed

  const handlePreviousPeriod = useCallback(() => {
    setCurrentDate(prev => chartType === 'yearly' ? subYears(prev, 1) : subMonths(prev, 1));
  }, [chartType]);

  const handleNextPeriod = useCallback(() => {
    setCurrentDate(prev => chartType === 'yearly' ? addYears(prev, 1) : addMonths(prev, 1));
  }, [chartType]);

  const handleYearChange = useCallback((year: string) => {
    setCurrentDate(prev => setYear(prev, parseInt(year)));
  }, []);

  const handleMonthChange = useCallback((month: string) => {
    setCurrentDate(prev => setMonth(prev, parseInt(month)));
  }, []);

  const salesData = useMemo(() => {
    const filteredOrders = sellOrders.filter(order => order.status === 'Shipped');

    if (chartType === 'yearly') {
      const yearStart = startOfYear(currentDate);
      const yearEnd = endOfYear(currentDate);
      const monthsInYear = eachMonthOfInterval({ start: yearStart, end: yearEnd });

      const monthlySales: { [key: string]: number } = {};
      monthsInYear.forEach(month => {
        monthlySales[format(month, 'MMM')] = 0; // Initialize all months to 0
      });

      filteredOrders.forEach(order => {
        const orderDate = parseISO(order.orderDate);
        if (getYear(orderDate) === currentYear) {
          const monthKey = format(orderDate, 'MMM');
          const salesValue = convertCurrency(order.total, mainCurrency, mainCurrency); // Already in main currency
          monthlySales[monthKey] = (monthlySales[monthKey] || 0) + salesValue;
        }
      });

      return monthsInYear.map(month => ({
        name: t(format(month, 'MMM').toLowerCase() as keyof typeof t), // Translate month names
        [t('totalSalesValue')]: parseFloat(monthlySales[format(month, 'MMM')].toFixed(2)),
      }));
    } else { // monthly
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

      const dailySales: { [key: string]: number } = {};
      daysInMonth.forEach(day => {
        dailySales[`${getDate(day)}`] = 0; // Initialize all days to 0
      });

      filteredOrders.forEach(order => {
        const orderDate = parseISO(order.orderDate);
        if (getYear(orderDate) === currentYear && getMonth(orderDate) === currentMonth) {
          const dayKey = `${getDate(orderDate)}`;
          const salesValue = convertCurrency(order.total, mainCurrency, mainCurrency); // Already in main currency
          dailySales[dayKey] = (dailySales[dayKey] || 0) + salesValue;
        }
      });

      return daysInMonth.map(day => ({
        name: `${t('day')} ${getDate(day)}`,
        [t('totalSalesValue')]: parseFloat(dailySales[`${getDate(day)}`].toFixed(2)),
      }));
    }
  }, [sellOrders, chartType, currentDate, currentYear, currentMonth, mainCurrency, convertCurrency]);

  const allYears = useMemo(() => {
    const years = new Set<number>();
    sellOrders.forEach(order => years.add(getYear(parseISO(order.orderDate))));
    if (years.size === 0) years.add(currentYear); // Ensure current year is always an option
    return Array.from(years).sort((a, b) => b - a); // Sort descending
  }, [sellOrders, currentYear]);

  const allMonths = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => i); // 0-11 for months
  }, []);

  return (
    <Card className="dark:bg-slate-800 dark:border-slate-700 mb-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold text-gray-700 dark:text-slate-300">{t('salesOverview')}</CardTitle>
        <div className="flex items-center space-x-2">
          <Select onValueChange={(value: ChartPeriod) => setChartType(value)} value={chartType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t('yearlySales')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yearly">{t('yearlySales')}</SelectItem>
              <SelectItem value="monthly">{t('monthlySales')}</SelectItem>
            </SelectContent>
          </Select>
          {chartType === 'yearly' ? (
            <Select onValueChange={handleYearChange} value={String(currentYear)}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder={String(currentYear)} />
              </SelectTrigger>
              <SelectContent>
                {allYears.map(year => (
                  <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Select onValueChange={handleMonthChange} value={String(currentMonth)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder={t(format(currentDate, 'MMM').toLowerCase() as keyof typeof t)} />
              </SelectTrigger>
              <SelectContent>
                {allMonths.map(monthIndex => (
                  <SelectItem key={monthIndex} value={String(monthIndex)}>
                    {t(format(setMonth(new Date(), monthIndex), 'MMM').toLowerCase() as keyof typeof t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" size="icon" onClick={handlePreviousPeriod}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextPeriod}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {salesData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={salesData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
              <YAxis stroke="hsl(var(--foreground))" />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                formatter={(value: number) => [`${value.toFixed(2)} ${mainCurrency}`, t('totalSalesValue')]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey={t('totalSalesValue')}
                stroke="#8884d8"
                activeDot={{ r: 8 }}
                name={t('totalSalesValue')}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-slate-400">
            {t('noSalesData')}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SalesChart;