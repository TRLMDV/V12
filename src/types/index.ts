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
  description?: string;
  imageUrl?: string;
  category: string;
  averageLandedCost: number; // Average cost including purchase price, fees, etc.
  stock: { [warehouseId: number]: number }; // Stock quantity per warehouse
  minStockLevel: number;
  status: ProductStatus;
  packingUnits?: PackingUnit[]; // Optional: List of packing units for this product
}

export interface PackingUnit extends BaseItem {
  baseUnit: string; // e.g., 'piece', 'liter', 'kg'
  conversionFactor: number; // How many base units in this packing unit (e.g., 10 for 'Pack' if base is 'piece')
}

export interface Warehouse extends BaseItem {
  location: string;
  type: 'Main' | 'Storage' | 'Retail';
}

// --- Contacts ---
export interface Supplier extends BaseItem {
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  defaultCurrency?: Currency;
}

export interface Customer extends BaseItem {
  contactPerson?: string;
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
  orderDate: string; // ISO date string
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
  orderDate: string; // ISO date string
  status: SellOrderStatus;
  items: OrderItem[];
  vatPercent: number;
  total: number; // Total in main currency
  currency: Currency; // Currency of the order items
  exchangeRate?: number; // Rate to main currency if not main currency
  productMovementId?: Id; // Link to generated product movement
  incomingPaymentId?: Id; // Link to generated incoming payment
  comment?: string; // New: Optional comment field
}

export interface PurchaseOrderItemState {
  productId: number | '';
  qty: number | string;
  price: number | string;
  itemTotal: number | string;
  currency: Currency;
  landedCostPerUnit?: number;
  packingUnitId?: number;
  packingQuantity?: number | string;
}

// --- Payments ---
export type PaymentType = 'Incoming' | 'Outgoing';
export type PaymentStatus = 'Paid' | 'Partially Paid' | 'Unpaid';
export type PaymentCategory = 'products' | 'Rent' | 'Utilities' | 'Salaries' | 'Office Supplies' | 'Marketing' | 'Travel' | 'Maintenance' | 'Software Subscriptions' | 'initialCapital' | 'Withdrawal' | 'Manual Expense'; // Added 'Manual Expense'

export interface Payment {
  id: Id;
  orderId?: Id; // Linked PurchaseOrder or SellOrder ID
  paymentCategory: PaymentCategory;
  date: string; // ISO date string
  amount: number;
  paymentCurrency: Currency;
  paymentExchangeRate?: number; // Rate to main currency if not main currency
  method: string; // e.g., "Bank Transfer", "Cash", "Credit Card"
  bankAccountId?: Id; // New: Link to bank account
  description?: string; // New: Optional description for manual payments
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
  date: string; // ISO date string
}

// --- Utilization Order ---
export interface UtilizationOrder {
  id: Id;
  warehouseId: Id;
  orderDate: string; // ISO date string
  items: { productId: Id; qty: number; packingUnitId?: Id; packingQuantity?: number }[];
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
  currentBalance: number;
  creationDate: string; // ISO date string
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
}

// --- Quick Buttons ---
export type QuickButtonAction =
  'quickPurchaseOrderAdd' | 'quickSellOrderAdd' | 'quickProductMovement' |
  'quickProductAdd' | 'quickSupplierAdd' | 'quickCustomerAdd' |
  'quickIncomingPaymentsAdd' | 'quickOutgoingPaymentsAdd' | 'quickWarehouseAdd' |
  'quickUtilization' | 'quickBankDeposit' | 'quickBankWithdrawal';

export type QuickButtonSize = 'sm' | 'md' | 'lg';
export type QuickButtonColor =
  'blue' | 'green' | 'red' | 'purple' | 'orange' | 'yellow' |
  'emerald' | 'indigo' | 'pink' | 'teal';

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
  date: string; // ISO date string (YYYY-MM-DDTHH:mm:ss.sssZ)
  message: string;
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
  saveItem: <T extends keyof DataState>(key: T, item: DataState[T][number]) => void;
  deleteItem: <T extends keyof DataState>(key: T, id: Id) => void;
  getNewId: () => Id;
  getNextId: (key: keyof DataState) => Id;
  updateStockFromOrder: (order: PurchaseOrder | SellOrder, oldOrder?: PurchaseOrder | SellOrder | null) => void;
  updateAverageCosts: (order: PurchaseOrder) => void;
  setSettings: (newSettings: Settings) => void;
  setProducts: (products: Product[]) => void; // New: Setter for products array
  setBankAccounts: (bankAccounts: BankAccount[]) => void; // New: Setter for bank accounts array
  addBankTransaction: (bankAccountId: Id, transaction: Omit<BankTransaction, 'id' | 'balance'>) => void;
  showAlertModal: (title: string, message: string) => void;
  showConfirmModal: (title: string, message: string, onConfirm: () => void) => void;
  currencyRates: CurrencyRates;
  packingUnitMap: { [id: number]: PackingUnit };
  convertCurrency: (amount: number, fromCurrency: Currency, toCurrency: Currency, customRate?: number) => number;
  getCurrencyRate: (fromCurrency: Currency, toCurrency: Currency) => number;
  getCurrencySymbol: (currencyCode: Currency) => string;
  getCurrencyName: (currencyCode: Currency) => string;
}

// --- Combined Context Type ---
export interface AppContextType extends DataState, DataActions { }