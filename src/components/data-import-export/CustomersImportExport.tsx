"use client";

import React from 'react';
import ExcelImportButton from '@/components/ExcelImportButton';
import ExcelExportButton from '@/components/ExcelExportButton';
import { toast } from 'sonner';
import { Customer } from '@/types';

interface CustomersImportExportProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  getNextId: (key: 'customers') => number;
  setNextIdForCollection: (key: 'customers', nextId: number) => void;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

const CustomersImportExport: React.FC<CustomersImportExportProps> = ({
  customers, setCustomers, getNextId, setNextIdForCollection, t
}) => {
  const handleImportCustomers = (data: any[]) => {
    const newCustomers: Customer[] = data.map((row: any) => ({
      id: getNextId('customers'),
      name: String(row['Customer Name'] || ''),
      contact: String(row['Contact Person'] || ''),
      email: String(row['Email'] || ''),
      phone: String(row['Phone'] || ''),
      address: String(row['Address'] || ''),
    }));

    setCustomers(prev => {
      const existingEmails = new Set(prev.map(c => c.email.toLowerCase()).filter(Boolean));
      const uniqueNewCustomers = newCustomers.filter(c => !c.email || !existingEmails.has(c.email.toLowerCase()));

      if (uniqueNewCustomers.length < newCustomers.length) {
        toast.info(t('excelImportInfo'), { description: t('duplicateCustomersSkipped') });
      }

      const allCustomers = [...prev, ...uniqueNewCustomers];
      const maxId = allCustomers.reduce((max, c) => Math.max(max, c.id), 0);
      setNextIdForCollection('customers', maxId + 1);
      return allCustomers;
    });
  };

  return (
    <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4">{t('customers')}</h2>
      <p className="text-gray-600 dark:text-slate-400 mb-4">
        {t('customersImportExportDescription')}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ExcelImportButton
          buttonLabel={t('importExcelFile')}
          description={t('importCustomersDescription')}
          onImport={handleImportCustomers}
          requiredColumns={['Customer Name', 'Contact Person', 'Email', 'Phone', 'Address']}
        />
        <ExcelExportButton
          buttonLabel={t('exportExcelFile')}
          data={customers}
          fileName="customers_export"
          sheetName="Customers"
          columns={[
            { header: 'ID', accessor: 'id' },
            { header: 'Customer Name', accessor: 'name' },
            { header: 'Contact Person', accessor: 'contact' },
            { header: 'Email', accessor: 'email' },
            { header: 'Phone', accessor: 'phone' },
            { header: 'Address', accessor: 'address' },
          ]}
        />
      </div>
    </div>
  );
};

export default CustomersImportExport;