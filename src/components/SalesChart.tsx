"use client";

import React, { useState, useMemo, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
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

// Helper to shade hex colors slightly lighter/darker
function shadeColor(hex: string, percent: number) {
  const f = hex.startsWith('#') ? hex.substring(1) : hex;
  const num = parseInt(f, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const t = percent < 0 ? 0 : 255;
  const p = Math.abs(percent) / 100;
  const R = Math.round((t - r) * p + r);
  const G = Math.round((t - g) * p + g);
  const B = Math.round((t - b) * p + b);
  return `#${(R << 16 | G << 8 | B).toString(16).padStart(6, '0')}`;
}

// Custom 3D bar shape
const ThreeDBar = (props: any) => {
  const { x, y, width, height, fill } = props;
  const depth = 6; // "3D" depth
  const topFill = shadeColor(fill, 15);
  const sideFill = shadeColor(fill, -15);
  if (width <= 0 || height <= 0) return null;

  return (
    <g>
      {/* Front face */}
      <rect x={x} y={y} width={width} height={height} fill={fill} />
      {/* Top face */}
      <polygon
        points={`${x},${y} ${x + depth},${y - depth} ${x + width + depth},${y - depth} ${x + width},${y}`}
        fill={topFill}
      />
      {/* Side face */}
      <polygon
        points={`${x + width},${y} ${x + width + depth},${y - depth} ${x + width + depth},${y + height - depth} ${x + width},${y + height}`}
        fill={sideFill}
      />
      {/* Soft shadow */}
      <rect x={x + width * 0.1} y={y + height} width={width} height={4} fill="rgba(0,0,0,0.08)" />
    </g>
  );
};

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
          <ResponsiveContainer width="100%" height={360}>
            <>
              {/* Single period: sleek gradient area with subtle shadow */}
              {displayMode === 'single' ? (
                <AreaChart
                  data={salesData}
                  margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                >
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.1} />
                    </linearGradient>
                    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="rgba(0,0,0,0.15)" />
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                    formatter={(value: number) => [`${value.toFixed(2)} ${mainCurrency}`, t('totalSalesValue')]}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey={dataKeysToRender[0]}
                    stroke="#4F46E5"
                    strokeWidth={2.5}
                    fill="url(#salesGradient)"
                    dot={{ r: 3, strokeWidth: 1.5 }}
                    isAnimationActive
                    animationDuration={800}
                    filter="url(#shadow)"
                  />
                </AreaChart>
              ) : (
                // All periods: grouped 3D bars per year
                <BarChart
                  data={salesData}
                  margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                    formatter={(value: number, name: string) => [`${(value as number).toFixed(2)} ${mainCurrency}`, name]}
                  />
                  <Legend />
                  {dataKeysToRender.map((key, index) => {
                    const color = COLORS[index % COLORS.length];
                    return (
                      <Bar
                        key={key}
                        dataKey={key}
                        name={key}
                        barSize={18}
                        isAnimationActive
                        animationDuration={700}
                        shape={(props: any) => <ThreeDBar {...props} fill={color} />}
                      />
                    );
                  })}
                </BarChart>
              )}
            </>
          </ResponsiveContainer>
        ) : (
          <div className="h-[360px] flex items-center justify-center text-gray-500 dark:text-slate-400">
            {t('noSalesData')}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SalesChart;