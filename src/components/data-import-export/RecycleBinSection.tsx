"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, RotateCcw, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { RecycleBinItem, CollectionKey, QuickButton } from '@/types';

interface RecycleBinSectionProps {
  recycleBin: RecycleBinItem[];
  restoreFromRecycleBin: (recycleItemId: string) => void;
  deletePermanentlyFromRecycleBin: (recycleItemId: string) => void;
  cleanRecycleBin: () => void;
  getItemSummary: (item: any, collectionKey: CollectionKey) => string;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

type SortConfig = {
  key: 'collectionKey' | 'originalId' | 'dataSummary' | 'deletedAt';
  direction: 'ascending' | 'descending';
};

const RecycleBinSection: React.FC<RecycleBinSectionProps> = ({
  recycleBin, restoreFromRecycleBin, deletePermanentlyFromRecycleBin, cleanRecycleBin, getItemSummary, t
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'deletedAt', direction: 'descending' });

  const sortedRecycleBin = useMemo(() => {
    const sortableItems = [...recycleBin].map(item => ({
      ...item,
      dataSummary: getItemSummary(item.data, item.collectionKey), // Pre-calculate for sorting
    }));

    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const key = sortConfig.key;
        let valA: any;
        let valB: any;

        if (key === 'collectionKey') {
          valA = t(a.collectionKey);
          valB = t(b.collectionKey);
        } else if (key === 'deletedAt') {
          valA = new Date(a.deletedAt).getTime();
          valB = new Date(b.deletedAt).getTime();
        } else {
          valA = a[key];
          valB = b[key];
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
  }, [recycleBin, sortConfig, getItemSummary, t]);

  const requestSort = useCallback((key: SortConfig['key']) => {
    let direction: SortConfig['direction'] = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  }, [sortConfig]);

  const getSortIndicator = useCallback((key: SortConfig['key']) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    }
    return '';
  }, [sortConfig]);

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300">{t('recycleBin')}</h2>
        <Button onClick={() => {
          console.log("DEBUG: Clean Recycle Bin button clicked.");
          cleanRecycleBin();
        }} variant="destructive" disabled={recycleBin.length === 0}>
          <Trash2 className="w-4 h-4 mr-2" />
          {t('cleanRecycleBin')}
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100 dark:bg-slate-700">
              <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={() => requestSort('collectionKey')}>
                {t('itemType')} {getSortIndicator('collectionKey')}
              </TableHead>
              <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={() => requestSort('originalId')}>
                {t('originalId')} {getSortIndicator('originalId')}
              </TableHead>
              <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={() => requestSort('dataSummary')}>
                {t('dataSummary')} {getSortIndicator('dataSummary')}
              </TableHead>
              <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={() => requestSort('deletedAt')}>
                {t('deletedAt')} {getSortIndicator('deletedAt')}
              </TableHead>
              <TableHead className="p-3">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRecycleBin.length > 0 ? (
              sortedRecycleBin.map(item => (
                <TableRow key={item.id} className="border-b dark:border-slate-700 text-gray-800 dark:text-slate-300">
                  <TableCell className="p-3 capitalize">{t(item.collectionKey)}</TableCell>
                  <TableCell className="p-3">#{item.originalId}</TableCell>
                  <TableCell className="p-3 text-sm">{getItemSummary(item.data, item.collectionKey)}</TableCell>
                  <TableCell className="p-3">{format(new Date(item.deletedAt), 'yyyy-MM-dd HH:mm')}</TableCell>
                  <TableCell className="p-3 flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      console.log("DEBUG: Restore button clicked for item ID:", item.id);
                      restoreFromRecycleBin(item.id);
                    }}>
                      <RotateCcw className="w-4 h-4 mr-1" /> {t('restore')}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => {
                      console.log("DEBUG: Delete Permanently button clicked for item ID:", item.id);
                      deletePermanentlyFromRecycleBin(item.id);
                    }}>
                      <XCircle className="w-4 h-4 mr-1" /> {t('deletePermanently')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="p-4 text-center text-gray-500 dark:text-slate-400">
                  {t('noItemsInRecycleBin')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RecycleBinSection;