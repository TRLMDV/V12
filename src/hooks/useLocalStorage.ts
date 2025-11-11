"use client";

import { useState, useEffect } from 'react';

type SetValue<T> = (value: T | ((prevValue: T) => T)) => void;

export function useLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      if (item) {
        const parsedItem = JSON.parse(item);
        // If both initialValue and parsedItem are objects, merge them carefully.
        // Start with initialValue's properties, then overlay parsedItem's properties
        // but only if parsedItem's property is not undefined.
        if (typeof initialValue === 'object' && initialValue !== null && typeof parsedItem === 'object' && parsedItem !== null) {
          const mergedObject = { ...initialValue };
          for (const prop in parsedItem) {
            if (Object.prototype.hasOwnProperty.call(parsedItem, prop) && parsedItem[prop] !== undefined) {
              mergedObject[prop] = parsedItem[prop];
            }
          }
          return mergedObject as T;
        }
        return parsedItem;
      }
      return initialValue;
    } catch (error) {
      // If error also return initialValue
      console.error(`Error reading or parsing localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // useEffect to update local storage when the state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      } catch (error) {
        console.error(`Error writing to localStorage key "${key}":`, error);
      }
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}