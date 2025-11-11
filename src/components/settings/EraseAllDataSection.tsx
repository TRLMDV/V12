"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import CodeConfirmationModal from '@/components/CodeConfirmationModal';
import { useEraseAllData } from '@/hooks/useEraseAllData';

interface EraseAllDataSectionProps {
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
  showConfirmationModal: (title: string, message: string, onConfirm: () => void) => void;
}

const EraseAllDataSection: React.FC<EraseAllDataSectionProps> = ({ t, showConfirmationModal }) => {
  const {
    isCodeConfirmationModalOpen,
    setIsCodeConfirmationModalOpen,
    generatedCode,
    handleCodeConfirmation,
    handleEraseAllData,
  } = useEraseAllData({ showConfirmationModal, t });

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4">{t('eraseAllData')}</h2>
      <p className="text-gray-600 dark:text-slate-400 mb-4">
        {t('eraseAllDataDescription')}
      </p>
      <div className="flex justify-end">
        <Button variant="destructive" onClick={handleEraseAllData}>
          {t('eraseAllData')}
        </Button>
      </div>

      <CodeConfirmationModal
        isOpen={isCodeConfirmationModalOpen}
        onClose={() => setIsCodeConfirmationModalOpen(false)}
        onConfirm={handleCodeConfirmation}
        codeToEnter={generatedCode}
      />
    </div>
  );
};

export default EraseAllDataSection;