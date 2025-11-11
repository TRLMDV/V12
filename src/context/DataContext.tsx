"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { t } from '@/utils/i18n';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

// Import new hooks
import { useModals } from '@/hooks/useModals';
import { useInventoryManagement } from '@/hooks/useInventoryManagement';
import { useCrudOperations } from '@/hooks/useCrudOperations';

// Import all data types from the new types file
import {
  Product, Supplier, Customer, Warehouse, OrderItem, PurchaseOrder, SellOrder, Payment, ProductMovement,
  CurrencyRates, Settings, RecycleBinItem, CollectionKey, PaymentCategorySetting, Currency
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
};

const defaultCurrencyRates: CurrencyRates = {
  'USD': 1.70, 'EUR': 2.00, 'RUB': 0.019, 'AZN': 1.00,
  'JPY': 0.011, 'GBP': 2.15, 'AUD': 1.10, 'CAD': 1.25, 'CHF': 1.85, 'CNY': 0.24,
  'KWD': 5.50, 'BHD': 4.50, 'OMR': 4.40, 'JOD': 2.40, 'GIP': 2.15, 'KYD': 2.05,
  'KRW': 0.0013, 'SGD': 1.28, 'INR': 0.020, 'MXN': 0.095, 'SEK': 0.18, 'THB': 0.048,
  'AFN': 1.00, 'ALL': 1.00, 'DZD': 1.00, 'AOA': 1.00, 'XCD': 1.00, 'ARS': 1.00, 'AMD': 1.00, 'AWG': 1.00, 'SHP': 1.00, 'BSD': 1.00, 'BDT': 1.00, 'BBD': 1.00, 'BYN': 1.00, 'BZD': 1.00, 'XOF': 1.00, 'BMD': 1.00, 'BTN': 1.00, 'BOB': 1.00, 'BAM': 1.00, 'BWP': 1.00, 'BRL': 1.00, 'BND': 1.00, 'BGN': 1.00, 'BIF': 1.00, 'KHR': 1.00, 'XAF': 1.00, 'CVE': 1.00, 'CDF': 1.00, 'KMF': 1.00, 'NZD': 1.00, 'CRC': 1.00, 'CUP': 1.00, 'XCG': 1.00, 'CZK': 1.00, 'DKK': 1.00, 'DJF': 1.00, 'DOP': 1.00, 'EGP': 1.00, 'ERN': 1.00, 'SZL': 1.00, 'ZAR': 1.00, 'ETB': 1.00, 'FKP': 1.00, 'FJD': 1.00, 'XPF': 1.00, 'GMD': 1.00, 'GEL': 1.00, 'GHS': 1.00, 'GTQ': 1.00, 'GNF': 1.00, 'GYD': 1.00, 'HTG': 1.00, 'HNL': 1.00, 'HKD': 1.00, 'HUF': 1.00, 'ISK': 1.00, 'IDR': 1.00, 'IRR': 1.00, 'IQD': 1.00, 'ILS': 1.00, 'JMD': 1.00, 'KZT': 1.00, 'KES': 1.00, 'KPW': 1.00, 'KGS': 1.00, 'LAK': 1.00, 'LBP': 1.00, 'LSL': 1.00, 'LRD': 1.00, 'LYD': 1.00, 'MDL': 1.00, 'MOP': 1.00, 'MGA': 1.00, 'MWK': 1.00, 'MYR': 1.00, 'MVR': 1.00, 'MRU': 1.00, 'MZN': 1.00, 'MMK': 1.00, 'NAD': 1.00, 'NPR': 1.00, 'NIO': 1.00, 'NGN': 1.00, 'NOK': 1.00, 'PKR': 1.00, 'PGK': 1.00, 'PYG': 1.00, 'PEN': 1.00, 'PHP': 1.00, 'PLN': 1.00, 'QAR': 1.00, 'RON': 1.00, 'RSD': 1.00, 'SCR': 1.00, 'SLE: 1.00', 'SBD': 1.00, 'SOS': 1.00, 'SSP': 1.00, 'STN': 1.00, 'SRD': 1.00, 'SYP': 1.00, 'TWD': 1.00, 'TJS': 1.00, 'TZS': 1.00, 'TTD': 1.00, 'TND': 1.00, 'TRY': 1.00, 'TMT': 1.00, 'UGX': 1.00, 'UAH': 1.00, 'AED': 1.00, 'UYU': 1.00, 'UZS': 1.00, 'VUV': 1.00, 'VES': 1.00, 'VED': 1.00, 'VND': 1.00, 'YER': 1.00, 'ZMW': 1.00, 'ZWG': 1.00,
};

const initialSettings: Settings = {
  companyName: '',
  companyLogo: '',
  theme: 'light',
  defaultVat: 18,
  defaultMarkup: 70,
  currencyRates: defaultCurrencyRates,
  displayScale: 100, // New: Default display scale
  paymentCategories: [ // Default payment categories
    { id: 1, name: 'Rent' },
    { id: 2, name: 'Utilities' },
    { id: 3, name: 'Salaries' },
    { id: 4, name: 'Office Supplies' },
    { id: 5, name: 'Marketing' },
    { id: 6, name: 'Travel' },
    { id: 7, name: 'Maintenance' },
    { id: 8, name: 'Software Subscriptions' },
  ],
  mainCurrency: 'AZN', // New: Default main currency
  activeCurrencies: ['AZN', 'USD', 'EUR', 'RUB', 'GBP', 'CAD', 'CNY', 'INR', 'MXN', 'SEK', 'THB', 'AED', 'BHD', 'JOD', 'KWD', 'OMR', 'SGD'], // Updated: Default active currencies
  showDashboardCurrencyRates: true, // New: Default to showing dashboard currency rates
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
  
  // Recycle Bin
  recycleBin: RecycleBinItem[];
  setRecycleBin: React.Dispatch<React.SetStateAction<RecycleBinItem[]>>;
  addToRecycleBin: (item: any, collectionKey: CollectionKey) => void;
  restoreFromRecycleBin: (recycleItemId: string) => void;
  deletePermanentlyFromRecycleBin: (recycleItemId: string) => void;
  cleanRecycleBin: () => void;

  // CRUD operations
  saveItem: (key: CollectionKey, item: any) => void;
  deleteItem: (key: CollectionKey, id: number) => void;
  getNextId: (key: CollectionKey) => number;
  setNextIdForCollection: (key: CollectionKey, nextId: number) => void; // New function
  updateStockFromOrder: (newOrder: PurchaseOrder | SellOrder | null, oldOrder: PurchaseOrder | SellOrder | null) => void;
  updateAverageCosts: (purchaseOrder: PurchaseOrder) => void;

  // Modals
  showAlertModal: (title: string, message: string) => void;
  showConfirmationModal: (title: string, message: string, onConfirm: () => void) => void;
  isConfirmationModalOpen: boolean;
  confirmationModalProps: { title: string; message: string; onConfirm: () => void } | null;
  closeConfirmationModal: () => void;

  // Currency conversion utility
  convertCurrency: (amount: number, fromCurrency: Currency, toCurrency: Currency) => number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [initialized, setInitialized] = useLocalStorage<boolean>('initialized', false);

  const [products, setProducts] = useLocalStorage<Product[]>('products', initialData.products);
  const [suppliers, setSuppliers] = useLocalStorage<Supplier[]>('suppliers', initialData.suppliers);
  const [customers, setCustomers] = useLocalStorage<Customer[]>('customers', initialData.customers);
  const [warehouses, setWarehouses] = useLocalStorage<Warehouse[]>('warehouses', initialData.warehouses);
  const [purchaseOrders, setPurchaseOrders] = useLocalStorage<PurchaseOrder[]>('purchaseOrders', initialData.purchaseOrders);
  const [sellOrders, setSellOrders] = useLocalStorage<SellOrder[]>('sellOrders', initialData.sellOrders);
  const [incomingPayments, setIncomingPayments] = useLocalStorage<Payment[]>('incomingPayments', initialData.incomingPayments);
  const [outgoingPayments, setOutgoingPayments] = useLocalStorage<Payment[]>('outgoingPayments', initialData.outgoingPayments);
  const [productMovements, setProductMovements] = useLocalStorage<ProductMovement[]>('productMovements', initialData.productMovements);

  const [settings, setSettings] = useLocalStorage<Settings>('settings', initialSettings);
  const [currencyRates, setCurrencyRates] = useLocalStorage<CurrencyRates>('currencyRates', defaultCurrencyRates);
  const [recycleBin, setRecycleBin] = useLocalStorage<RecycleBinItem[]>('recycleBin', []);

  // Internal state for next IDs, managed by DataProvider
  const [nextIds, setNextIds] = useLocalStorage<{ [key: string]: number }>('nextIds', {
    products: 1, suppliers: 1, customers: 1, warehouses: 1, purchaseOrders: 1, sellOrders: 1, incomingPayments: 1, outgoingPayments: 1, productMovements: 1,
    paymentCategories: initialSettings.paymentCategories.length > 0 ? Math.max(...initialSettings.paymentCategories.map(c => c.id)) + 1 : 1,
  });

  // Add console logs for debugging
  console.log("[DataContext] products:", products);
  console.log("[DataContext] customers:", customers);
  console.log("[DataContext] suppliers:", suppliers);
  console.log("[DataContext] warehouses:", warehouses);
  console.log("[DataContext] purchaseOrders:", purchaseOrders);
  console.log("[DataContext] sellOrders:", sellOrders);
  console.log("[DataContext] incomingPayments:", incomingPayments);
  console.log("[DataContext] outgoingPayments:", outgoingPayments);
  console.log("[DataContext] productMovements:", productMovements);


  // Use the new modals hook
  const {
    showAlertModal,
    showConfirmationModal,
    isConfirmationModalOpen,
    confirmationModalProps,
    closeConfirmationModal,
  } = useModals();

  // --- Currency Conversion Utility ---
  const convertCurrency = useCallback((amount: number, fromCurrency: Currency, toCurrency: Currency): number => {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rateFromAZN = currencyRates[fromCurrency];
    const rateToAZN = currencyRates[toCurrency];

    if (!rateFromAZN || !rateToAZN) {
      console.warn(`Missing currency rate for conversion: ${fromCurrency} or ${toCurrency}`);
      return amount; // Return original amount if rates are missing
    }

    // Convert to AZN first, then to target currency
    const amountInAZN = amount * rateFromAZN;
    return amountInAZN / rateToAZN;
  }, [currencyRates]);

  // Use the new inventory management hook
  const {
    updateStockFromOrder: baseUpdateStockFromOrder,
    updateAverageCosts: baseUpdateAverageAverageCosts,
  } = useInventoryManagement({ products: Array.isArray(products) ? products : [], setProducts }); // Defensive check here too

  // Override updateAverageCosts to use mainCurrency
  const updateAverageCosts = useCallback((purchaseOrder: PurchaseOrder) => {
    setProducts(prevProducts => {
      const updatedProducts = JSON.parse(JSON.stringify(prevProducts));
      (purchaseOrder.items || []).forEach(item => {
        const product = updatedProducts.find((p: Product) => p.id === item.productId);
        if (product) {
          // item.landedCostPerUnit is already in Main Currency from PurchaseOrderForm
          const landedCostInMainCurrency = item.landedCostPerUnit || 0;
          if (landedCostInMainCurrency <= 0) return;

          const totalStock = Object.values(product.stock || {}).reduce((a, b) => a + b, 0);
          const stockBeforeThisOrder = totalStock - item.qty;

          if (stockBeforeThisOrder > 0 && (product.averageLandedCost || 0) > 0) {
            const oldTotalValue = stockBeforeThisOrder * product.averageLandedCost;
            const newItemsValue = item.qty * landedCostInMainCurrency;
            if (totalStock > 0) {
              product.averageLandedCost = parseFloat(((oldTotalValue + newItemsValue) / totalStock).toFixed(4));
            } else {
              product.averageLandedCost = landedCostInMainCurrency;
            }
          } else {
            product.averageLandedCost = landedCostInMainCurrency;
          }
        }
      });
      return updatedProducts;
    });
  }, [setProducts]);

  // Override updateStockFromOrder to use the base one
  const updateStockFromOrder = useCallback((newOrder: PurchaseOrder | SellOrder | null, oldOrder: PurchaseOrder | SellOrder | null) => {
    baseUpdateStockFromOrder(newOrder, oldOrder);
  }, [baseUpdateStockFromOrder]);


  // --- Recycle Bin Operations ---
  const addToRecycleBin = useCallback((item: any, collectionKey: CollectionKey) => {
    const recycleItemId = `${collectionKey}-${item.id}-${Date.now()}`;
    const newItem: RecycleBinItem = {
      id: recycleItemId,
      originalId: item.id,
      collectionKey,
      data: item,
      deletedAt: MOCK_CURRENT_DATE.toISOString(),
    };
    setRecycleBin(prev => [...prev, newItem]);
    showAlertModal(t('success'), t('itemMovedToRecycleBin'));
  }, [setRecycleBin, showAlertModal]);

  const restoreFromRecycleBin = useCallback((recycleItemId: string) => {
    setRecycleBin(prevRecycleBin => {
      const itemToRestore = prevRecycleBin.find(item => item.id === recycleItemId);
      if (!itemToRestore) {
        showAlertModal(t('error'), t('itemNotFoundInRecycleBin'));
        return prevRecycleBin;
      }

      const { collectionKey, data } = itemToRestore;
      let setter: React.Dispatch<React.SetStateAction<any[]>>;

      switch (collectionKey) {
        case 'products': setter = setProducts; break;
        case 'suppliers': setter = setSuppliers; break;
        case 'customers': setter = setCustomers; break;
        case 'warehouses': setter = setWarehouses; break;
        case 'purchaseOrders': setter = setPurchaseOrders; break;
        case 'sellOrders': setter = setSellOrders; break;
        case 'incomingPayments': setter = setIncomingPayments; break;
        case 'outgoingPayments': setter = setOutgoingPayments; break;
        case 'productMovements': setter = setProductMovements; break;
        default:
          showAlertModal(t('error'), t('unknownCollectionType'));
          return prevRecycleBin;
      }

      setter(prevItems => {
        // Ensure the item is not duplicated if it somehow already exists
        if (prevItems.some((i: any) => i.id === data.id)) {
          showAlertModal(t('error'), t('itemAlreadyExists'));
          return prevItems;
        }
        return [...prevItems, data];
      });

      showAlertModal(t('success'), t('itemRestored'));
      return prevRecycleBin.filter(item => item.id !== recycleItemId);
    });
  }, [setRecycleBin, setProducts, setSuppliers, setCustomers, setWarehouses, setPurchaseOrders, setSellOrders, setIncomingPayments, setOutgoingPayments, setProductMovements, showAlertModal]);

  const deletePermanentlyFromRecycleBin = useCallback((recycleItemId: string) => {
    showConfirmationModal(
      t('deletePermanently'),
      t('deletePermanentlyWarning'),
      () => {
        setRecycleBin(prev => prev.filter(item => item.id !== recycleItemId));
        showAlertModal(t('success'), t('itemDeletedPermanently'));
      }
    );
  }, [setRecycleBin, showConfirmationModal, showAlertModal]);

  const cleanRecycleBin = useCallback(() => {
    showConfirmationModal(
      t('cleanRecycleBin'),
      t('cleanRecycleBinWarning'),
      () => {
        setRecycleBin([]);
        showAlertModal(t('success'), t('recycleBinCleaned'));
      }
    );
  }, [setRecycleBin, showConfirmationModal, showAlertModal]);

  // Use the new CRUD operations hook
  const {
    getNextId,
    setNextIdForCollection,
    saveItem,
    deleteItem, // This deleteItem will now call addToRecycleBin
  } = useCrudOperations({
    // Pass setters (stable references)
    setProducts,
    setSuppliers,
    setCustomers,
    setWarehouses,
    setPurchaseOrders,
    setSellOrders,
    setIncomingPayments,
    setOutgoingPayments,
    setProductMovements,
    setNextIds,
    // Pass current state values for validation (will cause re-render of useCrudOperations, but not recreate saveItem/deleteItem)
    products: Array.isArray(products) ? products : [], // Defensive check
    suppliers: Array.isArray(suppliers) ? suppliers : [], // Defensive check
    customers: Array.isArray(customers) ? customers : [], // Defensive check
    warehouses: Array.isArray(warehouses) ? warehouses : [], // Defensive check
    purchaseOrders: Array.isArray(purchaseOrders) ? purchaseOrders : [], // Defensive check
    sellOrders: Array.isArray(sellOrders) ? sellOrders : [], // Defensive check
    incomingPayments: Array.isArray(incomingPayments) ? incomingPayments : [], // Defensive check
    outgoingPayments: Array.isArray(outgoingPayments) ? outgoingPayments : [], // Defensive check
    productMovements: Array.isArray(productMovements) ? productMovements : [], // Defensive check
    // Other stable dependencies
    nextIds, // nextIds value for getNextId
    showAlertModal,
    showConfirmationModal,
    updateStockFromOrder,
    updateAverageCosts,
    addToRecycleBin,
  });

  // --- Initialization Logic ---
  useEffect(() => {
    if (!initialized) {
      // Initialize with empty data and default settings
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
      setCurrencyRates(defaultCurrencyRates);
      setRecycleBin([]); // Ensure recycle bin is also initialized empty

      // Initialize nextIds based on initial data (which are now empty, so start from 1)
      const initialNextIds: { [key: string]: number } = {};
      (Object.keys(initialData) as (keyof typeof initialData)[]).forEach(key => {
        initialNextIds[key] = 1; // Always start from 1 for empty collections
      });
      initialNextIds.paymentCategories = initialSettings.paymentCategories.length > 0 ? Math.max(...initialSettings.paymentCategories.map(c => c.id)) + 1 : 1;
      setNextIds(initialNextIds);
      setInitialized(true);
    }
  }, [initialized, setInitialized, setProducts, setSuppliers, setCustomers, setWarehouses, setPurchaseOrders, setSellOrders, setIncomingPayments, setOutgoingPayments, setProductMovements, setSettings, setCurrencyRates, setNextIds, setRecycleBin]);

  const productsWithTotalStock = useMemo(() => {
    return Array.isArray(products) ? products.map(p => ({ // Defensive check for products
      ...p,
      totalStock: Object.values(p.stock || {}).reduce((a, b) => a + b, 0),
    })) : [];
  }, [products]);

  const value = useMemo(() => ({
    products: productsWithTotalStock, setProducts, // Provide products with totalStock
    suppliers: Array.isArray(suppliers) ? suppliers : [], setSuppliers, // Defensive check
    customers: Array.isArray(customers) ? customers : [], setCustomers, // Defensive check
    warehouses: Array.isArray(warehouses) ? warehouses : [], setWarehouses, // Defensive check
    purchaseOrders: Array.isArray(purchaseOrders) ? purchaseOrders : [], setPurchaseOrders, // Defensive check
    sellOrders: Array.isArray(sellOrders) ? sellOrders : [], setSellOrders, // Defensive check
    incomingPayments: Array.isArray(incomingPayments) ? incomingPayments : [], setIncomingPayments, // Defensive check
    outgoingPayments: Array.isArray(outgoingPayments) ? outgoingPayments : [], setOutgoingPayments, // Defensive check
    productMovements: Array.isArray(productMovements) ? productMovements : [], setProductMovements, // Defensive check
    settings, setSettings,
    currencyRates, setCurrencyRates,
    recycleBin, setRecycleBin, addToRecycleBin, restoreFromRecycleBin, deletePermanentlyFromRecycleBin, cleanRecycleBin, // Add recycle bin functions
    saveItem, deleteItem, getNextId, setNextIdForCollection,
    updateStockFromOrder, updateAverageCosts,
    showAlertModal, showConfirmationModal,
    isConfirmationModalOpen, confirmationModalProps, closeConfirmationModal,
    convertCurrency, // Add currency conversion utility
  }), [
    productsWithTotalStock, setProducts,
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
    recycleBin, setRecycleBin, addToRecycleBin, restoreFromRecycleBin, deletePermanentlyFromRecycleBin, cleanRecycleBin,
    saveItem, deleteItem, getNextId, setNextIdForCollection,
    updateStockFromOrder, updateAverageCosts,
    showAlertModal, showConfirmationModal,
    isConfirmationModalOpen, confirmationModalProps, closeConfirmationModal,
    convertCurrency,
  ]);

  return (
    <DataContext.Provider value={value}>
      {children}
      {confirmationModalProps && (
        <AlertDialog open={isConfirmationModalOpen} onOpenChange={closeConfirmationModal}>
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