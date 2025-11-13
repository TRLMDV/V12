"use client";

import React from 'react';
import ExcelImportButton from '@/components/ExcelImportButton';
import ExcelExportButton from '@/components/ExcelExportButton';
import { toast } from 'sonner';
import { Supplier } from '@/types';

interface SuppliersImportExportProps {
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  getNextId: (key: 'suppliers') => number;
  setNextIdForCollection: (key: 'suppliers', nextId: number) => void;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

const SuppliersImportExport: React.FC<SuppliersImportExportProps> = ({
  suppliers, setSuppliers, getNextId, setNextIdForCollection, t
}) => {
  const handleImportSuppliers = (data: any[]) => {
    const newSuppliers: Supplier[] = data.map((row: any) => ({
      id: getNextId('suppliers'),
      name: String(row['Supplier Name'] || ''),
      contact: String(row['Contact Person'] || ''),
      email: String(row['Email'] || ''),
      phone: String(row['Phone'] || ''),
      address: String(row['Address'] || ''),
    }));

    setSuppliers(prev => {
      const existingEmails = new Set(prev.map(s => s.email.toLowerCase()).filter(Boolean));
      const uniqueNewSuppliers = newSuppliers.filter(s => !s.email || !existingEmails.has(s.email.toLowerCase()));

      if (uniqueNewSuppliers.length < newSuppliers.length) {
        toast.info(t('excelImportInfo'), { description: t('duplicateSuppliersSkipped') });
      }

      const allSuppliers = [...prev, ...uniqueNewSuppliers];
      const maxId = allSuppliers.reduce((max, s) => Math.max(max, s.id), 0);
      setNextIdForCollection('suppliers', maxId + 1);
      return allSuppliers;
    });
  };

  return (
    <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4">{t('suppliers')}</h2>
      <p className="text-gray-600 dark:text-slate-400 mb-4">
        {t('suppliersImportExportDescription')}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ExcelImportButton
          buttonLabel={t('importExcelFile')}
          description={t('importSuppliersDescription')}
          onImport={handleImportSuppliers}
          requiredColumns={['Supplier Name', 'Contact Person', 'Email', 'Phone', 'Address']}
        />
        <ExcelExportButton
          buttonLabel={t('exportExcelFile')}
          data={suppliers}
          fileName="suppliers_export"
          sheetName="Suppliers"
          columns={[
            { header: 'ID', accessor: 'id' },
            { header: 'Supplier Name', accessor: 'name' },
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

export default SuppliersImportExport;