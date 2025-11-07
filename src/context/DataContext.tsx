"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { t } from '@/utils/i18n';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

// Import new hooks
import { useModals } from '@/hooks/useModals';
import { useInventoryManagement } from '@/hooks/useInventoryManagement';
import { useCrudOperations } from '@/hooks/useCrudOperations';

// --- MOCK CURRENT DATE (for consistency with original code) ---
export const MOCK_CURRENT_DATE = new Date('2025-10-29T15:53:00');

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
}

export interface Warehouse {
  id: number;
  name: string;
  location: string;
  type: 'Main' | 'Secondary'; // Added type field
}

export interface OrderItem {
  productId: number;
  qty: number;
  price: number;
  currency?: string; // For PO items
  landedCostPerUnit?: number; // For PO items (in AZN)
}

export interface PurchaseOrder {
  id: number;
  contactId: number; // Supplier ID
  orderDate: string;
  warehouseId: number;
  status: 'Draft' | 'Ordered' | 'Received';
  items: OrderItem[];
  currency: 'AZN' | 'USD' | 'EUR' | 'RUB';
  exchangeRate?: number; // Manual rate if entered
  transportationFees: number;
  transportationFeesCurrency: 'AZN' | 'USD' | 'EUR' | 'RUB';
  customFees: number;
  customFeesCurrency: 'AZN' | 'USD' | 'EUR' | 'RUB';
  additionalFees: number;
  additionalFeesCurrency: 'AZN' | 'USD' | 'EUR' | 'RUB';
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
  total: number; // Total in AZN (incl. VAT)
  productMovementId?: number; // New field to link to a generated product movement
}

export interface Payment {
  id: number;
  orderId: number; // Linked order ID, 0 for manual expense
  paymentCategory?: 'products' | 'fees' | 'manual'; // New field to specify what the payment is for
  manualDescription?: string; // For manual expenses
  date: string;
  amount: number;
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
  AZN: number;
}

export interface Settings {
  companyName: string;
  companyLogo: string;
  theme: 'light' | 'dark';
  defaultVat: number;
  defaultMarkup: number;
  currencyRates: CurrencyRates;
}

// --- Initial Data & Defaults ---
const initialCurrencyRates: CurrencyRates = { 'USD': 1.70, 'EUR': 2.00, 'RUB': 0.019, 'AZN': 1.00 };

export const initialData = { // Export initialData for use in useCrudOperations
  warehouses: [
    { id: 1, name: 'Main Warehouse', location: 'Baku, Azerbaijan', type: 'Main' } as Warehouse,
    { id: 2, name: 'Secondary Hub', location: 'Ganja, Azerbaijan', type: 'Secondary' } as Warehouse
  ],
  products: [
    { id: 1, name: 'Laptop Pro 15"', sku: 'LP15-PRO', category: 'Electronics', description: 'High-end professional laptop', stock: { 1: 50, 2: 20 }, minStock: 10, averageLandedCost: 1200.00, imageUrl: '' } as Product,
    { id: 2, name: 'Wireless Mouse', sku: 'WM-001', category: 'Accessories', description: 'Ergonomic wireless mouse', stock: { 1: 150, 2: 75 }, minStock: 25, averageLandedCost: 8.50, imageUrl: '' } as Product,
    { id: 3, name: 'Mechanical Keyboard', sku: 'MK-ELITE', category: 'Accessories', description: 'Gaming mechanical keyboard', stock: { 1: 80, 2: 30 }, minStock: 15, averageLandedCost: 45.00, imageUrl: '' } as Product
  ],
  suppliers: [{ id: 1, name: 'Tech Supplies Inc.', contact: 'John Doe', email: 'john@techsupplies.com', phone: '+1234567890', address: '123 Tech Road' }] as Supplier[],
  customers: [{ id: 1, name: 'Global Innovations Ltd.', contact: 'Jane Smith', email: 'jane@globalinnovations.com', phone: '+9876543210', address: '456 Business Ave' }] as Customer[],
  purchaseOrders: [] as PurchaseOrder[],
  sellOrders: [] as SellOrder[],
  incomingPayments: [] as Payment[],
  outgoingPayments: [] as Payment[],
  productMovements: [] as ProductMovement[],
};

const initialSettings: Settings = {
  companyName: '',
  companyLogo: '',
  theme: 'light',
  defaultVat: 18,
  defaultMarkup: 70,
  currencyRates: initialCurrencyRates,
};

// --- Context Definition ---
interface DataContextType {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  warehouses: Warehouse[];
  setWarehouses: React.Dispatch<React.SetStateAction<Warehouse[]>>;
  purchaseOrders: PurchaseOrder[];
  setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  sellOrders: SellOrder[];
  setSellOrders: React.Dispatch<React.SetStateAction<SellOrder[]>>;
  incomingPayments: Payment[];
  setIncomingPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  outgoingPayments: Payment[];
  setOutgoingPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  productMovements: ProductMovement[];
  setProductMovements: React.Dispatch<React.SetStateAction<ProductMovement[]>>;
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  currencyRates: CurrencyRates;
  setCurrencyRates: React.Dispatch<React.SetStateAction<CurrencyRates>>;
  
  // CRUD operations
  saveItem: (key: keyof typeof initialData, item: any) => void;
  deleteItem: (key: keyof typeof initialData, id: number) => void;
  getNextId: (key: keyof typeof initialData) => number;
  setNextIdForCollection: (key: keyof typeof initialData, nextId: number) => void; // New function
  updateStockFromOrder: (newOrder: PurchaseOrder | SellOrder | null, oldOrder: PurchaseOrder | SellOrder | null) => void;
  updateAverageCosts: (purchaseOrder: PurchaseOrder) => void;

  // Modals
  showAlertModal: (title: string, message: string) => void;
  showConfirmationModal: (title: string, message: string, onConfirm: () => void) => void;
  isConfirmationModalOpen: boolean;
  confirmationModalProps: { title: string; message: string; onConfirm: () => void } | null;
  closeConfirmationModal: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [initialized, setInitialized] = useLocalStorage<boolean>('initialized', false);

  const [products, setProducts] = useLocalStorage<Product[]>('products', []);
  const [suppliers, setSuppliers] = useLocalStorage<Supplier[]>('suppliers', []);
  const [customers, setCustomers] = useLocalStorage<Customer[]>('customers', []);
  const [warehouses, setWarehouses] = useLocalStorage<Warehouse[]>('warehouses', []);
  const [purchaseOrders, setPurchaseOrders] = useLocalStorage<PurchaseOrder[]>('purchaseOrders', []);
  const [sellOrders, setSellOrders] = useLocalStorage<SellOrder[]>('sellOrders', []);
  const [incomingPayments, setIncomingPayments] = useLocalStorage<Payment[]>('incomingPayments', []);
  const [outgoingPayments, setOutgoingPayments] = useLocalStorage<Payment[]>('outgoingPayments', []);
  const [productMovements, setProductMovements] = useLocalStorage<ProductMovement[]>('productMovements', []);

  const [settings, setSettings] = useLocalStorage<Settings>('settings', initialSettings);
  const [currencyRates, setCurrencyRates] = useLocalStorage<CurrencyRates>('currencyRates', initialCurrencyRates);

  // Internal state for next IDs, managed by DataProvider
  const [nextIds, setNextIds] = useLocalStorage<{ [key: string]: number }>('nextIds', {
    products: 1, suppliers: 1, customers: 1, warehouses: 1, purchaseOrders: 1, sellOrders: 1, incomingPayments: 1, outgoingPayments: 1, productMovements: 1
  });

  // Use the new modals hook
  const {
    showAlertModal,
    showConfirmationModal,
    isConfirmationModalOpen,
    confirmationModalProps,
    closeConfirmationModal,
  } = useModals();

  // Use the new inventory management hook
  const {
    updateStockFromOrder,
    updateAverageCosts,
  } = useInventoryManagement({ products, setProducts });

  // Use the new CRUD operations hook
  const {
    getNextId,
    setNextIdForCollection,
    saveItem,
    deleteItem,
  } = useCrudOperations({
    products, setProducts,
    suppliers, setSuppliers,
    customers, setCustomers,
    warehouses, setWarehouses,
    purchaseOrders, setPurchaseOrders,
    sellOrders, setSellOrders,
    incomingPayments, setIncomingPayments,
    outgoingPayments, setOutgoingPayments,
    productMovements, setProductMovements,
    nextIds, setNextIds,
    showAlertModal, showConfirmationModal,
    updateStockFromOrder,
  });

  // --- Initialization Logic ---
  useEffect(() => {
    if (!initialized) {
      // Initialize with dummy data
      setWarehouses(initialData.warehouses);
      setProducts(initialData.products);
      setSuppliers(initialData.suppliers);
      setCustomers(initialData.customers);
      setPurchaseOrders(initialData.purchaseOrders);
      setSellOrders(initialData.sellOrders);
      setIncomingPayments(initialData.incomingPayments);
      setOutgoingPayments(initialData.outgoingPayments);
      setProductMovements(initialData.productMovements);
      setSettings(initialSettings);
      setCurrencyRates(initialCurrencyRates);

      // Initialize nextIds based on initial data
      const initialNextIds: { [key: string]: number } = {};
      (Object.keys(initialData) as (keyof typeof initialData)[]).forEach(key => {
        const items = initialData[key];
        if (Array.isArray(items) && items.length > 0) {
          initialNextIds[key] = Math.max(...items.map((i: any) => i.id)) + 1;
        } else {
          initialNextIds[key] = 1;
        }
      });
      setNextIds(initialNextIds);
      setInitialized(true);
    }
  }, [initialized, setInitialized, setProducts, setSuppliers, setCustomers, setWarehouses, setPurchaseOrders, setSellOrders, setIncomingPayments, setOutgoingPayments, setProductMovements, setSettings, setCurrencyRates, setNextIds]);

  const productsWithTotalStock = useMemo(() => {
    return products.map(p => ({
      ...p,
      totalStock: Object.values(p.stock || {}).reduce((a, b) => a + b, 0),
    }));
  }, [products]);

  const value = {
    products: productsWithTotalStock, setProducts, // Provide products with totalStock
    suppliers, setSuppliers,
    customers, setCustomers,
    warehouses, setWarehouses,
    purchaseOrders, setPurchaseOrders,
    sellOrders, setSellOrders,
    incomingPayments, setIncomingPayments,
    outgoingPayments, setOutgoingPayments,
    productMovements, setProductMovements,
    settings, setSettings,
    currencyRates, setCurrencyRates,
    saveItem, deleteItem, getNextId, setNextIdForCollection,
    updateStockFromOrder, updateAverageCosts,
    showAlertModal, showConfirmationModal,
    isConfirmationModalOpen, confirmationModalProps, closeConfirmationModal,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
      {confirmationModalProps && (
        <AlertDialog open={isConfirmationModalOpen} onOpenChange={setIsConfirmationModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmationModalProps.title}</AlertDialogTitle>
              <AlertDialogDescription>{confirmationModalProps.message}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={closeConfirmationModal}>{t('cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={() => { confirmationModalProps.onConfirm(); closeConfirmationModal(); }}>
                {t('delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};