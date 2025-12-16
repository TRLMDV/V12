"use client";

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import PaginationControls from '@/components/PaginationControls';

type ExpenseItem = {
  id: number;
  date: string;
  description: string;
  category: string;
  amount: number;
  currency: string;
  amountMain: number;
};

// NEW: sort configuration type
type SortKey = 'date' | 'category' | 'description' | 'amount';
type SortDirection = 'ascending' | 'descending';
interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

interface ExpensesListModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: ExpenseItem[];
  mainCurrency: string;
}

const ExpensesListModal: React.FC<ExpensesListModalProps> = ({ isOpen, onClose, expenses, mainCurrency }) => {
  // NEW: pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  // NEW: sorting state
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'ascending' });

  const requestSort = (key: SortKey) => {
    setSortConfig(prev => {
      // Reset to first page when sorting changes
      setCurrentPage(1);
      if (prev.key === key) {
        return { key, direction: prev.direction === 'ascending' ? 'descending' : 'ascending' };
      }
      return { key, direction: 'ascending' };
    });
  };

  const getSortIndicator = (key: SortKey) => {
    if (sortConfig.key !== key) return '';
    return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
  };

  // NEW: sorted expenses based on sortConfig
  const sortedExpenses = useMemo(() => {
    const list = [...expenses];
    list.sort((a, b) => {
      let comparison = 0;
      switch (sortConfig.key) {
        case 'date': {
          comparison = parseISO(a.date).getTime() - parseISO(b.date).getTime();
          break;
        }
        case 'category': {
          comparison = (a.category || '').localeCompare(b.category || '', undefined, { sensitivity: 'base' });
          break;
        }
        case 'description': {
          comparison = (a.description || '').localeCompare(b.description || '', undefined, { sensitivity: 'base' });
          break;
        }
        case 'amount': {
          comparison = (a.amount || 0) - (b.amount || 0);
          break;
        }
        default:
          comparison = 0;
      }
      return sortConfig.direction === 'ascending' ? comparison : -comparison;
    });
    return list;
  }, [expenses, sortConfig]);

  // NEW: paginated slice
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExpenses = useMemo(() => {
    return sortedExpenses.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedExpenses, startIndex, itemsPerPage]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Expenses</DialogTitle>
          <DialogDescription>All outgoing payment expenses for the selected period.</DialogDescription>
        </DialogHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100 dark:bg-slate-700">
                <TableHead
                  className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600"
                  onClick={() => requestSort('date')}
                >
                  Date{getSortIndicator('date')}
                </TableHead>
                <TableHead
                  className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600"
                  onClick={() => requestSort('category')}
                >
                  Category{getSortIndicator('category')}
                </TableHead>
                <TableHead
                  className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600"
                  onClick={() => requestSort('description')}
                >
                  Description{getSortIndicator('description')}
                </TableHead>
                <TableHead
                  className="p-3 text-right cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600"
                  onClick={() => requestSort('amount')}
                >
                  Amount{getSortIndicator('amount')}
                </TableHead>
                <TableHead className="p-3 text-right">Converted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedExpenses.length > 0 ? (
                paginatedExpenses.map((e) => (
                  <TableRow key={e.id} className="border-b dark:border-slate-700">
                    <TableCell className="p-3">{format(parseISO(e.date), 'yyyy-MM-dd HH:mm')}</TableCell>
                    <TableCell className="p-3">{e.category}</TableCell>
                    <TableCell className="p-3">{e.description || '-'}</TableCell>
                    <TableCell className="p-3 text-right font-medium">
                      {e.amount.toFixed(2)} {e.currency}
                    </TableCell>
                    <TableCell className="p-3 text-right font-semibold">
                      {e.amountMain.toFixed(2)} {mainCurrency}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="p-4 text-center text-gray-500 dark:text-slate-400">
                    No expenses found for this period.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4">
          <PaginationControls
            totalItems={sortedExpenses.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExpensesListModal;