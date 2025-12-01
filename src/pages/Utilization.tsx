"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { MOCK_CURRENT_DATE } from '@/data/initialData';
import { t } from '@/utils/i18n';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import FormModal from '@/components/FormModal';
import UtilizationForm from '@/forms/UtilizationForm';
import { PlusCircle, Eye, Edit, Trash2, Check, ChevronsUpDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import PaginationControls from '@/components/PaginationControls';
import type { UtilizationOrder, Product, Warehouse } from '@/types';
import { format, parseISO } from 'date-fns'; // Import format and parseISO

type SortConfig = {
  key: keyof UtilizationOrder | 'warehouseName' | 'totalItems';
  direction: 'ascending' | 'descending';
};

const Utilization: React.FC = () => {
  const { utilizationOrders, warehouses, products, deleteItem, showAlertModal } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<number | undefined>(undefined);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<UtilizationOrder | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'descending' });

  // New states for filters
  const [filterWarehouseId, setFilterWarehouseId] = useState<number | 'all'>('all');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [productFilterId, setProductFilterId] = useState<number | 'all'>('all');
  const [isProductComboboxOpen, setIsProductComboboxOpen] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  const warehouseMap = useMemo(() => {
    return warehouses.reduce((acc, w) => ({ ...acc, [w.id]: w.name }), {} as { [key: number]: string });
  }, [warehouses]);

  const productMap = useMemo(() => {
    return products.reduce((acc, p) => ({ ...acc, [p.id]: p }), {} as { [key: number]: Product });
  }, [products]);

  const filteredAndSortedOrders = useMemo(() => {
    let filteredOrders = utilizationOrders;

    if (filterWarehouseId !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.warehouseId === filterWarehouseId);
    }
    if (startDateFilter) {
      filteredOrders = filteredOrders.filter(order => parseISO(order.date) >= parseISO(startDateFilter));
    }
    if (endDateFilter) {
      filteredOrders = filteredOrders.filter(order => parseISO(order.date) <= parseISO(endDateFilter));
    }
    if (productFilterId !== 'all') {
      filteredOrders = filteredOrders.filter(order =>
        order.items?.some(item => item.productId === productFilterId)
      );
    }

    const sortableItems = filteredOrders.map(order => {
      const totalItems = order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
      return {
        ...order,
        warehouseName: warehouseMap[order.warehouseId] || 'N/A',
        totalItems,
      };
    });

    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const key = sortConfig.key;
        let valA: any = a[key];
        let valB: any = b[key];

        if (key === 'date') {
          valA = parseISO(String(valA)).getTime();
          valB = parseISO(String(valB)).getTime();
        }

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
  }, [utilizationOrders, warehouseMap, sortConfig, filterWarehouseId, startDateFilter, endDateFilter, productFilterId]);

  // Apply pagination to the filtered and sorted orders
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedOrders.slice(startIndex, endIndex);
  }, [filteredAndSortedOrders, currentPage, itemsPerPage]);

  const handleAddOrder = () => {
    setEditingOrderId(undefined);
    setIsModalOpen(true);
  };

  const handleEditOrder = (id: number) => {
    setEditingOrderId(id);
    setIsModalOpen(true);
  };

  const handleDeleteOrder = (id: number) => {
    deleteItem('utilizationOrders', id);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingOrderId(undefined);
  };

  const viewOrderDetails = (orderId: number) => {
    const order = utilizationOrders.find(o => o.id === orderId);
    if (order) {
      setSelectedOrderDetails(order);
      setIsDetailsModalOpen(true);
    } else {
      showAlertModal('Error', 'Utilization order details not found.');
    }
  };

  const requestSort = (key: SortConfig['key']) => {
    let direction: SortConfig['direction'] = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
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
        <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-200">{t('utilizationOrders')}</h1>
        <Button onClick={handleAddOrder}>
          <PlusCircle className="w-4 h-4 mr-2" />
          {t('addUtilizationOrder')}
        </Button>
      </div>

      <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <Label htmlFor="warehouse-filter" className="text-sm font-medium text-gray-700 dark:text-slate-300">
              {t('fromWarehouse')}
            </Label>
            <Select onValueChange={(value) => {
              setFilterWarehouseId(value === 'all' ? 'all' : parseInt(value));
              setCurrentPage(1);
            }} value={String(filterWarehouseId)}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder={t('allWarehouses')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allWarehouses')}</SelectItem>
                {warehouses.map(w => (
                  <SelectItem key={w.id} value={String(w.id)}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="product-filter" className="text-sm font-medium text-gray-700 dark:text-slate-300">
              {t('product')}
            </Label>
            <Popover open={isProductComboboxOpen} onOpenChange={setIsProductComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isProductComboboxOpen}
                  className="w-full justify-between mt-1"
                >
                  {productFilterId !== 'all'
                    ? productMap[productFilterId as number]?.name || t('allProducts')
                    : t('allProducts')}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command>
                  <CommandInput placeholder={t('searchProductBySku')} />
                  <CommandEmpty>{t('noProductFound')}</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="all-products"
                      onSelect={() => {
                        setProductFilterId('all');
                        setIsProductComboboxOpen(false);
                        setCurrentPage(1);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          productFilterId === 'all' ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {t('allProducts')}
                    </CommandItem>
                    {products.map((product) => (
                      <CommandItem
                        key={product.id}
                        value={`${product.name} ${product.sku}`}
                        onSelect={() => {
                          setProductFilterId(product.id);
                          setIsProductComboboxOpen(false);
                          setCurrentPage(1);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            productFilterId === product.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {product.name} ({product.sku})
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label htmlFor="start-date-filter" className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('startDate')}</Label>
            <Input
              type="date"
              id="start-date-filter"
              value={startDateFilter}
              onChange={(e) => {
                setStartDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="mt-1 w-full p-2 border rounded-md shadow-sm bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
          </div>
          <div>
            <Label htmlFor="end-date-filter" className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('endDate')}</Label>
            <Input
              type="date"
              id="end-date-filter"
              value={endDateFilter}
              onChange={(e) => {
                setEndDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="mt-1 w-full p-2 border rounded-md shadow-sm bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100 dark:bg-slate-700">
              <TableHead className="p-3">No.</TableHead>{/* New: Numbering column */}
              <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={() => requestSort('id')}>
                {t('orderId')} {getSortIndicator('id')}
              </TableHead>
              <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={() => requestSort('warehouseName')}>
                {t('warehouse')} {getSortIndicator('warehouseName')}
              </TableHead>
              <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={() => requestSort('date')}>
                {t('date')} {getSortIndicator('date')}
              </TableHead>
              <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={() => requestSort('totalItems')}>
                {t('totalItems')} {getSortIndicator('totalItems')}
              </TableHead>
              <TableHead className="p-3">{t('comment')}</TableHead> {/* New: Comment column */}
              <TableHead className="p-3">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.length > 0 ? (
              paginatedOrders.map((order, index) => (
                <TableRow key={order.id} className="border-b dark:border-slate-700 text-gray-800 dark:text-slate-300">
                  <TableCell className="p-3 font-semibold">{(currentPage - 1) * itemsPerPage + index + 1}.</TableCell>{/* New: Numbering cell */}
                  <TableCell className="p-3 font-semibold">#{order.id}</TableCell>
                  <TableCell className="p-3">{order.warehouseName}</TableCell>
                  <TableCell className="p-3">{format(parseISO(order.date), 'yyyy-MM-dd HH:mm')}</TableCell>
                  <TableCell className="p-3 font-bold">{order.totalItems}</TableCell>
                  <TableCell className="p-3 text-sm italic">{order.comment || t('noComment')}</TableCell> {/* Display comment */}
                  <TableCell className="p-3">
                    <Button variant="link" onClick={() => viewOrderDetails(order.id)} className="mr-2 p-0 h-auto">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="link" onClick={() => handleEditOrder(order.id)} className="mr-2 p-0 h-auto">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="link" onClick={() => handleDeleteOrder(order.id)} className="text-red-500 p-0 h-auto">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="p-4 text-center text-gray-500 dark:text-slate-400">
                  {t('noUtilizationOrdersFound')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <PaginationControls
        totalItems={filteredAndSortedOrders.length}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      <FormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={editingOrderId ? t('editUtilizationOrder') : t('addUtilizationOrder')}
      >
        <UtilizationForm orderId={editingOrderId} onSuccess={handleModalClose} />
      </FormModal>

      <FormModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={t('detailsForUtilizationOrder') + ` #${selectedOrderDetails?.id}`}
      >
        <div className="grid gap-4 py-4 text-gray-800 dark:text-slate-300">
          <p><strong>{t('warehouse')}:</strong> {selectedOrderDetails?.warehouseId !== undefined ? warehouseMap[selectedOrderDetails.warehouseId] : 'N/A'}</p>
          <p><strong>{t('date')}:</strong> {selectedOrderDetails?.date ? format(parseISO(selectedOrderDetails.date), 'yyyy-MM-dd HH:mm') : 'N/A'}</p>
          <p><strong>{t('comment')}:</strong> {selectedOrderDetails?.comment || t('noComment')}</p> {/* Display comment in details */}
        </div>
        <h3 className="font-semibold mt-4 mb-2">{t('items')}</h3>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100 dark:bg-slate-700">
              <TableHead className="p-2">{t('product')}</TableHead>
              <TableHead className="p-2">{t('sku')}</TableHead>
              <TableHead className="p-2">{t('qty')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {selectedOrderDetails?.items?.map((item, index) => {
              const product = productMap[item.productId];
              return (
                <TableRow key={index} className="border-b dark:border-slate-600 dark:text-slate-300">
                  <TableCell className="p-2">{product?.name || 'N/A'}</TableCell>
                  <TableCell className="p-2">{product?.sku || 'N/A'}</TableCell>
                  <TableCell className="p-2">{item.quantity}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </FormModal>
    </div>
  );
};

export default Utilization;