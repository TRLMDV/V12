// src/utils/currencyFlags.ts

import { Currency } from '@/types';

// Mapping from Currency code to a 2-letter ISO country code
// This map is not exhaustive and focuses on common currencies.
// For currencies not directly tied to a single country (e.g., XCD),
// or for which a clear emoji flag isn't available, it might be omitted or use a generic placeholder.
export const currencyToCountryCodeMap: Partial<Record<Currency, string>> = {
  'AZN': 'AZ', // Azerbaijan Manat
  'USD': 'US', // United States Dollar
  'EUR': 'EU', // Euro (European Union)
  'RUB': 'RU', // Russian Ruble
  'JPY': 'JP', // Japanese Yen
  'GBP': 'GB', // British Pound
  'AUD': 'AU', // Australian Dollar
  'CAD': 'CA', // Canadian Dollar
  'CHF': 'CH', // Swiss Franc
  'CNY': 'CN', // Chinese Yuan
  'KWD': 'KW', // Kuwaiti Dinar
  'BHD': 'BH', // Bahraini Dinar
  'OMR': 'OM', // Omani Rial
  'JOD': 'JO', // Jordanian Dinar
  'GIP': 'GI', // Gibraltar Pound
  'KYD': 'KY', // Cayman Islands Dollar
  'KRW': 'KR', // South Korean Won
  'SGD': 'SG', // Singapore Dollar
  'INR': 'IN', // Indian Rupee
  'MXN': 'MX', // Mexican Peso
  'SEK': 'SE', // Swedish Krona
  'THB': 'TH', // Thai Baht
  'AED': 'AE', // UAE Dirham
  // Add more mappings as needed based on your ALL_CURRENCIES list
  // For currencies without a direct country code, you might need to decide on a fallback
  // or simply not display a flag.
};

/**
 * Converts a 2-letter ISO country code to its corresponding emoji flag.
 * @param countryCode The 2-letter ISO country code (e.g., 'US', 'GB').
 * @returns The emoji flag string, or an empty string if the code is invalid.
 */
export function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) {
    return '';
  }
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 0x1f1e6 + char.charCodeAt(0) - 'A'.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}