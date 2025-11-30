"use client";

import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { BellRing } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Reminder } from '@/types';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminder: Reminder | null;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

const ReminderModal: React.FC<ReminderModalProps> = ({ isOpen, onClose, reminder, t }) => {
  if (!reminder) return null;

  const formattedTime = format(parseISO(reminder.dateTime), 'HH:mm');
  const displayMessage = reminder.message.trim() || t('noMessageProvided');

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md p-6 text-center">
        <AlertDialogHeader className="flex flex-col items-center">
          <BellRing className="h-12 w-12 text-blue-500 mb-4" />
          <AlertDialogTitle className="text-3xl font-bold text-gray-800 dark:text-slate-200">
            {t('reminder')}!
          </AlertDialogTitle>
          <AlertDialogDescription className="text-lg text-gray-700 dark:text-slate-300 mt-2">
            {formattedTime} - <span className="font-bold">{displayMessage}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex justify-center mt-6">
          <Button onClick={onClose} className="w-full max-w-[150px]">
            {t('dismiss')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ReminderModal;