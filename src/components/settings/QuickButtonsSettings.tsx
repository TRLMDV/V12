"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import FormModal from '@/components/FormModal';
import QuickButtonForm from '@/forms/QuickButtonForm';
import { Settings, QuickButton } from '@/types';

interface QuickButtonsSettingsProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
  showConfirmationModal: (title: string, message: string, onConfirm: () => void) => void;
  getNextId: (key: 'quickButtons') => number;
  setNextIdForCollection: (key: 'quickButtons', nextId: number) => void;
}

const QuickButtonsSettings: React.FC<QuickButtonsSettingsProps> = ({
  settings,
  setSettings,
  t,
  showConfirmationModal,
  getNextId,
  setNextIdForCollection,
}) => {
  const [isButtonModalOpen, setIsButtonModalOpen] = useState(false);
  const [editingButton, setEditingButton] = useState<QuickButton | undefined>(undefined);
  const [isButtonsListOpen, setIsButtonsListOpen] = useState(false);

  const handleAddButton = () => {
    setEditingButton(undefined);
    setIsButtonModalOpen(true);
  };

  const handleEditButton = (button: QuickButton) => {
    setEditingButton(button);
    setIsButtonModalOpen(true);
  };

  const handleSaveButton = (newButton: QuickButton) => {
    setSettings(prevSettings => {
      const existingButtons = prevSettings.quickButtons || [];
      let updatedButtons;

      if (newButton.id === 0) { // Add new button
        const newId = getNextId('quickButtons');
        updatedButtons = [...existingButtons, { ...newButton, id: newId }];
        setNextIdForCollection('quickButtons', newId + 1);
        toast.success(t('success'), { description: t('quickButtonAdded') });
      } else { // Update existing button
        updatedButtons = existingButtons.map(btn =>
          btn.id === newButton.id ? { ...btn, label: newButton.label, action: newButton.action, size: newButton.size, color: newButton.color } : btn
        );
        toast.success(t('success'), { description: t('quickButtonUpdated') });
      }
      return { ...prevSettings, quickButtons: updatedButtons };
    });
    setIsButtonModalOpen(false);
  };

  const handleDeleteButton = (buttonId: number) => {
    showConfirmationModal(
      t('deleteQuickButton'),
      t('deleteQuickButtonWarning'),
      () => {
        setSettings(prevSettings => ({
          ...prevSettings,
          quickButtons: (prevSettings.quickButtons || []).filter(btn => btn.id !== buttonId),
        }));
        toast.success(t('success'), { description: t('quickButtonDeleted') });
      }
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6">
      <button
        type="button"
        onClick={() => setIsButtonsListOpen(!isButtonsListOpen)}
        className="flex justify-between items-center w-full text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4 focus:outline-none"
      >
        {t('quickButtons')}
        {isButtonsListOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {isButtonsListOpen && (
        <>
          <div className="flex justify-end mb-4">
            <Button onClick={handleAddButton}>
              <PlusCircle className="w-4 h-4 mr-2" />
              {t('addQuickButton')}
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-slate-700">
                  <TableHead className="p-3">{t('buttonLabel')}</TableHead>
                  <TableHead className="p-3">{t('buttonAction')}</TableHead>
                  <TableHead className="p-3">{t('buttonSize')}</TableHead>
                  <TableHead className="p-3">{t('buttonColor')}</TableHead>
                  <TableHead className="p-3 text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(settings.quickButtons || []).length > 0 ? (
                  (settings.quickButtons || []).map(btn => (
                    <TableRow key={btn.id} className="border-b dark:border-slate-700 text-gray-800 dark:text-slate-300">
                      <TableCell className="p-3">{btn.label}</TableCell>
                      <TableCell className="p-3">{t(btn.action as keyof typeof t)}</TableCell>
                      <TableCell className="p-3">{t(`size${btn.size.charAt(0).toUpperCase() + btn.size.slice(1)}` as keyof typeof t)}</TableCell>
                      <TableCell className="p-3">
                        <div className="flex items-center">
                          <span className={`w-4 h-4 rounded-full mr-2 ${btn.color.split(' ')[0]}`}></span>
                          {btn.color.split(' ')[0].replace('bg-', '').replace(/-\d+/, '')}
                        </div>
                      </TableCell>
                      <TableCell className="p-3 text-right">
                        <Button variant="link" onClick={() => handleEditButton(btn)} className="mr-2 p-0 h-auto">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="link" onClick={() => handleDeleteButton(btn.id)} className="text-red-500 p-0 h-auto">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="p-4 text-center text-gray-500 dark:text-slate-400">
                      {t('noQuickButtonsFound')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <FormModal
        isOpen={isButtonModalOpen}
        onClose={() => setIsButtonModalOpen(false)}
        title={editingButton ? t('editQuickButton') : t('addQuickButton')}
      >
        <QuickButtonForm
          button={editingButton}
          onSuccess={handleSaveButton}
          onCancel={() => setIsButtonModalOpen(false)}
        />
      </FormModal>
    </div>
  );
};

export default QuickButtonsSettings;