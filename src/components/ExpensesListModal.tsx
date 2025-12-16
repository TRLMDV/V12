"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';

type ExpenseItem = {
  id: number;
  date: string;
  description: string;
  category: string;
  amount: number;
  currency: string;
  amountMain: number;
};

interface ExpensesListModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: ExpenseItem[];
  mainCurrency: string;
}

const ExpensesListModal: React.FC<ExpensesListModalProps> = ({ isOpen, onClose, expenses, mainCurrency }) => {
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
                <TableHead className="p-3">Date</TableHead>
                <TableHead className="p-3">Category</TableHead>
                <TableHead className="p-3">Description</TableHead>
                <TableHead className="p-3 text-right">Amount</TableHead>
                <TableHead className="p-3 text-right">Converted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.length > 0 ? (
                expenses.map((e) => (
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
      </DialogContent>
    </Dialog>
  );
};

export default ExpensesListModal;