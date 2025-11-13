import {
  Product, Supplier, Customer, Warehouse, PurchaseOrder, SellOrder, Payment, ProductMovement,
  CurrencyRates, Settings, PaymentCategorySetting, Currency, PackingUnit, BankAccount
} from '@/types';

// --- MOCK CURRENT DATE (for consistency with original code) ---
export const MOCK_CURRENT_DATE = new Date('2025-10-29T15:53:00');

// --- Initial Data & Defaults ---
export const initialData = {
  warehouses: [] as Warehouse[],
  products: [] as Product[],
  suppliers: [] as Supplier[],
  customers: [] as Customer[],
  purchaseOrders: [] as PurchaseOrder[],
  sellOrders: [] as SellOrder[],
  incomingPayments: [] as Payment[],
  outgoingPayments: [] as Payment[],
  productMovements: [] as ProductMovement[],
  bankAccounts: [] as BankAccount[],
};

export const defaultCurrencyRates: CurrencyRates = {
  'USD': 1.70, 'EUR': 2.00, 'RUB': 0.019, 'AZN': 1.00,
  'JPY': 0.011, 'GBP': 2.15, 'AUD': 1.10, 'CAD': 1.25, 'CHF': 1.85, 'CNY': 0.24,
  'KWD': 5.50, 'BHD': 4.50, 'OMR': 4.40, 'JOD': 2.40, 'GIP': 2.15, 'KYD': 2.05,
  'KRW': 0.0013, 'SGD': 1.28, 'INR': 0.020, 'MXN': 0.095, 'SEK': 0.18, 'THB': 0.048,
  'AFN': 1.00, 'ALL': 1.00, 'DZD': 1.00, 'AOA': 1.00, 'XCD': 1.00, 'ARS': 1.00, 'AMD': 1.00, 'AWG': 1.00, 'SHP': 1.00, 'BSD': 1.00, 'BDT': 1.00, 'BBD': 1.00, 'BYN': 1.00, 'BZD': 1.00, 'XOF': 1.00, 'BMD': 1.00, 'BTN': 1.00, 'BOB': 1.00, 'BAM': 1.00, 'BWP': 1.00, 'BRL': 1.00, 'BND': 1.00, 'BGN': 1.00, 'BIF': 1.00, 'KHR': 1.00, 'XAF': 1.00, 'CVE': 1.00, 'CDF': 1.00, 'KMF': 1.00, 'NZD': 1.00, 'CRC': 1.00, 'CUP': 1.00, 'XCG': 1.00, 'CZK': 1.00, 'DKK': 1.00, 'DJF': 1.00, 'DOP': 1.00, 'EGP': 1.00, 'ERN': 1.00, 'SZL': 1.00, 'ZAR': 1.00, 'ETB': 1.00, 'FKP': 1.00, 'FJD': 1.00, 'XPF': 1.00, 'GMD': 1.00, 'GEL': 1.00, 'GHS': 1.00, 'GTQ': 1.00, 'GNF': 1.00, 'GYD': 1.00, 'HTG': 1.00, 'HNL': 1.00, 'HKD': 1.00, 'HUF': 1.00, 'ISK': 1.00, 'IDR': 1.00, 'IRR': 1.00, 'IQD': 1.00, 'ILS': 1.00, 'JMD': 1.00, 'KZT': 1.00, 'KES': 1.00, 'KPW': 1.00, 'KGS': 1.00, 'LAK': 1.00, 'LBP': 1.00, 'LSL': 1.00, 'LRD': 1.00, 'LYD': 1.00, 'MDL': 1.00, 'MOP': 1.00, 'MGA': 1.00, 'MWK': 1.00, 'MYR': 1.00, 'MVR': 1.00, 'MRU': 1.00, 'MZN': 1.00, 'MMK': 1.00, 'NAD': 1.00, 'NPR': 1.00, 'NIO': 1.00, 'NGN': 1.00, 'NOK': 1.00, 'PKR': 1.00, 'PGK': 1.00, 'PYG': 1.00, 'PEN': 1.00, 'PHP': 1.00, 'PLN': 1.00, 'QAR': 1.00, 'RON': 1.00, 'RSD': 1.00, 'SCR': 1.00, 'SLE': 1.00, 'SBD': 1.00, 'SOS': 1.00, 'SSP': 1.00, 'STN': 1.00, 'SRD': 1.00, 'SYP': 1.00, 'TWD': 1.00, 'TJS': 1.00,
  'TZS': 1.00,
  'TTD': 1.00,
  'TND': 1.00,
  'TRY': 1.00,
  'TMT': 1.00,
  'UGX': 1.00,
  'UAH': 1.00,
  'AED': 1.00,
  'UYU': 1.00,
  'UZS': 1.00,
  'VUV': 1.00,
  'VES': 1.00,
  'VED': 1.00,
  'VND': 1.00,
  'YER': 1.00,
  'ZMW': 1.00,
  'ZWG': 1.00,
};

export const initialSettings: Settings = {
  companyName: '',
  companyLogo: '',
  theme: 'light',
  defaultVat: 18,
  defaultMarkup: 70,
  currencyRates: defaultCurrencyRates,
  displayScale: 100,
  paymentCategories: [
    { id: 1, name: 'Rent' },
    { id: 2, name: 'Utilities' },
    { id: 3, name: 'Salaries' },
    { id: 4, name: 'Office Supplies' },
    { id: 5, name: 'Marketing' },
    { id: 6, name: 'Travel' },
    { id: 7, name: 'Maintenance' },
    { id: 8, name: 'Software Subscriptions' },
    { id: 9, name: 'initialCapital' },
    { id: 10, name: 'Withdrawal' }, // New: Withdrawal category
  ],
  mainCurrency: 'AZN',
  activeCurrencies: ['AZN', 'USD', 'EUR', 'RUB', 'GBP', 'CAD', 'CNY', 'INR', 'MXN', 'SEK', 'THB', 'AED', 'BHD', 'JOD', 'KWD', 'OMR', 'SGD'],
  showDashboardCurrencyRates: true,
  packingUnits: [
    { id: 1, name: 'Piece', baseUnit: 'piece', conversionFactor: 1 },
    { id: 2, name: 'Pack', baseUnit: 'piece', conversionFactor: 10 },
    { id: 3, name: 'Box', baseUnit: 'piece', conversionFactor: 100 },
    { id: 4, name: 'Bottle (ml)', baseUnit: 'ml', conversionFactor: 1 },
    { id: 5, name: 'Bottle (liter)', baseUnit: 'liter', conversionFactor: 1 },
    { id: 6, name: 'Barrel (liter)', baseUnit: 'liter', conversionFactor: 200 },
  ],
};