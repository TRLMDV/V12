"use client";

import React, { useMemo, useState } from 'react';
import { useData } from '@/context/DataContext';
import { t } from '@/utils/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ExpeditorsReport: React.FC = () => {
  const { sellOrders, warehouseMap, settings } = useData();
  const percent = settings.expeditorProfitPercent ?? 15;

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedExpeditor, setSelectedExpeditor] = useState<string>('all');

  const ordersWithExpeditor = useMemo(() => {
    const inRange = sellOrders.filter(o => {
      const d = new Date(o.orderDate);
      const afterStart = startDate ? d >= new Date(startDate) : true;
      const beforeEnd = endDate ? d <= new Date(endDate) : true;
      return afterStart && beforeEnd;
    });

    return inRange
      .map(o => {
        const wh = warehouseMap[o.warehouseId];
        const expeditor = wh?.expeditor || '';
        const base = o.total / (1 + (o.vatPercent || 0) / 100);
        const profit = expeditor ? (base * (percent / 100)) : 0;
        return { ...o, expeditor, profit };
      })
      .filter(o => o.expeditor && (selectedExpeditor === 'all' || o.expeditor === selectedExpeditor));
  }, [sellOrders, warehouseMap, percent, startDate, endDate, selectedExpeditor]);

  const expeditorNames = useMemo(() => {
    const names = new Set<string>();
    Object.values(warehouseMap).forEach(w => {
      if (w.expeditor) names.add(w.expeditor);
    });
    return Array.from(names);
  }, [warehouseMap]);

  const totalsByExpeditor = useMemo(() => {
    const totals: Record<string, number> = {};
    ordersWithExpeditor.forEach(o => {
      totals[o.expeditor] = (totals[o.expeditor] || 0) + o.profit;
    });
    return totals;
  }, [ordersWithExpeditor]);

  const overallTotal = useMemo(() => {
    return ordersWithExpeditor.reduce((sum, o) => sum + o.profit, 0);
  }, [ordersWithExpeditor]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-200 mb-6">{t('expeditorsReport')}</h1>

      <Card className="mb-6 dark:bg-slate-800 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-gray-800 dark:text-slate-200">{t('reportPeriod')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label htmlFor="start-date" className="text-sm">{t('startDate')}</Label>
              <Input id="start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="end-date" className="text-sm">{t('endDate')}</Label>
              <Input id="end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="expeditor-select" className="text-sm">{t('selectExpeditor')}</Label>
              <Select value={selectedExpeditor} onValueChange={setSelectedExpeditor}>
                <SelectTrigger id="expeditor-select" className="mt-1">
                  <SelectValue placeholder={t('allExpeditors')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allExpeditors')}</SelectItem>
                  {expeditorNames.map(name => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-slate-300">{t('totalToPay')}:</div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{overallTotal.toFixed(2)} AZN</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6 dark:bg-slate-800 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-gray-800 dark:text-slate-200">{t('expeditorTotals')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100 dark:bg-slate-700">
                <TableHead className="p-3">{t('expeditor')}</TableHead>
                <TableHead className="p-3">{t('totalToPay')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.keys(totalsByExpeditor).length > 0 ? (
                Object.entries(totalsByExpeditor).map(([name, total]) => (
                  <TableRow key={name} className="border-b dark:border-slate-700">
                    <TableCell className="p-3">{name}</TableCell>
                    <TableCell className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">{total.toFixed(2)} AZN</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="p-3 text-center text-gray-500 dark:text-slate-400">{t('noItemsFound')}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-gray-800 dark:text-slate-200">{t('ordersList')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100 dark:bg-slate-700">
                <TableHead className="p-3">{t('orderId')}</TableHead>
                <TableHead className="p-3">{t('orderDate')}</TableHead>
                <TableHead className="p-3">{t('warehouse')}</TableHead>
                <TableHead className="p-3">{t('expeditor')}</TableHead>
                <TableHead className="p-3">{t('total')}</TableHead>
                <TableHead className="p-3">{t('expeditorProfit')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordersWithExpeditor.length > 0 ? (
                ordersWithExpeditor.map(o => (
                  <TableRow key={o.id} className="border-b dark:border-slate-700">
                    <TableCell className="p-3">#{o.id}</TableCell>
                    <TableCell className="p-3">{o.orderDate}</TableCell>
                    <TableCell className="p-3">{warehouseMap[o.warehouseId]?.name || t('na')}</TableCell>
                    <TableCell className="p-3">{o.expeditor}</TableCell>
                    <TableCell className="p-3">{o.total.toFixed(2)} AZN</TableCell>
                    <TableCell className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">{o.profit.toFixed(2)} AZN</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="p-3 text-center text-gray-500 dark:text-slate-400">{t('noItemsFound')}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpeditorsReport;