"use client";

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
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
  if (!reminder) {
    console.log("ReminderModal: No reminder object, returning null.");
    return null;
  }

  const formattedTime = format(parseISO(reminder.dateTime), 'HH:mm');
  const displayMessage = reminder.message.trim() || t('noMessageProvided');

  console.log("ReminderModal: Rendering. isOpen:", isOpen, "reminder:", reminder, "displayMessage:", displayMessage);

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md p-6 text-center bg-yellow-100 dark:bg-yellow-900/50 border-yellow-500 border-2"> {/* TEMPORARY VISUAL CUE */}
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