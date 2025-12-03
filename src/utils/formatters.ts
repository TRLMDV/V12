export const roundToPrecision = (num: number, precision: number): number => {
  const factor = Math.pow(10, precision);
  return Math.round(num * factor) / factor;
};

export const formatNumberInput = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  const stringValue = String(value);

  // If the string is just a negative sign, or ends with a decimal point, or ends with '.0' (or more zeros),
  // return it as is to allow user to type.
  if (stringValue === '-' || stringValue.endsWith('.') || /^-?\d*\.0*$/.test(stringValue)) {
    return stringValue;
  }

  // Otherwise, parse and format for display, removing unnecessary trailing zeros.
  const num = parseFloat(stringValue);
  if (isNaN(num)) {
    return '';
  }

  // Use toFixed to control decimal places, then remove trailing zeros if it's an integer
  // This ensures numbers like 12.50 are displayed as 12.5, and 25.00 as 25.
  // We'll use a higher precision for internal representation and then trim.
  const formatted = num.toFixed(10); // Use a high precision
  return formatted.replace(/\.?0+$/, ''); // Remove trailing zeros and optional decimal point
};