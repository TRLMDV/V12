"use client";

import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthProvider';
import { useData } from '@/context/DataContext';
import { t, getKeyAsPageId } from '@/utils/i18n';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const MobileHeader: React.FC = () => {
  const { settings } = useData();
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const companyName = settings.companyName || '';
  const companyLogo = settings.companyLogo;

  const navItems = [
    { id: 'dashboard', to: '/', label: t('dashboard') },
    { id: 'products', to: '/products', label: t('products') },
    { id: 'purchaseOrders', to: '/purchase-orders', label: t('purchaseOrders') },
    { id: 'sellOrders', to: '/sell-orders', label: t('sellOrders') },
    { id: 'suppliers', to: '/suppliers', label: t('suppliers') },
    { id: 'customers', to: '/customers', label: t('customers') },
    { id: 'incomingPayments', to: '/incoming-payments', label: t('incomingPayments') },
    { id: 'outgoingPayments', to: '/outgoing-payments', label: t('outgoingPayments') },
    { id: 'warehouses', to: '/warehouses', label: t('warehouses') },
    { id: 'productMovement', to: '/product-movement', label: t('productMovement') },
    { id: 'utilization', to: '/utilization', label: t('utilization') },
    { id: 'expeditorsReport', to: '/expeditors-report', label: t('expeditorsReport') },
    { id: 'finance', to: '/finance', label: t('finance') },
    { id: 'profitability', to: '/profitability', label: t('profitability') },
    { id: 'dataImportExport', to: '/data-import-export', label: t('dataImportExport') },
    { id: 'settings', to: '/settings', label: t('settings') },
  ];

  const currentPath = location.pathname;

  return (
    <div className="lg:hidden sticky top-0 z-30 bg-white dark:bg-slate-900 border-b dark:border-slate-800">
      <div className="flex items-center justify-between px-3 py-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open navigation">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SheetHeader className="px-4 py-3">
              <SheetTitle className="flex items-center">
                {companyLogo ? (
                  <>
                    <img src={companyLogo} className="w-auto h-6 mr-2 object-contain" alt="Company Logo" />
                    {companyName && (
                      <span className="text-base font-semibold text-slate-900 dark:text-white">{companyName}</span>
                    )}
                  </>
                ) : companyName ? (
                  <span className="text-base font-semibold text-slate-900 dark:text-white">{companyName}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">{t('navigation') || 'Navigation'}</span>
                )}
              </SheetTitle>
            </SheetHeader>
            <nav className="px-2 py-2">
              <ul>
                {navItems.map((item) => {
                  const isActive = currentPath === item.to;
                  return (
                    <li key={item.id}>
                      <Link
                        to={item.id === 'dashboard' ? '/' : item.to}
                        className={`block px-3 py-2 rounded-md text-sm ${
                          isActive
                            ? 'bg-sky-500 text-white'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-sky-600 hover:text-white'
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="px-2 py-2 border-t dark:border-slate-800">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={async () => {
                  await signOut();
                  navigate('/login', { replace: true });
                }}
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex items-center min-w-0">
          {companyLogo ? (
            <>
              <img src={companyLogo} className="w-auto h-6 mr-2 object-contain" alt="Company Logo" />
              {companyName && (
                <span className="truncate font-semibold text-slate-900 dark:text-white">{companyName}</span>
              )}
            </>
          ) : companyName ? (
            <span className="truncate font-semibold text-slate-900 dark:text-white">{companyName}</span>
          ) : null}
        </div>

        <div className="w-10" />
      </div>
    </div>
  );
};

export default MobileHeader;