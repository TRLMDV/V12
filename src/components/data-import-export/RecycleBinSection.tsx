"use client";

import React from 'react';
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

const RecycleBinSection: React.FC<RecycleBinSectionProps> = ({
  recycleBin, restoreFromRecycleBin, deletePermanentlyFromRecycleBin, cleanRecycleBin, getItemSummary, t
}) => {
  console.log("RecycleBinSection: Rendered. Recycle bin items count:", recycleBin.length);
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
              <TableHead className="p-3">{t('itemType')}</TableHead>
              <TableHead className="p-3">{t('originalId')}</TableHead>
              <TableHead className="p-3">{t('dataSummary')}</TableHead>
              <TableHead className="p-3">{t('deletedAt')}</TableHead>
              <TableHead className="p-3">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recycleBin.length > 0 ? (
              recycleBin.map(item => (
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