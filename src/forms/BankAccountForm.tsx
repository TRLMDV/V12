"use client";

import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { MOCK_CURRENT_DATE } from '@/data/initialData'; // Corrected import
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { t } from '@/utils/i18n';
import { BankAccount, Currency } from '@/types';

const ALL_CURRENCIES: Currency[] = [
  'AZN', 'USD', 'EUR', 'RUB', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'CNY', 'KWD', 'BHD', 'OMR', 'JOD', 'GIP', 'KYD', 'KRW', 'SGD', 'INR', 'MXN', 'SEK', 'THB', 'AFN', 'ALL', 'DZD', 'AOA', 'XCD', 'ARS', 'AMD', 'AWG', 'SHP', 'BSD', 'BDT', 'BBD', 'BYN', 'BZD', 'XOF', 'BMD', 'BTN', 'BOB', 'BAM', 'BWP', 'BRL', 'BND', 'BGN', 'BIF', 'KHR', 'XAF', 'CVE', 'CDF', 'KMF', 'NZD', 'CRC', 'CUP', 'XCG', 'CZK', 'DKK', 'DJF', 'DOP', 'EGP', 'ERN', 'SZL', 'ZAR', 'ETB', 'FKP', 'FJD', 'XPF', 'GMD', 'GEL', 'GHS', 'GTQ', 'GNF', 'GYD', 'HTG', 'HNL', 'HKD', 'HUF', 'ISK', 'IDR', 'IRR', 'IQD', 'ILS', 'JMD', 'KZT', 'KES', 'KPW', 'KGS', 'LAK', 'LBP', 'LSL', 'LRD', 'LYD', 'MDL', 'MOP', 'MGA', 'MWK', 'MYR', 'MVR', 'MRU', 'MZN', 'MMK', 'NAD', 'NPR', 'NIO', 'NGN', 'NOK', 'PKR', 'PGK', 'PYG', 'PEN', 'PHP', 'PLN', 'QAR', 'RON', 'RSD', 'SCR', 'SLE', 'SBD', 'SOS', 'SSP', 'STN', 'SRD', 'SYP', 'TWD', 'TJS', 'TZS', 'TTD', 'TND', 'TRY', 'TMT', 'UGX', 'UAH', 'AED', 'UYU', 'UZS', 'VUV', 'VES', 'VED', 'VND', 'YER', 'ZMW', 'ZWG'
];

interface BankAccountFormProps {
  bankAccountId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const BankAccountForm: React.FC<BankAccountFormProps> = ({ bankAccountId, onSuccess, onCancel }) => {
  const { bankAccounts, saveItem, showAlertModal, settings } = useData();
  const isEdit = bankAccountId !== undefined;

  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<Currency>(settings.mainCurrency);
  const [initialBalance, setInitialBalance] = useState('0.00');
  const [creationDate, setCreationDate] = useState(MOCK_CURRENT_DATE.toISOString().slice(0, 10)); // New state for creation date

  useEffect(() => {
    if (isEdit) {
      const existingAccount = bankAccounts.find(acc => acc.id === bankAccountId);
      if (existingAccount) {
        setName(existingAccount.name);
        setCurrency(existingAccount.currency);
        setInitialBalance(String(existingAccount.initialBalance));
        setCreationDate(existingAccount.creationDate || MOCK_CURRENT_DATE.toISOString().slice(0, 10)); // Load existing date or default
      }
    } else {
      setName('');
      setCurrency(settings.mainCurrency);
      setInitialBalance('0.00');
      setCreationDate(MOCK_CURRENT_DATE.toISOString().slice(0, 10)); // Default to current date for new accounts
    }
  }, [bankAccountId, isEdit, bankAccounts, settings.mainCurrency]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("BankAccountForm: handleSubmit triggered.");

    if (!name.trim()) {
      console.log("BankAccountForm: Validation failed - name required.");
      showAlertModal(t('validationError'), t('bankAccountNameRequired'));
      return;
    }
    if (!currency) {
      console.log("BankAccountForm: Validation failed - currency required.");
      showAlertModal(t('validationError'), t('bankAccountCurrencyRequired'));
      return;
    }
    const parsedInitialBalance = parseFloat(initialBalance);
    if (isNaN(parsedInitialBalance)) {
      console.log("BankAccountForm: Validation failed - invalid initial balance.");
      showAlertModal(t('validationError'), t('invalidInitialBalance'));
      return;
    }
    if (!creationDate) {
      showAlertModal(t('validationError'), t('bankAccountCreationDateRequired'));
      return;
    }

    const accountToSave: BankAccount = {
      id: bankAccountId || 0, // ID will be handled by saveItem if new
      name: name.trim(),
      currency: currency,
      initialBalance: parsedInitialBalance,
      creationDate: creationDate, // Save the creation date
    };

    console.log("BankAccountForm: Calling saveItem with:", accountToSave);
    saveItem('bankAccounts', accountToSave);
    console.log("BankAccountForm: saveItem called, calling onSuccess.");
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="accountName" className="text-right">
            {t('bankAccountName')}
          </Label>
          <Input
            id="accountName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="col-span-3"
            required
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="currency" className="text-right">
            {t('currency')}
          </Label>
          <Select onValueChange={(value: Currency) => setCurrency(value)} value={currency}>
            <SelectTrigger id="currency" className="col-span-3">
              <SelectValue placeholder={t('selectCurrency')} />
            </SelectTrigger>
            <SelectContent>
              {ALL_CURRENCIES.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="creationDate" className="text-right">
            {t('creationDate')}
          </Label>
          <Input
            id="creationDate"
            type="date"
            value={creationDate}
            onChange={(e) => setCreationDate(e.target.value)}
            className="col-span-3"
            required
          />
        </div>
        {!isEdit && ( // Only show initial balance for new accounts
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="initialBalance" className="text-right">
              {t('initialBalance')}
            </Label>
            <Input
              id="initialBalance"
              type="number"
              step="0.01"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('cancel')}
        </Button>
        <Button type="submit">{t('saveBankAccount')}</Button>
      </div>
    </form>
  );
};

export default BankAccountForm;