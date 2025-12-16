"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { useData } from '@/context/DataContext';
import { MOCK_CURRENT_DATE } from '@/data/initialData'; // Corrected import
import { t } from '@/utils/i18n';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, DollarSign, TrendingUp, Wallet } from 'lucide-react';
import { PurchaseOrder, SellOrder, Payment, Product } from '@/types'; // Import types from types file
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import ExpensesListModal from '@/components/ExpensesListModal';

const Finance: React.FC = () => {
  const { purchaseOrders, sellOrders, incomingPayments, outgoingPayments, products, currencyRates, settings, convertCurrency, warehouseMap } = useData();
  const mainCurrency = settings.mainCurrency;

  const [period, setPeriod] = useState<'allTime' | 'thisYear' | 'thisMonth' | 'thisWeek' | 'today'>('allTime');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isExpensesModalOpen, setIsExpensesModalOpen] = useState(false);

  const getPeriodDates = useCallback(() => {
    const now = MOCK_CURRENT_DATE;
    let start = new Date(0); // Epoch
    let end = new Date(now);

    switch (period) {
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'thisWeek':
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
        start = new Date(now.setDate(diff));
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case 'allTime':
      default:
        // For allTime, include all dates by setting an open-ended end date
        start = new Date(0);
        end = new Date('9999-12-31T23:59:59.999Z');
        break;
    }
    return { start, end };
  }, [period]);

  const { start: calculatedStartDate, end: calculatedEndDate } = getPeriodDates();

  const effectiveStartDate = startDate ? new Date(startDate) : calculatedStartDate;
  const effectiveEndDate = endDate ? new Date(endDate) : calculatedEndDate;

  const filteredData = useMemo(() => {
    const productMap = products.reduce((acc, p) => ({ ...acc, [p.id]: p }), {} as { [key: number]: Product });

    const filteredSellOrders = sellOrders.filter(order => {
      const orderDate = new Date(order.orderDate);
      return orderDate >= effectiveStartDate && orderDate <= effectiveEndDate;
    });

    const filteredPurchaseOrders = purchaseOrders.filter(order => {
      const orderDate = new Date(order.orderDate);
      return orderDate >= effectiveStartDate && orderDate <= effectiveEndDate;
    });

    const filteredIncomingPayments = incomingPayments.filter(payment => {
      const paymentDate = new Date(payment.date);
      return paymentDate >= effectiveStartDate && paymentDate <= effectiveEndDate;
    });

    const filteredOutgoingPayments = outgoingPayments.filter(payment => {
      const paymentDate = new Date(payment.date);
      return paymentDate >= effectiveStartDate && paymentDate <= effectiveEndDate;
    });

    let totalRevenueInMainCurrency = 0; // Excl. VAT
    let totalCOGSInMainCurrency = 0;
    let totalVatCollectedInMainCurrency = 0;

    // ADD: expeditor totals accumulator (by warehouse expeditor name)
    const expeditorTotals: Record<string, number> = {};
    const percent = settings.expeditorProfitPercent ?? 15;

    filteredSellOrders.forEach(order => {
      if (order.status === 'Shipped') {
        // order.total is already in mainCurrency
        const subtotalExVatInMainCurrency = order.total / (1 + order.vatPercent / 100);
        totalRevenueInMainCurrency += subtotalExVatInMainCurrency;
        totalVatCollectedInMainCurrency += order.total - subtotalExVatInMainCurrency;

        // ADD: accumulate expeditor profit for orders shipped from warehouses with an expeditor
        const wh = warehouseMap[order.warehouseId];
        if (wh && wh.expeditor) {
          const expeditorShare = subtotalExVatInMainCurrency * (percent / 100);
          expeditorTotals[wh.expeditor] = (expeditorTotals[wh.expeditor] || 0) + expeditorShare;
        }

        order.items.forEach(item => {
          const product = productMap[item.productId];
          if (product) {
            // product.averageLandedCost is now in mainCurrency
            totalCOGSInMainCurrency += item.qty * (product.averageLandedCost || 0);
          }
        });
      }
    });

    const grossProfitInMainCurrency = totalRevenueInMainCurrency - totalCOGSInMainCurrency;

    let totalIncomingInMainCurrency = 0;
    filteredIncomingPayments.forEach(p => {
      totalIncomingInMainCurrency += convertCurrency(p.amount, p.paymentCurrency, mainCurrency);
    });

    let totalOutgoingInMainCurrency = 0;
    filteredOutgoingPayments.forEach(p => {
      totalOutgoingInMainCurrency += convertCurrency(p.amount, p.paymentCurrency, mainCurrency);
    });

    // NEW: Expenses from categorized outgoing payments (manual categories except capital/withdrawal + order fees)
    let expensesInMainCurrency = 0;
    filteredOutgoingPayments.forEach(p => {
      const isVatPayment = (p.method || '').toUpperCase() === 'VAT';
      if (isVatPayment) return; // exclude VAT, handled separately

      const amountMain = convertCurrency(p.amount, p.paymentCurrency, mainCurrency);

      if (p.orderId === 0) {
        const cat = p.paymentCategory || 'manual';
        if (cat !== 'initialCapital' && cat !== 'Withdrawal') {
          expensesInMainCurrency += amountMain;
        }
      } else {
        if (p.paymentCategory === 'fees') {
          expensesInMainCurrency += amountMain;
        }
        // Note: exclude 'products' to avoid double counting with COGS
      }
    });

    // NEW: VAT used and VAT balance
    let totalVatUsedInMainCurrency = 0;
    filteredOutgoingPayments.forEach(p => {
      if ((p.method || '').toUpperCase() === 'VAT') {
        totalVatUsedInMainCurrency += convertCurrency(p.amount, p.paymentCurrency, mainCurrency);
      }
    });

    const vatBalanceInMainCurrency = totalVatCollectedInMainCurrency - totalVatUsedInMainCurrency;
    
    const netCashFlowInMainCurrency = totalIncomingInMainCurrency - totalOutgoingInMainCurrency;

    const cleanProfitAfterExpenses = grossProfitInMainCurrency - expensesInMainCurrency;

    // NEW: Expenses list items for modal
    const expensesList = filteredOutgoingPayments
      .filter(p => {
        const isVatPayment = (p.method || '').toUpperCase() === 'VAT';
        if (isVatPayment) return false;
        if (p.orderId === 0) {
          const cat = p.paymentCategory || 'manual';
          return cat !== 'initialCapital' && cat !== 'Withdrawal';
        } else {
          return p.paymentCategory === 'fees';
        }
      })
      .map(p => {
        const amountMain = convertCurrency(p.amount, p.paymentCurrency, mainCurrency);
        const isManual = p.orderId === 0;
        const category = isManual ? (p.paymentCategory || 'Manual Expense') : t('fees');
        const description = isManual
          ? (p.manualDescription || '')
          : `${t('orderId')} #${p.orderId} - ${t('fees')}`;
        return {
          id: p.id,
          date: p.date,
          description,
          category,
          amount: p.amount,
          currency: p.paymentCurrency,
          amountMain,
        };
      });

    return {
      totalRevenue: totalRevenueInMainCurrency,
      totalCOGS: totalCOGSInMainCurrency,
      grossProfit: grossProfitInMainCurrency,
      totalVatCollected: totalVatCollectedInMainCurrency,
      totalVatUsed: totalVatUsedInMainCurrency,
      vatBalance: vatBalanceInMainCurrency,
      totalIncoming: totalIncomingInMainCurrency,
      totalOutgoing: totalOutgoingInMainCurrency,
      netCashFlow: netCashFlowInMainCurrency,
      expensesTotal: expensesInMainCurrency,            // NEW
      cleanProfitAfterExpenses,                         // NEW
      // ADD: expenses list for modal
      expensesList,
      // ADD: return expeditor totals for UI section
      expeditorTotals,
    };
  }, [purchaseOrders, sellOrders, incomingPayments, outgoingPayments, products, effectiveStartDate, effectiveEndDate, currencyRates, settings.mainCurrency, settings.expeditorProfitPercent, warehouseMap, convertCurrency]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-200 mb-6">{t('financeTitle')}</h1>

      <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <Label htmlFor="period-select" className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('period')}</Label>
            <Select onValueChange={(value: typeof period) => { setPeriod(value); setStartDate(''); setEndDate(''); }} value={period}>
              <SelectTrigger id="period-select" className="w-full mt-1">
                <SelectValue placeholder={t('allTime')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="allTime">{t('allTime')}</SelectItem>
                <SelectItem value="thisYear">{t('thisYear')}</SelectItem>
                <SelectItem value="thisMonth">{t('thisMonth')}</SelectItem>
                <SelectItem value="thisWeek">{t('thisWeek')}</SelectItem>
                <SelectItem value="today">{t('today')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="start-date-filter" className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('startDate')}</Label>
            <Input
              type="date"
              id="start-date-filter"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPeriod('allTime'); }}
              className="mt-1 w-full p-2 border rounded-md shadow-sm bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
          </div>
          <div>
            <Label htmlFor="end-date-filter" className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('endDate')}</Label>
            <Input
              type="date"
              id="end-date-filter"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPeriod('allTime'); }}
              className="mt-1 w-full p-2 border rounded-md shadow-sm bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-semibold text-gray-800 dark:text-slate-200 mb-4">{t('keyMetrics')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('totalRevenue')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{filteredData.totalRevenue.toFixed(2)} {mainCurrency}</div>
            <p className="text-xs text-muted-foreground">{t('revenueExVat')}</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('cogsTotal')}</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{filteredData.totalCOGS.toFixed(2)} {mainCurrency}</div>
            <p className="text-xs text-muted-foreground">{t('costOfGoodsSold')}</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('grossProfit')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{filteredData.grossProfit.toFixed(2)} {mainCurrency}</div>
            <p className="text-xs text-muted-foreground">{t('grossProfitTotal')}</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('totalVatCollected')}</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{filteredData.totalVatCollected.toFixed(2)} {mainCurrency}</div>
            <p className="text-xs text-muted-foreground">{t('vatCollectedFromSales')}</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('totalRevenuePlusVatCollected')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {(filteredData.totalRevenue + filteredData.totalVatCollected).toFixed(2)} {mainCurrency}
            </div>
            <p className="text-xs text-muted-foreground">{t('revenueInclVat')}</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('usedVat')}</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{filteredData.totalVatUsed.toFixed(2)} {mainCurrency}</div>
            <p className="text-xs text-muted-foreground">{t('vatUsedOnPayments')}</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('vatBalance')}</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${filteredData.vatBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {filteredData.vatBalance.toFixed(2)} {mainCurrency}
            </div>
            <p className="text-xs text-muted-foreground">{t('vatBalanceOnHand')}</p>
          </CardContent>
        </Card>

        {/* NEW: Expenses card */}
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('expensesTotal')}</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" aria-label={t('view')} onClick={() => setIsExpensesModalOpen(true)}>
                <Eye className="h-4 w-4" />
              </Button>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {filteredData.expensesTotal.toFixed(2)} {mainCurrency}
            </div>
            <p className="text-xs text-muted-foreground">{t('expensesFromCategories')}</p>
          </CardContent>
        </Card>

        {/* NEW: Clean Profit (Gross Profit - Expenses) */}
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('grossProfitMinusExpenses')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${filteredData.cleanProfitAfterExpenses >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {filteredData.cleanProfitAfterExpenses.toFixed(2)} {mainCurrency}
            </div>
            <p className="text-xs text-muted-foreground">{t('cleanProfitAfterExpenses')}</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-semibold text-gray-800 dark:text-slate-200 mb-4">{t('cashFlow')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('totalIncomingPayments')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{filteredData.totalIncoming.toFixed(2)} {mainCurrency}</div>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('totalOutgoingPayments')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{filteredData.totalOutgoing.toFixed(2)} {mainCurrency}</div>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('netCashFlow')}</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${filteredData.netCashFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {filteredData.netCashFlow.toFixed(2)} {mainCurrency}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ADD: Expeditor totals per period */}
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-slate-200 mt-8 mb-4">{t('expeditorTotals')}</h2>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100 dark:bg-slate-700">
              <TableHead className="p-3">{t('expeditor')}</TableHead>
              <TableHead className="p-3">{t('totalToPay')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.expeditorTotals && Object.keys(filteredData.expeditorTotals).length > 0 ? (
              Object.entries(filteredData.expeditorTotals).map(([name, total]) => (
                <TableRow key={name} className="border-b dark:border-slate-700">
                  <TableCell className="p-3">{name}</TableCell>
                  <TableCell className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">
                    {total.toFixed(2)} {mainCurrency}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="p-3 text-center text-gray-500 dark:text-slate-400">
                  {t('noItemsFound')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ADD: Expenses list modal */}
      <ExpensesListModal
        isOpen={isExpensesModalOpen}
        onClose={() => setIsExpensesModalOpen(false)}
        expenses={filteredData.expensesList || []}
        mainCurrency={mainCurrency}
      />
    </div>
  );
};

export default Finance;