"use client";

import React, { useState, useMemo } from 'react';
import { useData, MOCK_CURRENT_DATE } from '@/context/DataContext';
import { t } from '@/utils/i18n';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import FormModal from '@/components/FormModal';
import CustomerForm from '@/forms/CustomerForm';
import { PlusCircle } from 'lucide-react';
import PaginationControls from '@/components/PaginationControls'; // Import PaginationControls
import { Customer } from '@/types'; // Import types from types file

type SortConfig = {
  key: keyof Customer | 'defaultWarehouseName';
  direction: 'ascending' | 'descending';
};

const Customers: React.FC = () => {
  const { customers, warehouses, deleteItem } = useData(); // Get warehouses for mapping
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<number | undefined>(undefined);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'ascending' });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100; // User requested 100 items per page

  const warehouseMap = useMemo(() => {
    return warehouses.reduce((acc, w) => ({ ...acc, [w.id]: w.name }), {} as { [key: number]: string });
  }, [warehouses]);

  const sortedCustomers = useMemo(() => {
    const sortableItems = [...customers].map(c => ({
      ...c,
      defaultWarehouseName: c.defaultWarehouseId ? warehouseMap[c.defaultWarehouseId] : t('none'),
    }));

    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
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
    return sortableItems;
  }, [customers, sortConfig, warehouseMap]);

  // Apply pagination to the filtered and sorted customers
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedCustomers.slice(startIndex, endIndex);
  }, [sortedCustomers, currentPage, itemsPerPage]);

  const requestSort = (key: SortConfig['key']) => {
    let direction: SortConfig['direction'] = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleAddCustomer = () => {
    setEditingCustomerId(undefined);
    setIsModalOpen(true);
  };

  const handleEditCustomer = (id: number) => {
    setEditingCustomerId(id);
    setIsModalOpen(true);
  };

  const handleDeleteCustomer = (id: number) => {
    deleteItem('customers', id);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingCustomerId(undefined);
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
        <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-200">{t('customers')}</h1>
        <Button onClick={handleAddCustomer}>
          <PlusCircle className="w-4 h-4 mr-2" />
          {t('addCustomer')}
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100 dark:bg-slate-700">
              <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={() => requestSort('name')}>
                {t('customerName')} {getSortIndicator('name')}
              </TableHead>
              <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={() => requestSort('contact')}>
                {t('contactPerson')} {getSortIndicator('contact')}
              </TableHead>
              <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={() => requestSort('email')}>
                {t('email')} {getSortIndicator('email')}
              </TableHead>
              <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={() => requestSort('phone')}>
                {t('phone')} {getSortIndicator('phone')}
              </TableHead>
              <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={() => requestSort('defaultWarehouseName')}>
                {t('defaultWarehouse')} {getSortIndicator('defaultWarehouseName')}
              </TableHead>
              <TableHead className="p-3">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCustomers.length > 0 ? (
              paginatedCustomers.map(c => (
                <TableRow key={c.id} className="border-b dark:border-slate-700 text-gray-800 dark:text-slate-300">
                  <TableCell className="p-3">{c.name}</TableCell>
                  <TableCell className="p-3">{c.contact}</TableCell>
                  <TableCell className="p-3">{c.email}</TableCell>
                  <TableCell className="p-3">{c.phone}</TableCell>
                  <TableCell className="p-3">{c.defaultWarehouseName}</TableCell>
                  <TableCell className="p-3">
                    <Button variant="link" onClick={() => handleEditCustomer(c.id)} className="mr-2 p-0 h-auto">
                      {t('edit')}
                    </Button>
                    <Button variant="link" onClick={() => handleDeleteCustomer(c.id)} className="text-red-500 p-0 h-auto">
                      {t('delete')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="p-4 text-center text-gray-500 dark:text-slate-400">
                  {t('noItemsFound')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <PaginationControls
        totalItems={sortedCustomers.length}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      <FormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={editingCustomerId ? t('editCustomer') : t('createCustomer')}
      >
        <CustomerForm customerId={editingCustomerId} onSuccess={handleModalClose} />
      </FormModal>
    </div>
  );
};

export default Customers;