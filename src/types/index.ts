// --- Data Types ---
export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  description: string;
  stock: { [warehouseId: number]: number };
  minStock: number;
  averageLandedCost: number;
  imageUrl: string;
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

export type Currency = 'AZN' | 'USD' | 'EUR' | 'RUB' | 'JPY' | 'GBP' | 'AUD' | 'CAD' | 'CHF' | 'CNY' | 'KWD' | 'BHD' | 'OMR' | 'JOD' | 'GIP' | 'KYD' | 'KRW' | 'SGD' | 'INR' | 'MXN' | 'SEK' | 'THB';

export interface OrderItem {
  productId: number;
  qty: number;
  price: number;
  currency?: Currency; // For PO items
  landedCostPerUnit?: number; // For PO items (in AZN)
}

export interface PurchaseOrder {
  id: number;
  contactId: number; // Supplier ID
  orderDate: string;
  warehouseId: number;
  status: 'Draft' | 'Ordered' | 'Received';
  items: OrderItem[];
  currency: Currency;
  exchangeRate?: number; // Manual rate if entered
  transportationFees: number;
  transportationFeesCurrency: Currency;
  customFees: number;
  customFeesCurrency: Currency;
  additionalFees: number;
  additionalFeesCurrency: Currency;
  total: number; // Total Landed Cost in AZN
}

export interface SellOrder {
  id: number;
  contactId: number; // Customer ID
  orderDate: string;
  warehouseId: number;
  status: 'Draft' | 'Confirmed' | 'Shipped';
  items: OrderItem[];
  vatPercent: number;
  total: number; // Total in Main Currency (incl. VAT)
  productMovementId?: number; // New field to link to a generated product movement
  incomingPaymentId?: number; // New field to link to a generated incoming payment
}

export interface PaymentCategorySetting {
  id: number;
  name: string;
}

export interface Payment {
  id: number;
  orderId: number; // Linked order ID, 0 for manual expense
  paymentCategory?: 'products' | 'transportationFees' | 'customFees' | 'additionalFees' | 'manual' | string; // Updated to allow custom string categories
  manualDescription?: string; // For manual expenses
  date: string;
  amount: number; // Amount in paymentCurrency
  paymentCurrency: Currency; // New: Currency of the payment
  paymentExchangeRate?: number; // New: Exchange rate to AZN if not AZN
  method: string;
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
}

// --- Recycle Bin Types ---
export type CollectionKey = keyof Omit<typeof initialData, 'settings' | 'currencyRates'>; // Exclude settings/currencyRates from direct deletion

export interface RecycleBinItem {
  id: string; // Unique ID for the recycle bin entry
  originalId: number; // The ID of the deleted item
  collectionKey: CollectionKey; // The original collection key (e.g., 'products')
  data: any; // The actual deleted item object
  deletedAt: string; // ISO string timestamp of deletion
}