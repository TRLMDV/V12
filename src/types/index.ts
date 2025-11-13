// --- Data Types ---
export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  description: string;
  stock: { [warehouseId: number]: number }; // Stock is always in base units (pieces or ml/liter)
  minStock: number;
  averageLandedCost: number; // Stored in Main Currency
  imageUrl: string;
  defaultPackingUnitId?: number; // New: Default packing unit for this product
  totalStock?: number; // Added for easier export/display
}

export interface Supplier {
  id: number;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
}

export interface Customer {
  id: number;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  defaultWarehouseId?: number; // New field for default warehouse
}

export interface Warehouse {
  id: number;
  name: string;
  location: string;
  type: 'Main' | 'Secondary'; // Added type field
}

export type Currency = 'AZN' | 'USD' | 'EUR' | 'RUB' | 'JPY' | 'GBP' | 'AUD' | 'CAD' | 'CHF' | 'CNY' | 'KWD' | 'BHD' | 'OMR' | 'JOD' | 'GIP' | 'KYD' | 'KRW' | 'SGD' | 'INR' | 'MXN' | 'SEK' | 'THB' | 'AFN' | 'ALL' | 'DZD' | 'AOA' | 'XCD' | 'ARS' | 'AMD' | 'AWG' | 'SHP' | 'BSD' | 'BDT' | 'BBD' | 'BYN' | 'BZD' | 'XOF' | 'BMD' | 'BTN' | 'BOB' | 'BAM' | 'BWP' | 'BRL' | 'BND' | 'BGN' | 'BIF' | 'KHR' | 'XAF' | 'CVE' | 'CDF' | 'KMF' | 'NZD' | 'CRC' | 'CUP' | 'XCG' | 'CZK' | 'DKK' | 'DJF' | 'DOP' | 'EGP' | 'ERN' | 'SZL' | 'ZAR' | 'ETB' | 'FKP' | 'FJD' | 'XPF' | 'GMD' | 'GEL' | 'GHS' | 'GTQ' | 'GNF' | 'GYD' | 'HTG' | 'HNL' | 'HKD' | 'HUF' | 'ISK' | 'IDR' | 'IRR' | 'IQD' | 'ILS' | 'JMD' | 'KZT' | 'KES' | 'KPW' | 'KGS' | 'LAK' | 'LBP' | 'LSL' | 'LRD' | 'LYD' | 'MDL' | 'MOP' | 'MGA' | 'MWK' | 'MYR' | 'MVR' | 'MRU' | 'MZN' | 'MMK' | 'NAD' | 'NPR' | 'NIO' | 'NGN' | 'NOK' | 'PKR' | 'PGK' | 'PYG' | 'PEN' | 'PHP' | 'PLN' | 'QAR' | 'RON' | 'RSD' | 'SCR' | 'SLE' | 'SBD' | 'SOS' | 'SSP' | 'STN' | 'SRD' | 'SYP' | 'TWD' | 'TJS' | 'TZS' | 'TTD' | 'TND' | 'TRY' | 'TMT' | 'UGX' | 'UAH' | 'AED' | 'UYU' | 'UZS' | 'VUV' | 'VES' | 'VED' | 'VND' | 'YER' | 'ZMW' | 'ZWG';

export interface BankAccount {
  id: number;
  name: string;
  currency: Currency;
  initialBalance: number; // The starting balance when the account is created
}

export interface Payment {
  id: number;
  orderId: number; // Linked order ID, 0 for manual expense
  bankAccountId: number; // New: Link to a specific bank account
  paymentCategory?: 'products' | 'transportationFees' | 'customFees' | 'additionalFees' | 'manual' | string; // Updated to allow custom string categories
  manualDescription?: string; // For manual expenses
  date: string;
  amount: number; // Amount in paymentCurrency
  paymentCurrency: Currency; // New: Currency of the payment
  paymentExchangeRate?: number; // New: Exchange rate to AZN if not AZN
  method: string;
}

export interface ProductMovement {
  id: number;
  sourceWarehouseId: number;
  destWarehouseId: number;
  items: { productId: number; quantity: number }[];
  date: string;
}

export interface CurrencyRates {
  USD: number;
  EUR: number;
  RUB: number;
  JPY: number;
  GBP: number;
  AUD: number;
  CAD: number;
  CHF: number;
  CNY: number;
  KWD: number;
  BHD: number;
  OMR: number;
  JOD: number;
  GIP: number;
  KYD: number;
  KRW: number;
  SGD: number;
  INR: number;
  MXN: number;
  SEK: number;
  THB: number;
  AZN: number; // AZN is always 1.00, but included for consistency
  AFN: number;
  ALL: number;
  DZD: number;
  AOA: number;
  XCD: number;
  ARS: number;
  AMD: number;
  AWG: number;
  SHP: number;
  BSD: number;
  BDT: number;
  BBD: number;
  BYN: number;
  BZD: number;
  XOF: number;
  BMD: number;
  BTN: number;
  BOB: number;
  BAM: number;
  BWP: number;
  BRL: number;
  BND: number;
  BGN: number;
  BIF: number;
  KHR: number;
  XAF: number;
  CVE: number;
  CDF: number;
  KMF: number;
  NZD: number;
  CRC: number;
  CUP: number;
  XCG: number;
  CZK: number;
  DKK: number;
  DJF: number;
  DOP: number;
  EGP: number;
  ERN: number;
  SZL: number;
  ZAR: number;
  ETB: number;
  FKP: number;
  FJD: number;
  XPF: number;
  GMD: number;
  GEL: number;
  GHS: number;
  GTQ: number;
  GNF: number;
  GYD: number;
  HTG: number;
  HNL: number;
  HKD: number;
  HUF: number;
  ISK: number;
  IDR: number;
  IRR: number;
  IQD: number;
  ILS: number;
  JMD: number;
  KZT: number;
  KES: number;
  KPW: number;
  KGS: number;
  LAK: number;
  LBP: number;
  LSL: number;
  LRD: number;
  LYD: number;
  MDL: number;
  MOP: number;
  MGA: number;
  MWK: number;
  MYR: number;
  MVR: number;
  MRU: number;
  MZN: number;
  MMK: number;
  NAD: number;
  NPR: number;
  NIO: number;
  NGN: number;
  NOK: number;
  PKR: number;
  PGK: number;
  PYG: number;
  PEN: number;
  PHP: number;
  PLN: number;
  QAR: number;
  RON: number;
  RSD: number;
  SCR: number;
  SLE: number;
  SBD: number;
  SOS: number;
  SSP: number;
  STN: number;
  SRD: number;
  SYP: number;
  TWD: number;
  TJS: number;
  TZS: number;
  TTD: number;
  TND: number;
  TRY: number;
  TMT: number;
  UGX: number;
  UAH: number;
  AED: number;
  UYU: number;
  UZS: number;
  VUV: number;
  VES: number;
  VED: number;
  VND: number;
  YER: number;
  ZMW: number;
  ZWG: number;
}

export interface Settings {
  companyName: string;
  companyLogo: string;
  theme: 'light' | 'dark';
  defaultVat: number;
  defaultMarkup: number;
  currencyRates: CurrencyRates;
  displayScale: number; // New: Program display scaling percentage
  paymentCategories: PaymentCategorySetting[]; // New: Custom payment categories
  mainCurrency: Currency; // New: Main currency for the application
  activeCurrencies: Currency[]; // New: Currencies the user wants to actively use
  showDashboardCurrencyRates: boolean; // New: Toggle for dashboard currency rates visibility
  packingUnits: PackingUnit[]; // New: Custom packing units
}

// --- Recycle Bin Types ---
export type CollectionKey = 'products' | 'suppliers' | 'customers' | 'warehouses' | 'purchaseOrders' | 'sellOrders' | 'incomingPayments' | 'outgoingPayments' | 'productMovements' | 'packingUnits' | 'paymentCategories' | 'bankAccounts';

export interface RecycleBinItem {
  id: string; // Unique ID for the recycle bin entry
  originalId: number; // The ID of the deleted item
  collectionKey: CollectionKey; // The original collection key (e.g., 'products')
  data: any; // The actual deleted item object
  deletedAt: string; // ISO string timestamp of deletion
}