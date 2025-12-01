"use client";

import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { t } from '@/utils/i18n';

interface UseBarcodeScannerOptions {
  onBarcodeScanned: (barcode: string) => void;
  isEnabled?: boolean; // Control when the scanner is active
  scanDelay?: number; // Max delay between characters to consider it a single scan (ms)
  minLength?: number; // Minimum length of a scanned barcode
}

export function useBarcodeScanner({
  onBarcodeScanned,
  isEnabled = true,
  scanDelay = 50, // Default to 50ms, typical for fast scanners
  minLength = 3, // Minimum length to avoid accidental triggers
}: UseBarcodeScannerOptions) {
  const barcodeBuffer = useRef<string[]>([]);
  const lastKeyPressTime = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isEnabled) return;

    const currentTime = Date.now();
    const timeSinceLastKey = currentTime - lastKeyPressTime.current;

    // If a long pause, or a non-alphanumeric key (excluding Enter), reset buffer
    // This helps distinguish scanner input from manual typing
    if (timeSinceLastKey > scanDelay && barcodeBuffer.current.length > 0) {
      barcodeBuffer.current = [];
    }

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent form submission or new line
      const scannedBarcode = barcodeBuffer.current.join('');
      if (scannedBarcode.length >= minLength) {
        onBarcodeScanned(scannedBarcode);
      } else if (scannedBarcode.length > 0) {
        // Optionally, notify if too short but still detected
        toast.info(t('barcodeTooShort'), { description: t('barcodeTooShortDescription', { length: scannedBarcode.length, minLength }) });
      }
      barcodeBuffer.current = []; // Reset buffer after processing
    } else if (event.key.length === 1) { // Only capture single character keys
      barcodeBuffer.current.push(event.key);
      // Set a timeout to clear the buffer if no more keys are pressed within scanDelay
      timeoutRef.current = setTimeout(() => {
        barcodeBuffer.current = [];
      }, scanDelay);
    } else {
      // If a non-character key (e.g., Shift, Ctrl, Alt, Arrow keys) is pressed, clear buffer
      // This helps prevent partial manual typing from being interpreted as a barcode
      barcodeBuffer.current = [];
    }

    lastKeyPressTime.current = currentTime;
  }, [onBarcodeScanned, isEnabled, scanDelay, minLength, t]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleKeyDown]);
}