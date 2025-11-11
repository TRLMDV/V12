"use client";

import { useState, useEffect } from 'react';

type SetValue<T> = (value: T | ((prevValue: T) => T)) => void;

export function useLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }

      const parsedItem = JSON.parse(item);

      // Handle arrays specifically: ensure if initialValue is an array, parsedItem is also an array.
      if (Array.isArray(initialValue)) {
        if (Array.isArray(parsedItem)) {
          return parsedItem as T;
        } else {
          console.warn(`LocalStorage key "${key}" expected an array but found non-array data. Using initial value.`);
          return initialValue;
        }
      }

      // Handle objects (non-arrays): merge properties from stored data onto initialValue.
      if (typeof initialValue === 'object' && initialValue !== null) {
        const mergedObject = { ...initialValue };
        if (typeof parsedItem === 'object' && parsedItem !== null) {
          for (const prop in parsedItem) {
            if (Object.prototype.hasOwnProperty.call(parsedItem, prop) && parsedItem[prop] !== undefined) {
              mergedObject[prop] = parsedItem[prop];
            }
          }
        }
        return mergedObject as T;
      }

      // Handle primitives or other types: just return the parsed item.
      return parsedItem;
    } catch (error) {
      console.error(`Error reading or parsing localStorage key "${key}":`, error);
      return initialValue;
    }
  });

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