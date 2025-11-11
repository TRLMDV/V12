"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import FormModal from '@/components/FormModal';
import PackingUnitForm from '@/forms/PackingUnitForm';
import { Settings, PackingUnit } from '@/types';

interface PackingSettingsProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
  showConfirmationModal: (title: string, message: string, onConfirm: () => void) => void;
  getNextId: (key: 'packingUnits') => number;
  setNextIdForCollection: (key: 'packingUnits', nextId: number) => void;
}

const PackingSettings: React.FC<PackingSettingsProps> = ({
  settings,
  setSettings,
  t,
  showConfirmationModal,
  getNextId,
  setNextIdForCollection,
}) => {
  const [isPackingUnitModalOpen, setIsPackingUnitModalOpen] = useState(false);
  const [editingPackingUnit, setEditingPackingUnit] = useState<PackingUnit | undefined>(undefined);
  const [isPackingUnitsListOpen, setIsPackingUnitsListOpen] = useState(false);

  const handleAddPackingUnit = () => {
    setEditingPackingUnit(undefined);
    setIsPackingUnitModalOpen(true);
  };

  const handleEditPackingUnit = (packingUnit: PackingUnit) => {
    setEditingPackingUnit(packingUnit);
    setIsPackingUnitModalOpen(true);
  };

  const handleSavePackingUnit = (newPackingUnit: PackingUnit) => {
    setSettings(prevSettings => {
      const existingPackingUnits = prevSettings.packingUnits || [];
      let updatedPackingUnits;

      if (newPackingUnit.id === 0) { // Add new packing unit
        const newId = getNextId('packingUnits');
        updatedPackingUnits = [...existingPackingUnits, { ...newPackingUnit, id: newId }];
        setNextIdForCollection('packingUnits', newId + 1);
        toast.success(t('success'), { description: t('packingUnitAdded') });
      } else { // Update existing packing unit
        updatedPackingUnits = existingPackingUnits.map(pu =>
          pu.id === newPackingUnit.id ? { ...pu, name: newPackingUnit.name, baseUnit: newPackingUnit.baseUnit, conversionFactor: newPackingUnit.conversionFactor } : pu
        );
        toast.success(t('success'), { description: t('packingUnitUpdated') });
      }
      return { ...prevSettings, packingUnits: updatedPackingUnits };
    });
    setIsPackingUnitModalOpen(false);
  };

  const handleDeletePackingUnit = (packingUnitId: number) => {
    showConfirmationModal(
      t('deletePackingUnit'),
      t('deletePackingUnitWarning'),
      () => {
        setSettings(prevSettings => ({
          ...prevSettings,
          packingUnits: (prevSettings.packingUnits || []).filter(pu => pu.id !== packingUnitId),
        }));
        toast.success(t('success'), { description: t('packingUnitDeleted') });
      }
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6">
      <button
        type="button"
        onClick={() => setIsPackingUnitsListOpen(!isPackingUnitsListOpen)}
        className="flex justify-between items-center w-full text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4 focus:outline-none"
      >
        {t('packingUnits')}
        {isPackingUnitsListOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {isPackingUnitsListOpen && (
        <>
          <div className="flex justify-end mb-4">
            <Button onClick={handleAddPackingUnit}>
              <PlusCircle className="w-4 h-4 mr-2" />
              {t('addPackingUnit')}
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-slate-700">
                  <TableHead className="p-3">{t('packingUnitName')}</TableHead>
                  <TableHead className="p-3">{t('baseUnit')}</TableHead>
                  <TableHead className="p-3">{t('conversionFactor')}</TableHead>
                  <TableHead className="p-3 text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(settings.packingUnits || []).length > 0 ? (
                  (settings.packingUnits || []).map(pu => (
                    <TableRow key={pu.id} className="border-b dark:border-slate-700 text-gray-800 dark:text-slate-300">
                      <TableCell className="p-3">{pu.name}</TableCell>
                      <TableCell className="p-3">{t(pu.baseUnit)}</TableCell>
                      <TableCell className="p-3">{pu.conversionFactor}</TableCell>
                      <TableCell className="p-3 text-right">
                        <Button variant="link" onClick={() => handleEditPackingUnit(pu)} className="mr-2 p-0 h-auto">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="link" onClick={() => handleDeletePackingUnit(pu.id)} className="text-red-500 p-0 h-auto">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="p-4 text-center text-gray-500 dark:text-slate-400">
                      {t('noPackingUnitsFound')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <FormModal
        isOpen={isPackingUnitModalOpen}
        onClose={() => setIsPackingUnitModalOpen(false)}
        title={editingPackingUnit ? t('editPackingUnit') : t('addPackingUnit')}
      >
        <PackingUnitForm
          packingUnit={editingPackingUnit}
          onSuccess={handleSavePackingUnit}
          onCancel={() => setIsPackingUnitModalOpen(false)}
        />
      </FormModal>
    </div>
  );
};

export default PackingSettings;