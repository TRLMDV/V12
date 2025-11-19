"use client";

import React, { useState, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { MOCK_CURRENT_DATE } from '@/data/initialData'; // Corrected import
import { t } from '@/utils/i18n';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import FormModal from '@/components/FormModal';
import PaymentForm from '@/forms/PaymentForm';
import { PlusCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Ensuring this import is present
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select components
import PaginationControls from '@/components/PaginationControls'; // Import PaginationControls
import { Payment, SellOrder, BankAccount, Currency } from '@/types'; // Import types from types file
import { format } from 'date-fns'; // Import format from date-fns

type SortConfig = {
  key: keyof Payment | 'linkedOrderDisplay' | 'categoryDisplay' | 'bankAccountBalance'; // Added bankAccountBalance
  direction: 'ascending' | 'descending';
};

// Helper type for internal transaction processing
interface BankTransaction {
  id: string; // e.g., 'inc-1', 'out-5', 'initial-2'
  date: string;
  amount: number; // Amount in the account's currency
  type: 'incoming' | 'outgoing' | 'initial';
  bankAccountId: number;
  originalPaymentCurrency: Currency; // For conversion
}

const IncomingPayments: React.FC = () => {
  const { incomingPayments, sellOrders, customers, bankAccounts, deleteItem, currencyRates, settings, convertCurrency, outgoingPayments } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<number | undefined>(undefined);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'id', direction: 'ascending' });
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all'); // New state for category filter

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100; // User requested 100 items per page

  const sellOrderMap = sellOrders.reduce((acc, o) => ({ ...acc, [o.id]: o }), {} as { [key: number]: SellOrder });
  const customerMap = customers.reduce((acc, c) => ({ ...acc, [c.id]: c.name }), {} as { [key: number]: string });
  const paymentCategoryMap = useMemo(() => (settings.paymentCategories || []).reduce((acc, cat) => ({ ...acc, [cat.name]: cat.name }), {} as { [key: string]: string }), [settings.paymentCategories]);

  // Memoized map to store running balances after each transaction
  const runningBalancesMap = useMemo(() => {
    const balances = new Map<number, Map<string, number>>(); // bankAccountId -> (transactionId -> balanceAfterTransaction)

    bankAccounts.forEach(account => {
      const accountTransactions: BankTransaction[] = [];

      // Initial balance as a transaction (using epoch date to ensure it's sorted first)
      accountTransactions.push({
        id: `initial-${account.id}`,
        date: '1970-01-01', 
        amount: account.initialBalance,
        type: 'initial',
        bankAccountId: account.id,
        originalPaymentCurrency: account.currency,
      });

      // Incoming payments
      incomingPayments.forEach(p => {
        if (p.bankAccountId === account.id) {
          const amountInAccountCurrency = convertCurrency(p.amount, p.paymentCurrency, account.currency);
          accountTransactions.push({
            id: `inc-${p.id}`,
            date: p.date,
            amount: amountInAccountCurrency,
            type: 'incoming',
            bankAccountId: account.id,
            originalPaymentCurrency: p.paymentCurrency,
          });
        }
      });

      // Outgoing payments
      outgoingPayments.forEach(p => {
        if (p.bankAccountId === account.id) {
          const amountInAccountCurrency = convertCurrency(p.amount, p.paymentCurrency, account.currency);
          accountTransactions.push({
            id: `out-${p.id}`,
            date: p.date,
            amount: amountInAccountCurrency,
            type: 'outgoing',
            bankAccountId: account.id,
            originalPaymentCurrency: p.paymentCurrency,
          });
        }
      });

      // Sort all transactions for this account by date, then by type (initial -> incoming -> outgoing)
      accountTransactions.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA !== dateB) return dateA - dateB;
        const typeOrder = { 'initial': 0, 'incoming': 1, 'outgoing': 2 };
        return typeOrder[a.type] - typeOrder[b.type];
      });

      let currentRunningBalance = 0;
      const accountBalances = new Map<string, number>();

      accountTransactions.forEach(t => {
        if (t.type === 'initial') {
          currentRunningBalance = t.amount;
        } else if (t.type === 'incoming') {
          currentRunningBalance += t.amount;
        } else if (t.type === 'outgoing') {
          currentRunningBalance -= t.amount;
        }
        accountBalances.set(t.id, currentRunningBalance);
      });
      balances.set(account.id, accountBalances);
    });
    return balances;
  }, [bankAccounts, incomingPayments, outgoingPayments, convertCurrency]);


  // Aggregate payments by order ID and specific category (products) in AZN
  const paymentsByOrderAndCategoryAZN = useMemo(() => {
    const result: {
      [orderId: number]: {
        products: number;
      };
    } = {};

    incomingPayments.forEach(p => {
      if (p.orderId !== 0 && p.paymentCategory === 'products') { // Only 'products' category for linked sell orders
        if (!result[p.orderId]) {
          result[p.orderId] = { products: 0 };
        }
        const amountInAZN = p.amount * (p.paymentCurrency === 'AZN' ? 1 : (p.paymentExchangeRate || currencyRates[p.paymentCurrency] || 1));
        result[p.orderId].products += amountInAZN;
      }
    });
    return result;
  }, [incomingPayments, currencyRates]);

  const filteredAndSortedPayments = useMemo(() => {
    let currentPayments = incomingPayments;

    // 1. Apply date filters
    if (startDateFilter) {
      currentPayments = currentPayments.filter(p => p.date >= startDateFilter);
    }
    if (endDateFilter) {
      currentPayments = currentPayments.filter(p => p.date <= endDateFilter);
    }

    // 2. Add derived properties like categoryDisplay and remainingAmountText
    const paymentsWithDerivedProps = currentPayments.map(p => {
      let linkedOrderDisplay = '';
      let remainingAmountText = '';
      let rowClass = 'border-b dark:border-slate-700 text-gray-800 dark:text-slate-300';
      let categoryDisplay = '';
      
      const linkedBankAccount = bankAccounts.find(acc => acc.id === p.bankAccountId);
      const balanceAfterThisPayment = runningBalancesMap.get(p.bankAccountId)?.get(`inc-${p.id}`);


      if (p.orderId === 0) {
        categoryDisplay = p.paymentCategory && paymentCategoryMap[p.paymentCategory] ? p.paymentCategory : t('manualExpense');
        linkedOrderDisplay = `${categoryDisplay} ${p.manualDescription ? `- ${p.manualDescription}` : ''}`;
      } else {
        const order = sellOrderMap[p.orderId];
        const customerName = order ? customerMap[order.contactId] || 'Unknown' : 'N/A';
        
        // For incoming payments linked to sell orders, the category is always 'products'
        categoryDisplay = t('paymentForProducts');
        linkedOrderDisplay = `${t('orderId')} #${p.orderId} (${customerName}) ${categoryDisplay}`;

        if (order) {
          const totalPaidForThisOrderInAZN = paymentsByOrderAndCategoryAZN[p.orderId]?.products || 0;
          const orderTotal = order.total;
          const currentRemainingBalanceInAZN = orderTotal - totalPaidForThisOrderInAZN;

          const isFullyPaid = currentRemainingBalanceInAZN <= 0.001;

          if (isFullyPaid) {
            rowClass += ' bg-green-100 dark:bg-green-900/50';
            remainingAmountText = `<span class="text-xs text-green-700 dark:text-green-400 ml-1">(${t('fullyPaid')})</span>`;
          } else {
            rowClass += ' bg-red-100 dark:bg-red-900/50';
            remainingAmountText = `<span class="text-xs text-red-600 dark:text-red-400 ml-1">(${currentRemainingBalanceInAZN.toFixed(2)} AZN ${t('remaining')})</span>`;
          }
        }
      }
      return { 
        ...p, 
        linkedOrderDisplay, 
        remainingAmountText, 
        rowClass, 
        categoryDisplay,
        bankAccountBalance: balanceAfterThisPayment, // Use the calculated running balance
        bankAccountCurrency: linkedBankAccount?.currency,
      };
    });

    // 3. Apply category filter to the processed payments
    let finalFilteredPayments = paymentsWithDerivedProps;
    if (categoryFilter !== 'all') {
      finalFilteredPayments = finalFilteredPayments.filter(p => p.categoryDisplay === categoryFilter);
    }

    // 4. Apply sorting
    if (sortConfig.key) {
      finalFilteredPayments.sort((a, b) => {
        const key = sortConfig.key;
        const valA = a[key] === undefined ? '' : a[key];
        const valB = b[key] === undefined ? '' : b[key];

        let comparison = 0;
        if (typeof valA === 'string' || typeof valB === 'string') {
          comparison = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
        } else {
          if (valA < valB) comparison = -1;
          if (valA > valB) comparison = 1;
        }
        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }
    return finalFilteredPayments;
  }, [incomingPayments, startDateFilter, endDateFilter, categoryFilter, sellOrderMap, customerMap, paymentsByOrderAndCategoryAZN, currencyRates, paymentCategoryMap, sortConfig, t, runningBalancesMap, bankAccounts]);

  // Get all unique categories for the filter dropdown
  const allUniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    incomingPayments.forEach(p => {
      if (p.orderId === 0) {
        // For manual payments, use the custom category name or 'Manual Expense' if none
        const manualCategoryName = p.paymentCategory && p.paymentCategory !== 'manual' ? p.paymentCategory : t('manualExpense');
        categories.add(manualCategoryName);
      } else if (p.paymentCategory === 'products') { // Only 'products' for linked incoming payments
        categories.add(t('paymentForProducts'));
      }
    });
    return Array.from(categories).sort();
  }, [incomingPayments, t]);

  // Apply pagination to the filtered and sorted payments
  const paginatedPayments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedPayments.slice(startIndex, endIndex);
  }, [filteredAndSortedPayments, currentPage, itemsPerPage]);

  const requestSort = (key: SortConfig['key']) => {
    let direction: SortConfig['direction'] = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleAddPayment = () => {
    setEditingPaymentId(undefined);
    setIsModalOpen(true);
  };

  const handleEditPayment = (id: number) => {
    setEditingPaymentId(id);
    setIsModalOpen(true);
  };

  const handleDeletePayment = (id: number) => {
    deleteItem('incomingPayments', id);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingPaymentId(undefined);
  };

  const getSortIndicator = (key: SortConfig['key']) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    }
    return '';
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-200">{t('incomingPayments')}</h1>
        <Button onClick={handleAddPayment}>
          <PlusCircle className="w-4 h-4 mr-2" />
          {t('addPayment')}
        </Button>
      </div>

      <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="incoming-start-date-filter" className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('startDate')}</Label>
            <Input
              type="date"
              id="incoming-start-date-filter"
              value={startDateFilter}
              onChange={(e) => {
                setStartDateFilter(e.target.value);
                setCurrentPage(1); // Reset to first page on filter change
              }}
              className="mt-1 w-full p-2 border rounded-md shadow-sm bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
          </div>
          <div>
            <Label htmlFor="incoming-end-date-filter" className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('endDate')}</Label>
            <Input
              type="date"
              id="incoming-end-date-filter"
              value={endDateFilter}
              onChange={(e) => {
                setEndDateFilter(e.target.value);
                setCurrentPage(1); // Reset to first page on filter change
              }}
              className="mt-1 w-full p-2 border rounded-md shadow-sm bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
          </div>
          <div>
            <Label htmlFor="category-filter" className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('filterByCategory')}</Label>
            <Select onValueChange={(value) => {
              setCategoryFilter(value);
              setCurrentPage(1); // Reset to first page on filter change
            }} value={categoryFilter}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder={t('allCategories')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allCategories')}</SelectItem>
                {allUniqueCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100 dark:bg-slate-700">
              <TableHead className="p-3">No.</TableHead>{/* New: Numbering column */}
              <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={() => requestSort('id')}>
                {t('paymentId')} {getSortIndicator('id')}
              </TableHead>
              <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={() => requestSort('linkedOrderDisplay')}>
                {t('linkedOrder')} / {t('manualExpense')} {getSortIndicator('linkedOrderDisplay')}
              </TableHead>
              <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={() => requestSort('categoryDisplay')}>
                {t('category')} {getSortIndicator('categoryDisplay')}
              </TableHead>
              <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={() => requestSort('date')}>
                {t('paymentDate')} {getSortIndicator('date')}
              </TableHead>
              <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={() => requestSort('amount')}>
                {t('amountPaid')} {getSortIndicator('amount')}
              </TableHead>
              <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={() => requestSort('method')}>
                {t('method')} {getSortIndicator('method')}
              </TableHead>
              <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={() => requestSort('bankAccountBalance')}>
                {t('bankAccountBalance')} {getSortIndicator('bankAccountBalance')}
              </TableHead>
              <TableHead className="p-3">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPayments.length > 0 ? (
              paginatedPayments.map((p, index) => {
                return (
                  <TableRow key={p.id} className={p.rowClass}>
                    <TableCell className="p-3 font-semibold">{(currentPage - 1) * itemsPerPage + index + 1}.</TableCell>{/* New: Numbering cell */}
                    <TableCell className="p-3 font-semibold">
                      #{p.id}
                    </TableCell>
                    <TableCell className="p-3">{p.linkedOrderDisplay}</TableCell>
                    <TableCell className="p-3">{p.categoryDisplay}</TableCell>
                    <TableCell className="p-3">{p.date}</TableCell>
                    <TableCell className="p-3 font-bold">
                      {p.amount.toFixed(2)} {p.paymentCurrency} <span dangerouslySetInnerHTML={{ __html: p.remainingAmountText }} />
                    </TableCell>
                    <TableCell className="p-3">{p.method}</TableCell>
                    <TableCell className={`p-3 font-bold ${p.bankAccountBalance && p.bankAccountBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {p.bankAccountBalance !== undefined ? `${p.bankAccountBalance.toFixed(2)} ${p.bankAccountCurrency}` : 'N/A'}
                    </TableCell>
                    <TableCell className="p-3">
                      <Button variant="link" onClick={() => handleEditPayment(p.id)} className="mr-2 p-0 h-auto">
                        {t('edit')}
                      </Button>
                      <Button variant="link" onClick={() => handleDeletePayment(p.id)} className="text-red-500 p-0 h-auto">
                        {t('delete')}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="p-4 text-center text-gray-500 dark:text-slate-400">
                  {t('noItemsFound')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <PaginationControls
        totalItems={filteredAndSortedPayments.length}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      <FormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={editingPaymentId ? t('editIncomingPayment') : t('createIncomingPayment')}
      >
        <PaymentForm paymentId={editingPaymentId} type="incoming" onSuccess={handleModalClose} />
      </FormModal>
    </div>
  );
};

export default IncomingPayments;