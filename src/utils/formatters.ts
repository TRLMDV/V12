export const formatNumberInput = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null || value === '') {
    return '';
  }
  const num = parseFloat(String(value));
  if (isNaN(num)) {
    return '';
  }
  // Convert to string, then remove trailing zeros after a decimal point
  // e.g., 12.500 -> 12.5, 25.000 -> 25
  return num.toString().replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '');
};