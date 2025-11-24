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
type DisplayMode = 'single' | 'all'; // New type for display mode

interface SalesChartProps {
  // No props needed, data comes from context
}

const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919',
  '#3f51b5', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50'
]; // A palette of colors for multiple lines

// Define a more flexible type for monthly sales entries
interface MonthlySalesEntry {
  name: string;
  [key: string]: string | number; // Allows 'name' as string and dynamic year keys as numbers
}

const SalesChart: React.FC<SalesChartProps> = () => {
  const { sellOrders, settings, convertCurrency } = useData();
  const mainCurrency = settings.mainCurrency;

  const [chartType, setChartType] = useState<ChartPeriod>('yearly');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('single'); // New state for display mode
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

  const allYears = useMemo(() => {
    const years = new Set<number>();
    sellOrders.forEach(order => years.add(getYear(parseISO(order.orderDate))));
    if (years.size === 0) years.add(currentYear); // Ensure current year is always an option
    return Array.from(years).sort((a, b) => a - b); // Sort ascending for consistent line order
  }, [sellOrders, currentYear]);

  const allMonths = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => i); // 0-11 for months
  }, []);

  const salesData = useMemo(() => {
    const filteredOrders = sellOrders.filter(order => order.status === 'Shipped');

    if (displayMode === 'single') {
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
      } else { // monthly (single month, daily data)
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
    } else { // displayMode === 'all'
      // For both 'yearly' and 'monthly' chart types in 'all' mode,
      // we want to show monthly sales data, comparing across all years.
      const monthsInYear = eachMonthOfInterval({ start: startOfYear(currentDate), end: endOfYear(currentDate) });
      const dataMap: { [monthKey: string]: MonthlySalesEntry } = {}; // Use the new type here

      monthsInYear.forEach(month => {
        const monthName = t(format(month, 'MMM').toLowerCase() as keyof typeof t);
        dataMap[monthName] = { name: monthName }; // Assign 'name' property
        allYears.forEach(year => {
          dataMap[monthName][String(year)] = 0; // Initialize sales for each year
        });
      });

      filteredOrders.forEach(order => {
        const orderDate = parseISO(order.orderDate);
        const year = getYear(orderDate);
        const monthName = t(format(orderDate, 'MMM').toLowerCase() as keyof typeof t);
        const salesValue = convertCurrency(order.total, mainCurrency, mainCurrency);

        if (dataMap[monthName] && allYears.includes(year)) {
          dataMap[monthName][String(year)] = parseFloat(((dataMap[monthName][String(year)] as number || 0) + salesValue).toFixed(2));
        }
      });

      return Object.values(dataMap);
    }
  }, [sellOrders, chartType, displayMode, currentDate, currentYear, currentMonth, mainCurrency, convertCurrency, allYears, allMonths]);

  const dataKeysToRender = useMemo(() => {
    if (salesData.length === 0) return [];
    if (displayMode === 'single') {
      return [t('totalSalesValue')];
    } else { // displayMode === 'all' (now unified for both chartType 'yearly' and 'monthly')
      return allYears.map(String);
    }
  }, [salesData, displayMode, allYears]);

  return (
    <Card className="dark:bg-slate-800 dark:border-slate-700 mb-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold text-gray-700 dark:text-slate-300">{t('salesOverview')}</CardTitle>
        <div className="flex items-center space-x-2">
          <Select onValueChange={(value: DisplayMode) => setDisplayMode(value)} value={displayMode}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t('singlePeriod')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">{t('singlePeriod')}</SelectItem>
              <SelectItem value="all">{t('allPeriods')}</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(value: ChartPeriod) => setChartType(value)} value={chartType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t('yearlySales')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yearly">{t('yearlySales')}</SelectItem>
              <SelectItem value="monthly">{t('monthlySales')}</SelectItem>
            </SelectContent>
          </Select>

          {displayMode === 'single' && (
            <>
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
            </>
          )}
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
              <YAxis stroke="hsl(var(--foreground))" domain={['auto', 'auto']} /> {/* Auto domain for varying values */}
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                formatter={(value: number) => [`${value.toFixed(2)} ${mainCurrency}`, t('totalSalesValue')]}
              />
              <Legend />
              {dataKeysToRender.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={COLORS[index % COLORS.length]} // Assign color from palette
                  activeDot={{ r: 8 }}
                  name={key}
                  strokeWidth={2}
                />
              ))}
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