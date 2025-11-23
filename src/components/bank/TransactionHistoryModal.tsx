"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import FormModal from '@/components/FormModal';
import PaginationControls from '@/components/PaginationControls';
import ExcelExportButton from '@/components/ExcelExportButton';
import { format } from 'date-fns';
import { t } from '@/utils/i18n';
import { BankAccount, Currency } from '@/types';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'incoming' | 'outgoing' | 'initial';
  originalPaymentId: number;
  originalPaymentCurrency: Currency;
  originalPaymentAmount: number;
  runningBalance?: number;
}

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAccountName: string;
  selectedAccountCurrency: Currency;
  startDateFilter: string;
  setStartDateFilter: (date: string) => void;
  endDateFilter: string;
  setEndDateFilter: (date: string) => void;
  currentAccountBalance: number;
  excelExportData: any[];
  paginatedTransactions: Transaction[];
  totalTransactions: number;
  transactionsCurrentPage: number;
  setTransactionsCurrentPage: (page: number) => void;
  transactionsItemsPerPage: number;
}

const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({
  isOpen,
  onClose,
  selectedAccountName,
  selectedAccountCurrency,
  startDateFilter,
  setStartDateFilter,
  endDateFilter,
  setEndDateFilter,
  currentAccountBalance,
  excelExportData,
  paginatedTransactions,
  totalTransactions,
  transactionsCurrentPage,
  setTransactionsCurrentPage,
  transactionsItemsPerPage,
}) => {
  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t('transactionHistory')} - ${selectedAccountName} (${selectedAccountCurrency})`}
    >
      <div className="mb-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <Label htmlFor="bank-start-date-filter" className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('startDate')}</Label>
            <Input
              type="date"
              id="bank-start-date-filter"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="mt-1 w-full p-2 border rounded-md shadow-sm bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
          </div>
          <div>
            <Label htmlFor="bank-end-date-filter" className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('endDate')}</Label>
            <Input
              type="date"
              id="bank-end-date-filter"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="mt-1 w-full p-2 border rounded-md shadow-sm bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
          </div>
        </div>
        <div className="text-right mt-4">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300">{t('currentBalance')}</h2>
          <p className={`text-3xl font-bold mt-2 ${currentAccountBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {currentAccountBalance.toFixed(2)} {selectedAccountCurrency}
          </p>
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <ExcelExportButton
          buttonLabel={t('exportTransactionsToExcel')}
          data={excelExportData}
          fileName={`${selectedAccountName || 'Bank Transactions'}_transactions`}
          sheetName="Transactions"
          columns={[
            { header: t('date'), accessor: 'Date' },
            { header: t('description'), accessor: 'Description' },
            { header: t('incoming'), accessor: 'Incoming' },
            { header: t('outgoing'), accessor: 'Outgoing' },
            { header: t('balance'), accessor: 'Balance' },
          ]}
        />
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100 dark:bg-slate-700">
              <TableHead className="p-3">No.</TableHead>
              <TableHead className="p-3">{t('date')}</TableHead>
              <TableHead className="p-3">{t('description')}</TableHead>
              <TableHead className="p-3 text-right">{t('incoming')}</TableHead>
              <TableHead className="p-3 text-right">{t('outgoing')}</TableHead>
              <TableHead className="p-3 text-right">{t('balance')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTransactions.length > 0 ? (
              paginatedTransactions.map((t, index) => (
                <TableRow key={t.id} className="border-b dark:border-slate-700 text-gray-800 dark:text-slate-300">
                  <TableCell className="p-3 font-semibold">{(transactionsCurrentPage - 1) * transactionsItemsPerPage + index + 1}.</TableCell>
                  <TableCell className="p-3">{format(new Date(t.date), 'yyyy-MM-dd')}</TableCell>
                  <TableCell className="p-3">{t.description}</TableCell>
                  <TableCell className="p-3 text-right text-green-600">
                    {(t.type === 'incoming' || t.type === 'initial') ? t.amount.toFixed(2) : '-'} {((t.type === 'incoming' || t.type === 'initial') && t.amount > 0) ? selectedAccountCurrency : ''}
                  </TableCell>
                  <TableCell className="p-3 text-right text-red-600">
                    {t.type === 'outgoing' ? t.amount.toFixed(2) : '-'} {((t.type === 'outgoing') && t.amount > 0) ? selectedAccountCurrency : ''}
                  </TableCell>
                  <TableCell className={`p-3 text-right font-bold ${t.runningBalance && t.runningBalance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {t.runningBalance?.toFixed(2) || '0.00'} {selectedAccountCurrency}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="p-4 text-center text-gray-500 dark:text-slate-400">
                  {t('noTransactionsFound')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <PaginationControls
        totalItems={totalTransactions}
        itemsPerPage={transactionsItemsPerPage}
        currentPage={transactionsCurrentPage}
        onPageChange={setTransactionsCurrentPage}
      />
    </FormModal>
  );
};

export default TransactionHistoryModal;