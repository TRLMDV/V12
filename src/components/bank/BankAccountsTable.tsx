"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { t } from '@/utils/i18n';
import { BankAccount, Payment } from '@/types';

interface BankAccountsTableProps {
  bankAccounts: BankAccount[];
  runningBalancesMap: Map<number, Map<string, number>>;
  incomingPayments: Payment[]; // Needed for current balance calculation
  handleViewTransactions: (id: number) => void;
  handleEditAccount: (id: number) => void;
  handleDeleteAccount: (id: number) => void;
}

const BankAccountsTable: React.FC<BankAccountsTableProps> = ({
  bankAccounts,
  runningBalancesMap,
  incomingPayments,
  handleViewTransactions,
  handleEditAccount,
  handleDeleteAccount,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md overflow-x-auto mb-6">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4">{t('yourBankAccounts')}</h2>
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-100 dark:bg-slate-700">
            <TableHead className="p-3">No.</TableHead>
            <TableHead className="p-3">{t('accountName')}</TableHead>
            <TableHead className="p-3">{t('currency')}</TableHead>
            <TableHead className="p-3 text-right">{t('currentBalance')}</TableHead>
            <TableHead className="p-3 text-right">{t('actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bankAccounts.length > 0 ? (
            bankAccounts.map((account, index) => (
              <TableRow key={account.id} className="border-b dark:border-slate-700 text-gray-800 dark:text-slate-300">
                <TableCell className="p-3 font-semibold">{index + 1}.</TableCell>
                <TableCell className="p-3 font-semibold">{account.name}</TableCell>
                <TableCell className="p-3">{account.currency}</TableCell>
                <TableCell className={`p-3 text-right font-bold ${
                  // This logic needs to correctly fetch the latest balance from runningBalancesMap
                  // The runningBalancesMap stores balances after each transaction.
                  // To get the *current* balance, we need the last entry for this account.
                  (() => {
                    const accountBalances = runningBalancesMap.get(account.id);
                    if (accountBalances && accountBalances.size > 0) {
                      const lastTransactionId = Array.from(accountBalances.keys()).pop();
                      if (lastTransactionId) {
                        return (accountBalances.get(lastTransactionId) || 0) >= 0 ? 'text-green-600' : 'text-red-600';
                      }
                    }
                    return account.initialBalance >= 0 ? 'text-green-600' : 'text-red-600';
                  })()
                }`}>
                  {(() => {
                    const accountBalances = runningBalancesMap.get(account.id);
                    if (accountBalances && accountBalances.size > 0) {
                      const lastTransactionId = Array.from(accountBalances.keys()).pop();
                      if (lastTransactionId) {
                        return `${(accountBalances.get(lastTransactionId) || 0).toFixed(2)} ${account.currency}`;
                      }
                    }
                    return `${account.initialBalance.toFixed(2)} ${account.currency}`;
                  })()}
                </TableCell>
                <TableCell className="p-3 text-right">
                  <Button variant="link" onClick={() => handleViewTransactions(account.id)} className="mr-2 p-0 h-auto">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="link" onClick={() => handleEditAccount(account.id)} className="mr-2 p-0 h-auto">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="link" onClick={() => handleDeleteAccount(account.id)} className="text-red-500 p-0 h-auto">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="p-4 text-center text-gray-500 dark:text-slate-400">
                {t('noBankAccountsFound')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default BankAccountsTable;