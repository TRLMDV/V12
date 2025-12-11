"use client";

import React from 'react';
import { useData } from '@/context/DataContext';
import { MOCK_CURRENT_DATE } from '@/data/initialData';
import { t } from '@/utils/i18n';
import { AlertCircle } from 'lucide-react';
import { Product, SellOrder, Payment, CurrencyRates, Currency } from '@/types';
import QuickButtonsGrid from '@/components/QuickButtonsGrid';
import SalesChart from '@/components/SalesChart';
import FlipClock from '@/components/FlipClock';
import ReminderCalendar from '@/components/ReminderCalendar';
import { parseISO, format } from 'date-fns'; // Import format
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Dashboard: React.FC = () => {
  const { products, sellOrders, incomingPayments, currencyRates, settings, setSettings, convertCurrency } = useData();
  const mainCurrency = settings.mainCurrency;
  const activeCurrencies = settings.activeCurrencies || [];
  const showDashboardCurrencyRates = settings.showDashboardCurrencyRates;
  const showSalesChartOnDashboard = settings.showSalesChartOnDashboard;
  const showClockOnDashboard = settings.showClockOnDashboard;
  const showCalendarOnDashboard = settings.showCalendarOnDashboard;
  const quickButtons = settings.quickButtons || [];

  const getOverdueSellOrders = () => {
    const customers = useData().customers.reduce((acc, c) => ({ ...acc, [c.id]: c.name }), {} as { [key: number]: string });
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const now = MOCK_CURRENT_DATE.getTime();

    const paymentsByOrder = incomingPayments.reduce((acc, payment) => {
      const paymentAmountInAZN = convertCurrency(payment.amount, payment.paymentCurrency, 'AZN');
      acc[payment.orderId] = (acc[payment.orderId] || 0) + paymentAmountInAZN;
      return acc;
    }, {} as { [key: number]: number });

    const overdueOrders: any[] = [];
    sellOrders.forEach(order => {
      const orderTotalInAZN = convertCurrency(order.total, mainCurrency, 'AZN');
      const totalPaidInAZN = paymentsByOrder[order.id] || 0;
      const amountDueInAZN = orderTotalInAZN - totalPaidInAZN;

      if (amountDueInAZN > 0.001) {
        const orderDate = parseISO(order.orderDate).getTime(); // Parse ISO string
        const timeDiff = now - orderDate;
        if (timeDiff > thirtyDaysInMs) {
          const amountDueInMainCurrency = convertCurrency(amountDueInAZN, 'AZN', mainCurrency);
          overdueOrders.push({
            ...order,
            amountDue: amountDueInMainCurrency,
            daysOverdue: Math.floor(timeDiff / (1000 * 60 * 60 * 24)) - 30,
            customerName: customers[order.contactId] || t('unknownCustomer')
          });
        }
      }
    });
    overdueOrders.sort((a, b) => b.daysOverdue - a.daysOverdue); // Corrected sort key
    return overdueOrders;
  };

  const lowStockProducts = products.filter(p => (p.stock ? Object.values(p.stock).reduce((a, b) => a + b, 0) : 0) < p.minStock);
  const overdueOrders = getOverdueSellOrders();

  const shouldShowClockOrCalendar = showClockOnDashboard || showCalendarOnDashboard;

  return (
    <>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-200 mb-6">{t('dashboard')}</h1>
      
      {shouldShowClockOrCalendar && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {showClockOnDashboard && <FlipClock />}
          {showCalendarOnDashboard && <ReminderCalendar />}
        </div>
      )}

      {quickButtons.length > 0 && (
        <QuickButtonsGrid quickButtons={quickButtons} />
      )}

      {showSalesChartOnDashboard ? (
        <SalesChart />
      ) : (
        <Card className="dark:bg-slate-800 dark:border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-700 dark:text-slate-300">
              {t('salesOverview')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-gray-600 dark:text-slate-400">
              {t('salesChartDisabledMessage')}
            </p>
            <Button
              onClick={() => setSettings(prev => ({ ...prev, showSalesChartOnDashboard: true }))}
            >
              {t('enableChart')}
            </Button>
          </CardContent>
        </Card>
      )}

      {showDashboardCurrencyRates && (
        <div className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4">{t('liveCurrencyRates', { mainCurrency })}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            {Object.entries(currencyRates)
              .filter(([currency]) => activeCurrencies.includes(currency as Currency) && currency !== mainCurrency)
              .map(([currency, rateToAZN]) => {
                const rateToMainCurrency = convertCurrency(1, 'AZN', mainCurrency) / rateToAZN;
                return (
                  <div key={currency} className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{currency} {t('toCurrency', { targetCurrency: mainCurrency })}</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-slate-200">{(1 / rateToMainCurrency).toFixed(4)}</p>
                  </div>
                );
              })}
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Overdue Payments */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4 flex items-center">
            <AlertCircle className="w-6 h-6 mr-3 text-red-500" />
            {t('overduePaymentAlerts')}
          </h2>
          {overdueOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-100 dark:bg-slate-700">
                    <th className="p-3">{t('orderId')}</th>
                    <th className="p-3">{t('customer')}</th>
                    <th className="p-3">{t('orderDate')}</th>
                    <th className="p-3">{t('daysOverdue')}</th>
                    <th className="p-3">{t('amountDue')}</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueOrders.map(o => (
                    <tr key={o.id} className="border-b dark:border-slate-700">
                      <td className="p-3 font-semibold">#{o.id}</td>
                      <td className="p-3">{o.customerName}</td>
                      <td className="p-3">{format(parseISO(o.orderDate), 'yyyy-MM-dd HH:mm')}</td>
                      <td className="p-3 text-red-600 font-bold">{o.daysOverdue}</td>
                      <td className="p-3 font-semibold">{o.amountDue.toFixed(2)} {mainCurrency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-slate-400">{t('noOverduePayments')}</p>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4">{t('lowStockAlerts')}</h2>
          {lowStockProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-100 dark:bg-slate-700">
                    <th className="p-3">{t('product')}</th>
                    <th className="p-3">{t('sku')}</th>
                    <th className="p-3">{t('totalStock')}</th>
                    <th className="p-3">{t('minStock')}</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map(p => (
                    <tr key={p.id} className="border-b dark:border-slate-700">
                      <td className="p-3">{p.name}</td>
                      <td className="p-3">{p.sku}</td>
                      <td className="p-3 text-red-500 font-bold">{p.stock ? Object.values(p.stock).reduce((a, b) => a + b, 0) : 0}</td>
                      <td className="p-3">{p.minStock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-slate-400">{t('noLowStockProducts')}</p>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;