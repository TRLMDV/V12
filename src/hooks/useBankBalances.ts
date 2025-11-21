"use client";

import { useMemo } from 'react';
import { BankAccount, Currency, Payment } from '@/types';

// Helper type for internal transaction processing
interface BankTransactionForRunningBalance {
  id: string; // e.g., 'inc-1', 'out-5', 'initial-2'
  date: string;
  amount: number; // Amount in the account's currency
  type: 'incoming' | 'outgoing' | 'initial';
  bankAccountId: number;
  originalPaymentCurrency: Currency; // For conversion
  originalPaymentAmount: number; // For conversion
}

interface UseBankBalancesProps {
  bankAccounts: BankAccount[];
  incomingPayments: Payment[];
  outgoingPayments: Payment[];
  convertCurrency: (amount: number, fromCurrency: Currency, toCurrency: Currency) => number;
}

export function useBankBalances({ bankAccounts, incomingPayments, outgoingPayments, convertCurrency }: UseBankBalancesProps) {
  const runningBalancesMap = useMemo(() => {
    const balances = new Map<number, Map<string, number>>(); // bankAccountId -> (transactionId -> balanceAfterTransaction)

    bankAccounts.forEach(account => {
      const accountTransactions: BankTransactionForRunningBalance[] = [];

      // Initial balance as a transaction (using epoch date to ensure it's sorted first)
      accountTransactions.push({
        id: `initial-${account.id}`,
        date: '1970-01-01', 
        amount: account.initialBalance,
        type: 'initial',
        bankAccountId: account.id,
        originalPaymentCurrency: account.currency,
        originalPaymentAmount: account.initialBalance,
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
            originalPaymentAmount: p.amount,
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
            originalPaymentAmount: p.amount,
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

  return {
    runningBalancesMap,
  };
}