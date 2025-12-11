"use client";

import { LucideIcon } from 'lucide-react';

// --- Core Types ---
export type Id = number;

export interface BaseItem {
  id: Id;
  name: string;
}

// --- Product & Inventory ---
export type ProductStatus = 'Active' | 'Discontinued' | 'Low Stock';

export interface Product extends BaseItem {
  sku: string;
  barcode?: string; // New: Optional barcode field
  description?: string;
  imageUrl?: string;
  // category: string; // Removed as it's no longer used in the form
  averageLandedCost: number; // Average cost including purchase price, fees, etc.
  stock: { [warehouseId: number]: number }; // Stock quantity per warehouse
  minStock: number; // Renamed from minStockLevel
  status?: ProductStatus; // Made optional as it's not fully implemented
  defaultPackingUnitId?: Id; // New: Default packing unit for this product
}

export interface PackingUnit extends BaseItem {
  baseUnit: string; // e.g., 'piece', 'liter', 'kg'
  conversionFactor: number; // How many base units in this packing unit (e.g., 10 for 'Pack' if base is 'piece')
}

export interface Warehouse extends BaseItem {
  location: string;
  type: 'Main' | 'Secondary';
  expeditor?: string; // NEW: Optional expeditor name assigned to this warehouse
}

// --- Contacts ---
export interface Supplier extends BaseItem {
  contact?: string; // Renamed from contactPerson
  email?: string;
  phone?: string;
  address?: string;
  defaultCurrency?: Currency;
}

export interface Customer extends BaseItem {
  contact?: string; // Renamed from contactPerson
  email?: string;
  phone?: string;
  address?: string;
  defaultWarehouseId?: Id; // New: Default warehouse for sales
}

// --- Orders ---
export type OrderStatus = 'Draft' | 'Ordered' | 'Received'; // For Purchase Orders
export type SellOrderStatus = 'Draft' | 'Confirmed' | 'Shipped'; // For Sell Orders

export interface OrderItem {
  productId: Id;
  qty: number; // Quantity in base units
  price: number; // Price per base unit
  currency: Currency;
  landedCostPerUnit?: number; // For sell orders, to calculate profit
  packingUnitId?: Id; // Optional: ID of the packing unit used for this item
  packingQuantity?: number; // Optional: Quantity in packing units
}

export interface PurchaseOrder {
  id: Id;
  contactId: Id; // Supplier ID
  warehouseId: Id; // Destination warehouse ID
  orderDate: string; // ISO date string (YYYY-MM-DDTHH:mm:ss.sssZ)
  status: OrderStatus;
  items: OrderItem[];
  currency: Currency; // Currency of the order items
  exchangeRate?: number; // Rate to main currency if not main currency
  fees: number; // Total fees for the order
  feesCurrency: Currency; // Currency of the fees
  feesExchangeRate?: number; // Rate for fees currency to main currency
  comment?: string; // New: Optional comment field
  total: number; // Total in main currency
}

export interface SellOrder {
  id: Id;
  contactId: Id; // Customer ID
  warehouseId: Id; // Source warehouse ID
  orderDate: string; // ISO date string (YYYY-MM-DDTHH:mm:ss.sssZ)
  status: SellOrderStatus;
  items: OrderItem[];
  vatPercent: number;
  total: number; // Total in main currency
  currency: Currency; // Currency of the order items
  exchangeRate?: number; // Rate to main currency if not main currency
  productMovementId?: Id; // Link to generated product movement
  incomingPaymentId?: Id; // Link to generated incoming payment
}

export interface PurchaseOrderItemState {
  productId: number | '';
  qty: number | string;
  price: number | string;
  itemTotal: number | string;
  currency: Currency;
  landedCostPerUnit?: number; // For sell orders, to calculate profit
  packingUnitId?: number; // Optional: ID of the packing unit used for this item
  packingQuantity?: number | string; // Optional: Quantity in packing units
}

// --- Payments ---
export type PaymentType = 'Incoming' | 'Outgoing';
export type PaymentStatus = 'Paid' | 'Partially Paid' | 'Unpaid';
// Simplified PaymentCategory to reflect actual stored values or custom names
export type PaymentCategory = 'products' | 'fees' | 'initialCapital' | 'Withdrawal' | string;

export interface Payment {
  id: Id;
  orderId?: Id; // Linked PurchaseOrder or SellOrder ID
  paymentCategory?: PaymentCategory; // Made optional, can be a custom string from settings
  manualDescription?: string; // Renamed from description for clarity
  date: string; // ISO date string (YYYY-MM-DDTHH:mm:ss.sssZ)
  amount: number;
  paymentCurrency: Currency;
  paymentExchangeRate?: number; // Rate to main currency if not main currency
  method: string; // e.g., "Bank Transfer", "Cash", "Credit Card"
  bankAccountId?: Id; // New: Link to bank account
}

export interface PaymentCategorySetting {
  id: Id;
  name: string;
}

// --- Product Movement ---
export interface ProductMovement {
  id: Id;
  sourceWarehouseId: Id;
  destWarehouseId: Id;
  items: { productId: Id; quantity: number }[];
  date: string; // ISO date string (YYYY-MM-DDTHH:mm:ss.sssZ)
}

// --- Utilization Order ---
export interface UtilizationOrder {
  id: Id;
  warehouseId: Id;
  date: string; // Renamed from orderDate (ISO date string YYYY-MM-DDTHH:mm:ss.sssZ)
  items: { productId: Id; quantity: number }[]; // Simplified items structure
  comment?: string; // Optional comment field
}

// --- Finance ---
export type Currency = 'AZN' | 'USD' | 'EUR' | 'RUB' | 'JPY' | 'GBP' | 'AUD' | 'CAD' | 'CHF' | 'CNY' | 'KWD' | 'BHD' | 'OMR' | 'JOD' | 'GIP' | 'KYD' | 'KRW' | 'SGD' | 'INR' | 'MXN' | 'SEK' | 'THB' | 'AFN' | 'ALL' | 'DZD' | 'AOA' | 'XCD' | 'ARS' | 'AMD' | 'AWG' | 'SHP' | 'BSD' | 'BDT' | 'BBD' | 'BYN' | 'BZD' | 'XOF' | 'BMD' | 'BTN' | 'BOB' | 'BAM' | 'BWP' | 'BRL' | 'BND' | 'BGN' | 'BIF' | 'KHR' | 'XAF' | 'CVE' | 'CDF' | 'KMF' | 'NZD' | 'CRC' | 'CUP' | 'XCG' | 'CZK' | 'DKK' | 'DJF' | 'DOP' | 'EGP' | 'ERN' | 'SZL' | 'ZAR' | 'ETB' | 'FKP' | 'FJD' | 'XPF' | 'GMD' | 'GEL' | 'GHS' | 'GTQ' | 'GNF' | 'GYD' | 'HTG' | 'HNL' | 'HKD' | 'HUF' | 'ISK' | 'IDR' | 'IRR' | 'IQD' | 'ILS' | 'JMD' | 'KZT' | 'KES' | 'KPW' | 'KGS' | 'LAK' | 'LBP' | 'LSL' | 'LRD' | 'LYD' | 'MDL' | 'MOP' | 'MGA' | 'MWK' | 'MYR' | 'MVR' | 'MRU' | 'MZN' | 'MMK' | 'NAD' | 'NPR' | 'NIO' | 'NGN' | 'NOK' | 'PKR' | 'PGK' | 'PYG' | 'PEN' | 'PHP' | 'PLN' | 'QAR' | 'RON' | 'RSD' | 'SCR' | 'SLE' | 'SBD' | 'SOS' | 'SSP' | 'STN' | 'SRD' | 'SYP' | 'TWD' | 'TJS' | 'TZS' | 'TTD' | 'TND' | 'TRY' | 'TMT' | 'UGX' | 'UAH' | 'AED' | 'UYU' | 'UZS' | 'VUV' | 'VES' | 'VED' | 'VND' | 'YER' | 'ZMW' | 'ZWG';

export interface CurrencyRates {
  [key: string]: number; // e.g., { "USD": 1.70, "EUR": 2.00 }
}

export interface BankAccount extends BaseItem {
  currency: Currency;
  initialBalance: number;
  // currentBalance: number; // Removed as it's a derived value
  creationDate: string; // ISO date string (YYYY-MM-DDTHH:mm:ss.sssZ)
}

export interface BankTransaction {
  id: Id;
  date: string; // ISO date string
  description: string;
  incoming: number; // Amount in account's currency
  outgoing: number; // Amount in account's currency
  balance: number; // Current balance after this transaction
  paymentId?: Id; // Link to a payment if applicable
}

// --- Settings ---
export type AppTheme = 'light' | 'dark';

export interface Settings {
  companyName: string;
  companyLogo?: string; // URL or base64
  theme: AppTheme;
  defaultVat: number; // Default VAT percentage
  defaultMarkup: number; // Default markup percentage for sales
  currencyRates: CurrencyRates;
  displayScale: number; // e.g., 100, 125, 150
  paymentCategories: PaymentCategorySetting[];
  mainCurrency: Currency;
  activeCurrencies: Currency[];
  showDashboardCurrencyRates: boolean;
  showSalesChartOnDashboard: boolean; // New: Setting for sales chart visibility
  showClockOnDashboard: boolean; // New: Setting for clock visibility
  showCalendarOnDashboard: boolean; // New: Setting for calendar visibility
  packingUnits: PackingUnit[];
  quickButtons: QuickButton[]; // New: Quick buttons for dashboard
  reminders: Reminder[]; // New: Reminders for calendar
  language?: 'en' | 'ru'; // New: App language
  expeditorProfitDivisor?: number; // NEW: Configurable divisor (e.g., 1.17) for expeditor profit
}

// --- Quick Buttons ---
export type QuickButtonAction =
  'addPurchaseOrder' | 'addSellOrder' | 'addProductMovement' |
  'addProduct' | 'addSupplier' | 'addCustomer' |
  'addIncomingPayment' | 'addOutgoingPayment' | 'addWarehouse' |
  'addUtilizationOrder' | 'bankDeposit' | 'bankWithdrawal';

export type QuickButtonColor =
  'bg-blue-500 hover:bg-blue-600' | 'bg-green-500 hover:bg-green-600' | 'bg-red-500 hover:bg-red-600' |
  'bg-purple-500 hover:bg-purple-600' | 'bg-orange-500 hover:bg-orange-600' | 'bg-yellow-500 hover:bg-yellow-600' |
  'bg-emerald-500 hover:bg-emerald-600' | 'bg-indigo-500 hover:bg-indigo-600' | 'bg-pink-500 hover:bg-pink-600' |
  'bg-teal-500 hover:bg-teal-600';

export type QuickButtonSize = 'sm' | 'md' | 'lg';

export interface QuickButton extends BaseItem {
  label: string;
  action: QuickButtonAction;
  size: QuickButtonSize;
  color: QuickButtonColor;
  icon?: keyof typeof import('lucide-react'); // Optional Lucide icon name
}

// --- Reminders ---
export interface Reminder {
  id: Id;
  dateTime: string; // Renamed from date (ISO date string YYYY-MM-DDTHH:mm:ss.sssZ)
  message: string;
}

// --- Recycle Bin ---
export type CollectionKey =
  'products' | 'suppliers' | 'customers' | 'warehouses' | 'purchaseOrders' | 'sellOrders' |
  'incomingPayments' | 'outgoingPayments' | 'productMovements' | 'utilizationOrders' |
  'paymentCategories' | 'packingUnits' | 'bankAccounts' | 'quickButtons' | 'reminders';

export interface RecycleBinItem {
  id: string; // Unique ID for the recycle bin item (e.g., 'products-1-timestamp')
  originalId: Id; // Original ID of the item
  collectionKey: CollectionKey;
  data: any; // The full item data
  deletedAt: string; // ISO date string
}

// --- Data Context State ---
export interface DataState {
  warehouses: Warehouse[];
  products: Product[];
  suppliers: Supplier[];
  customers: Customer[];
  purchaseOrders: PurchaseOrder[];
  sellOrders: SellOrder[];
  incomingPayments: Payment[];
  outgoingPayments: Payment[];
  productMovements: ProductMovement[];
  bankAccounts: BankAccount[];
  utilizationOrders: UtilizationOrder[]; // New: Utilization Orders
  settings: Settings;
}

// --- Data Context Actions ---
export interface DataActions {
  saveItem: <T extends CollectionKey>(key: T, item: any) => void;
  deleteItem: (key: CollectionKey, id: Id) => void;
  getNextId: (key: CollectionKey) => Id;
  setNextIdForCollection: (key: CollectionKey, nextId: Id) => void;
  updateStockFromOrder: (newOrder: PurchaseOrder | SellOrder | null, oldOrder: PurchaseOrder | SellOrder | null) => void;
  updateAverageCosts: (purchaseOrder: PurchaseOrder) => void;
  updateStockForUtilization: (newOrder: UtilizationOrder | null, oldOrder: UtilizationOrder | null) => void;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setBankAccounts: React.Dispatch<React.SetStateAction<BankAccount[]>>;
  showAlertModal: (title: string, message: string) => void;
  showConfirmationModal: (title: string, message: string, onConfirm: () => void, actionLabel?: string) => void;
  currencyRates: CurrencyRates;
  packingUnitMap: { [id: number]: PackingUnit };
  warehouseMap: { [id: number]: Warehouse };
  convertCurrency: (amount: number, fromCurrency: Currency, toCurrency: Currency) => number;
  runningBalancesMap: Map<number, Map<string, number>>;
  nextIds: { [key: string]: number };
  setNextIds: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>;
  recycleBin: RecycleBinItem[];
  setRecycleBin: React.Dispatch<React.SetStateAction<RecycleBinItem[]>>;
  addToRecycleBin: (item: any, collectionKey: CollectionKey) => void;
  restoreFromRecycleBin: (recycleItemId: string) => void;
  deletePermanentlyFromRecycleBin: (recycleItemId: string) => void;
  cleanRecycleBin: () => void;
  getItemSummary: (item: any, collectionKey: CollectionKey) => string;
}

// --- Combined Context Type ---
export interface AppContextType extends DataState, DataActions { }