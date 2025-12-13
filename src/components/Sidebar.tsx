import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { t, getKeyAsPageId } from '@/utils/i18n';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthProvider';
import {
  Home, Package, ShoppingCart, DollarSign, Users, Truck, Warehouse, TrendingUp, BarChart, Settings, UploadCloud, ArrowLeftRight, Banknote, MinusCircle, ClipboardCheck, LogOut,
} from 'lucide-react';
import { Settings as SettingsType } from '@/types';

const navItems = [
  { id: 'dashboard', icon: <Home className="w-6 h-6 mr-3" /> },
  { id: 'products', icon: <Package className="w-6 h-6 mr-3" /> },
  { id: 'purchaseOrders', icon: <ShoppingCart className="w-6 h-6 mr-3" /> },
  { id: 'sellOrders', icon: <DollarSign className="w-6 h-6 mr-3" /> },
  { id: 'suppliers', icon: <Users className="w-6 h-6 mr-3" /> },
  { id: 'customers', icon: <Users className="w-6 h-6 mr-3" /> },
  { id: 'incomingPayments', icon: <DollarSign className="w-6 h-6 mr-3" /> },
  { id: 'outgoingPayments', icon: <DollarSign className="w-6 h-6 mr-3" /> },
  { id: 'warehouses', icon: <Warehouse className="w-6 h-6 mr-3" /> },
  { id: 'productMovement', icon: <ArrowLeftRight className="w-6 h-6 mr-3" /> },
  { id: 'utilization', icon: <MinusCircle className="w-6 h-6 mr-3" /> }, // New: Utilization
  { id: 'expeditorsReport', icon: <ClipboardCheck className="w-6 h-6 mr-3" /> }, // NEW
  { id: 'finance', icon: <BarChart className="w-6 h-6 mr-3" /> },
  { id: 'profitability', icon: <TrendingUp className="w-6 h-6 mr-3" /> },
  { id: 'bank', icon: <Banknote className="w-6 h-6 mr-3" /> },
  { id: 'dataImportExport', icon: <UploadCloud className="w-6 h-6 mr-3" /> },
  { id: 'settings', icon: <Settings className="w-6 h-6 mr-3" /> },
];

const Sidebar: React.FC = () => {
  const { settings } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const currentPageId = location.pathname === '/' ? 'dashboard' : getKeyAsPageId(location.pathname.substring(1));

  const companyName = settings.companyName || '';
  const companyLogo = settings.companyLogo;

  return (
    <div className="fixed top-0 left-0 h-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 w-64 p-4 z-20 sidebar border-r dark:border-slate-700 flex flex-col">
      <div className="flex-shrink-0 flex items-center mb-8">
        {companyLogo ? (
          <>
            <img src={companyLogo} className="w-auto h-8 mr-3 object-contain" alt="Company Logo" />
            {companyName && (
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{companyName}</h1>
            )}
          </>
        ) : companyName ? (
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{companyName}</h1>
        ) : null
      </div>
      <nav className="flex-grow overflow-y-auto">
        <ul>
          {navItems.map(item => {
            const pageId = getKeyAsPageId(item.id);
            const isActive = pageId === currentPageId;
            const activeClass = isActive ? 'bg-sky-500 text-white active:bg-sky-600' : 'text-slate-700 dark:text-slate-300';

            return (
              <li key={item.id} className="mb-2">
                <Link
                  to={pageId === 'dashboard' ? '/' : `/${pageId}`}
                  className={`nav-link flex items-center p-2 rounded-md hover:bg-sky-600 hover:text-white ${activeClass}`}
                >
                  {item.icon}{t(item.id as keyof typeof t)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-2 pt-2 border-t dark:border-slate-700">
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
    </div>
  );
};

export default Sidebar;