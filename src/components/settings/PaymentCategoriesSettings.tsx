"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react'; // Import Chevron icons
import { toast } from 'sonner';
import FormModal from '@/components/FormModal';
import PaymentCategoryForm from '@/forms/PaymentCategoryForm';
import { Settings, PaymentCategorySetting } from '@/types';

interface PaymentCategoriesSettingsProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
  showConfirmationModal: (title: string, message: string, onConfirm: () => void) => void;
  getNextId: (key: 'paymentCategories') => number;
  setNextIdForCollection: (key: 'paymentCategories', nextId: number) => void;
}

const PaymentCategoriesSettings: React.FC<PaymentCategoriesSettingsProps> = ({
  settings,
  setSettings,
  t,
  showConfirmationModal,
  getNextId,
  setNextIdForCollection,
}) => {
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PaymentCategorySetting | undefined>(undefined);
  const [isCategoriesListOpen, setIsCategoriesListOpen] = useState(false); // New state for collapsible categories

  const handleAddCategory = () => {
    setEditingCategory(undefined);
    setIsCategoryModalOpen(true);
  };

  const handleEditCategory = (category: PaymentCategorySetting) => {
    setEditingCategory(category);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (newCategory: PaymentCategorySetting) => {
    setSettings(prevSettings => {
      const existingCategories = prevSettings.paymentCategories || [];
      let updatedCategories;

      if (newCategory.id === 0) { // Add new category
        const newId = getNextId('paymentCategories');
        updatedCategories = [...existingCategories, { ...newCategory, id: newId }];
        setNextIdForCollection('paymentCategories', newId + 1);
        toast.success(t('success'), { description: t('categoryAdded') });
      } else { // Update existing category
        updatedCategories = existingCategories.map(cat =>
          cat.id === newCategory.id ? { ...cat, name: newCategory.name } : cat
        );
        toast.success(t('success'), { description: t('categoryUpdated') });
      }
      return { ...prevSettings, paymentCategories: updatedCategories };
    });
    setIsCategoryModalOpen(false);
  };

  const handleDeleteCategory = (categoryId: number) => {
    showConfirmationModal(
      t('deleteCategory'),
      t('deleteCategoryWarning'),
      () => {
        setSettings(prevSettings => ({
          ...prevSettings,
          paymentCategories: (prevSettings.paymentCategories || []).filter(cat => cat.id !== categoryId),
        }));
        toast.success(t('success'), { description: t('categoryDeleted') });
      }
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6">
      <button
        type="button"
        onClick={() => setIsCategoriesListOpen(!isCategoriesListOpen)}
        className="flex justify-between items-center w-full text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4 focus:outline-none"
      >
        {t('paymentCategories')}
        {isCategoriesListOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {isCategoriesListOpen && (
        <>
          <div className="flex justify-end mb-4">
            <Button onClick={handleAddCategory}>
              <PlusCircle className="w-4 h-4 mr-2" />
              {t('addCategory')}
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-slate-700">
                  <TableHead className="p-3">{t('categoryName')}</TableHead>
                  <TableHead className="p-3 text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(settings.paymentCategories || []).length > 0 ? (
                  (settings.paymentCategories || []).map(category => (
                    <TableRow key={category.id} className="border-b dark:border-slate-700 text-gray-800 dark:text-slate-300">
                      <TableCell className="p-3">{category.name}</TableCell>
                      <TableCell className="p-3 text-right">
                        <Button variant="link" onClick={() => handleEditCategory(category)} className="mr-2 p-0 h-auto">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="link" onClick={() => handleDeleteCategory(category.id)} className="text-red-500 p-0 h-auto">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="p-4 text-center text-gray-500 dark:text-slate-400">
                      {t('noPaymentCategoriesFound')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <FormModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategory ? t('editCategory') : t('addCategory')}
      >
        <PaymentCategoryForm
          category={editingCategory}
          onSuccess={handleSaveCategory}
          onCancel={() => setIsCategoryModalOpen(false)}
        />
      </FormModal>
    </div>
  );
};

export default PaymentCategoriesSettings;