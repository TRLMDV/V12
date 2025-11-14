"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { QuickButton, QuickButtonAction, QuickButtonSize } from '@/types';
import { t } from '@/utils/i18n';
import {
  ShoppingCart, DollarSign, Package, Users, ArrowLeftRight, Warehouse, Banknote, MinusCircle, PlusCircle,
} from 'lucide-react';

interface QuickButtonsGridProps {
  quickButtons: QuickButton[];
}

const QuickButtonsGrid: React.FC<QuickButtonsGridProps> = ({ quickButtons }) => {
  const getPathForAction = (action: QuickButtonAction): string => {
    switch (action) {
      case 'addPurchaseOrder': return '/purchase-orders';
      case 'addSellOrder': return '/sell-orders';
      case 'addProductMovement': return '/product-movement';
      case 'addProduct': return '/products';
      case 'addSupplier': return '/suppliers';
      case 'addCustomer': return '/customers';
      case 'addIncomingPayment': return '/incoming-payments';
      case 'addOutgoingPayment': return '/outgoing-payments';
      case 'addWarehouse': return '/warehouses';
      case 'addUtilizationOrder': return '/utilization';
      case 'bankDeposit': return '/bank'; // Bank page will handle deposit via form
      case 'bankWithdrawal': return '/bank'; // Bank page will handle withdrawal via form
      default: return '/';
    }
  };

  const getIconForAction = (action: QuickButtonAction) => {
    const iconClass = "w-6 h-6";
    switch (action) {
      case 'addPurchaseOrder': return <ShoppingCart className={iconClass} />;
      case 'addSellOrder': return <DollarSign className={iconClass} />;
      case 'addProductMovement': return <ArrowLeftRight className={iconClass} />;
      case 'addProduct': return <Package className={iconClass} />;
      case 'addSupplier': return <Users className={iconClass} />;
      case 'addCustomer': return <Users className={iconClass} />;
      case 'addIncomingPayment': return <Banknote className={iconClass} />;
      case 'addOutgoingPayment': return <MinusCircle className={iconClass} />;
      case 'addWarehouse': return <Warehouse className={iconClass} />;
      case 'addUtilizationOrder': return <MinusCircle className={iconClass} />;
      case 'bankDeposit': return <PlusCircle className={iconClass} />;
      case 'bankWithdrawal': return <MinusCircle className={iconClass} />;
      default: return <PlusCircle className={iconClass} />;
    }
  };

  const getSizeClasses = (size: QuickButtonSize) => {
    switch (size) {
      case 'sm': return 'w-20 h-20 p-2 text-sm'; // Smaller fixed size
      case 'md': return 'w-28 h-28 p-3 text-base'; // Medium fixed size
      case 'lg': return 'w-36 h-36 p-4 text-lg'; // Larger fixed size
      default: return 'w-28 h-28 p-3 text-base'; // Default to medium
    }
  };

  return (
    <div className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4">{t('quickButtons')}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {quickButtons.map(button => (
          <Link key={button.id} to={getPathForAction(button.action)} className="block">
            <Button
              // Removed w-full h-full aspect-square to allow getSizeClasses to control dimensions
              className={`flex flex-col items-center justify-center rounded-lg shadow-md transition-all duration-200 ${button.color} text-white ${getSizeClasses(button.size)}`}
            >
              {getIconForAction(button.action)}
              <span className="mt-2 text-center font-medium">{button.label}</span>
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default QuickButtonsGrid;