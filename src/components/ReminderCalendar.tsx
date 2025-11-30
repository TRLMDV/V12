"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, isSameDay, isPast, isToday, parseISO, setHours, setMinutes, setSeconds, isFuture, getHours, getMinutes } from 'date-fns';
import { PlusCircle, BellRing, Trash2, Edit } from 'lucide-react';
import { toast }
 from 'sonner';
import FormModal from '@/components/FormModal';
import { useData } from '@/context/DataContext';
import { t } from '@/utils/i18n';
import { Reminder } from '@/types';
import ReminderModal from './ReminderModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select components

const ReminderCalendar: React.FC = () => {
  const { settings, saveItem, deleteItem, getNextId, setNextIdForCollection, showAlertModal, showConfirmationModal, setSettings } = useData();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | undefined>(undefined);

  const [isCentralReminderModalOpen, setIsCentralReminderModalOpen] = useState(false);
  const [currentDueReminder, setCurrentDueReminder] = useState<Reminder | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);

  const reminders = settings.reminders || [];

  const remindersForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return reminders.filter(r => isSameDay(parseISO(r.dateTime), selectedDate))
      .sort((a, b) => parseISO(a.dateTime).getTime() - parseISO(b.dateTime).getTime());
  }, [reminders, selectedDate]);

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      reminders.forEach(reminder => {
        const reminderDateTime = parseISO(reminder.dateTime);
        
        const timeDifference = reminderDateTime.getTime() - now.getTime(); 
        
        // Reminder is "due soon" if it's within 5 seconds in the past or 10 seconds in the future
        const isDueSoon = timeDifference >= -5 * 1000 && timeDifference < 10 * 1000; 

        console.log(`--- Checking reminder: "${reminder.message}" (ID: ${reminder.id}) ---`);
        console.log(`  Reminder time: ${reminderDateTime.toISOString()}`);
        console.log(`  Current time: ${now.toISOString()}`);
        console.log(`  Time difference (ms): ${timeDifference}`);
        console.log(`  Is due soon (-5s to +10s window): ${isDueSoon}`);

        const shownKey = `reminder_shown_${reminder.id}`;
        const isShownInLocalStorage = localStorage.getItem(shownKey);
        const hasBeenShown = isShownInLocalStorage === 'true'; // Corrected: Compare to string 'true'
        console.log(`  Shown key (${shownKey}): ${isShownInLocalStorage}`);
        console.log(`  Has been shown (parsed): ${hasBeenShown}`);


        if (isDueSoon && !hasBeenShown) { // Use the parsed boolean
          console.log(`*** TRIGGERING REMINDER: "${reminder.message}" ***`);
          setCurrentDueReminder(reminder);
          setIsCentralReminderModalOpen(true);
          console.log(`  setIsCentralReminderModalOpen(true) called.`); 
          
          // Add a small delay before setting the flag to ensure the modal state update propagates
          setTimeout(() => {
            localStorage.setItem(shownKey, 'true');
            console.log(`  Set shown key (${shownKey}) to localStorage after delay.`);
          }, 100); // 100ms delay

          if (audioRef.current) {
            audioRef.current.play().catch(e => console.error("Error playing sound:", e));
          }

          // Set timeout for removing the flag to 1 minute
          setTimeout(() => {
            localStorage.removeItem(shownKey);
            console.log(`  Removed shown key (${shownKey}) from localStorage.`);
          }, 60 * 1000); // 1 minute
        } else if (isDueSoon && hasBeenShown) {
          console.warn(`  Reminder "${reminder.message}" (ID: ${reminder.id}) is due but already shown (flag in localStorage).`);
        }
      });
    };

    const intervalId = setInterval(checkReminders, 10 * 1000);
    return () => clearInterval(intervalId);
  }, [reminders, t]);

  const handleAddReminder = () => {
    setEditingReminder(undefined);
    setIsReminderModalOpen(true);
  };

  const handleEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setIsReminderModalOpen(true);
  };

  const handleSaveReminder = (newReminder: Reminder) => {
    setSettings(prevSettings => {
      const existingReminders = prevSettings.reminders || [];
      let updatedReminders;

      if (newReminder.id === 0) {
        const newId = getNextId('reminders');
        updatedReminders = [...existingReminders, { ...newReminder, id: newId }];
        setNextIdForCollection('reminders', newId + 1);
        toast.success(t('success'), { description: t('reminderAdded') });
      } else {
        updatedReminders = existingReminders.map(r =>
          r.id === newReminder.id ? { ...r, message: newReminder.message, dateTime: newReminder.dateTime } : r
        );
        toast.success(t('success'), { description: t('reminderUpdated') });
      }
      return { ...prevSettings, reminders: updatedReminders };
    });
    setIsReminderModalOpen(false);
  };

  const handleDeleteReminder = (id: number) => {
    showConfirmationModal(
      t('deleteReminder'),
      t('deleteReminderWarning'),
      () => {
        setSettings(prevSettings => ({
          ...prevSettings,
          reminders: (prevSettings.reminders || []).filter(r => r.id !== id),
        }));
        toast.success(t('success'), { description: t('reminderDeleted') });
      }
    );
  };

  const handleDayClick = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const modifiers = useMemo(() => {
    const daysWithReminders: Date[] = [];
    reminders.forEach(r => {
      const date = parseISO(r.dateTime);
      if (!daysWithReminders.some(d => isSameDay(d, date))) {
        daysWithReminders.push(date);
      }
    });
    return {
      hasReminders: daysWithReminders,
    };
  }, [reminders]);

  const modifiersStyles: Record<string, React.CSSProperties> = { // Explicitly type as Record<string, React.CSSProperties>
    hasReminders: {
      position: 'relative',
    },
  };

  const renderDay = (day: Date) => {
    const hasReminderForDay = modifiers.hasReminders.some(d => isSameDay(d, day));
    return (
      <div className="relative">
        {day.getDate()}
        {hasReminderForDay && (
          <span className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-blue-500 rounded-full" />
        )}
      </div>
    );
  };

  console.log("ReminderCalendar rendering. isCentralReminderModalOpen:", isCentralReminderModalOpen, "currentDueReminder:", currentDueReminder); // Added log

  return (
    <Card className="dark:bg-slate-800 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-700 dark:text-slate-300">{t('calendarAndReminders')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row gap-6 p-4">
        <div className="flex-shrink-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDayClick}
            className="rounded-md border dark:border-slate-700"
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            components={{
              DayContent: ({ date }) => renderDay(date),
            }}
          />
        </div>
        <div className="flex-grow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-300">
              {selectedDate ? format(selectedDate, 'PPP') : t('selectADate')}
            </h3>
            <Button onClick={handleAddReminder} size="sm">
              <PlusCircle className="w-4 h-4 mr-2" />
              {t('addReminder')}
            </Button>
          </div>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {remindersForSelectedDate.length > 0 ? (
              remindersForSelectedDate.map(reminder => (
                <div key={reminder.id} className={`flex items-center justify-between p-3 rounded-md border dark:border-slate-700 ${isPast(parseISO(reminder.dateTime)) && !isToday(parseISO(reminder.dateTime)) ? 'bg-gray-50 dark:bg-slate-700 text-gray-500' : 'bg-white dark:bg-slate-900'}`}>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-slate-200">{format(parseISO(reminder.dateTime), 'HH:mm')}</p>
                    <p className="text-sm text-gray-700 dark:text-slate-300">{reminder.message}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEditReminder(reminder)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteReminder(reminder.id)} className="text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-slate-400">{t('noRemindersForSelectedDate')}</p>
            )}
          </div>
        </div>
      </CardContent>

      <FormModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        title={editingReminder ? t('editReminder') : t('addReminder')}
      >
        <ReminderForm
          reminder={editingReminder}
          onSuccess={handleSaveReminder}
          onCancel={() => setIsReminderModalOpen(false)}
          initialDate={selectedDate}
        />
      </FormModal>

      <ReminderModal
        isOpen={isCentralReminderModalOpen}
        onClose={() => setIsCentralReminderModalOpen(false)}
        reminder={currentDueReminder}
        t={t}
      />

      <audio ref={audioRef} src="/notification.mp3" preload="auto" />
    </Card>
  );
};

interface ReminderFormProps {
  reminder?: Reminder;
  onSuccess: (reminder: Reminder) => void;
  onCancel: () => void;
  initialDate?: Date;
}

const ReminderForm: React.FC<ReminderFormProps> = ({ reminder, onSuccess, onCancel, initialDate }) => {
  const [message, setMessage] = useState(reminder?.message || '');
  const [date, setDate] = useState<Date | undefined>(reminder ? parseISO(reminder.dateTime) : initialDate || new Date());
  const [selectedHour, setSelectedHour] = useState<string>(reminder ? String(getHours(parseISO(reminder.dateTime))).padStart(2, '0') : '09');
  const [selectedMinute, setSelectedMinute] = useState<string>(reminder ? String(getMinutes(parseISO(reminder.dateTime))).padStart(2, '0') : '00');

  useEffect(() => {
    if (reminder) {
      setMessage(reminder.message);
      setDate(parseISO(reminder.dateTime));
      setSelectedHour(String(getHours(parseISO(reminder.dateTime))).padStart(2, '0'));
      setSelectedMinute(String(getMinutes(parseISO(reminder.dateTime))).padStart(2, '0'));
    } else {
      setMessage('');
      setDate(initialDate || new Date());
      setSelectedHour('09');
      setSelectedMinute('00');
    }
  }, [reminder, initialDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !date || !selectedHour || !selectedMinute) {
      toast.error(t('validationError'), { description: t('allFieldsRequired') });
      return;
    }

    let reminderDateTime = setHours(date, parseInt(selectedHour));
    reminderDateTime = setMinutes(reminderDateTime, parseInt(selectedMinute));
    reminderDateTime = setSeconds(reminderDateTime, 0);

    onSuccess({
      id: reminder?.id || 0,
      message: message.trim(),
      dateTime: reminderDateTime.toISOString(),
    });
  };

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="message" className="text-right">{t('message')}</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="col-span-3"
            required
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="date" className="text-right">{t('date')}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className="col-span-3 justify-start text-left font-normal"
              >
                <BellRing className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>{t('pickADate')}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="time" className="text-right">{t('time')}</Label>
          <div className="col-span-3 flex gap-2">
            <Select onValueChange={setSelectedHour} value={selectedHour}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder={t('selectHour')} />
              </SelectTrigger>
              <SelectContent>
                {hours.map(h => (
                  <SelectItem key={h} value={h}>{h}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={setSelectedMinute} value={selectedMinute}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder={t('selectMinute')} />
              </SelectTrigger>
              <SelectContent>
                {minutes.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('cancel')}
        </Button>
        <Button type="submit">{t('saveReminder')}</Button>
      </div>
    </form>
  );
};

export default ReminderCalendar;