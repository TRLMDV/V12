import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { t } from '@/utils/i18n';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

import { useModals } from '@/hooks/useModals';
import { useInventoryManagement } from '@/hooks/useInventoryManagement';
import { useCrudOperations } from '@/hooks/useCrudOperations';
import { useRecycleBin } from '@/hooks/useRecycleBin'; // New import
import { useAppInitialization } from '@/hooks/useAppInitialization'; // New import

import { initialData, initialSettings, defaultCurrencyRates } from '@/data/initialData'; // Corrected import path for MOCK_CURRENT_DATE

import {
  Product, Supplier, Customer, Warehouse, OrderItem, PurchaseOrder, SellOrder, Payment, ProductMovement,
  CurrencyRates, Settings, RecycleBinItem, CollectionKey, PaymentCategorySetting, Currency, PackingUnit, BaseUnit, BankAccount, UtilizationOrder
} from '@/types';

// --- Helper type for internal transaction processing in DataContext ---
interface BankTransactionForRunningBalance {
  id: string; // e.g., 'inc-1', 'out-5', 'initial-2'
  date: string;
  amount: number; // Amount in the account's currency
  type: 'incoming' | 'outgoing' | 'initial';
  bankAccountId: number;
  originalPaymentCurrency: Currency; // For conversion
  originalPaymentAmount: number; // For conversion
}

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
  bankAccounts: BankAccount[];
  setBankAccounts: React.Dispatch<React.SetStateAction<BankAccount[]>>;
  utilizationOrders: UtilizationOrder[]; // New: Utilization Orders
  setUtilizationOrders: React.Dispatch<React.SetStateAction<UtilizationOrder[]>>; // New: Set Utilization Orders
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  currencyRates: CurrencyRates;
  setCurrencyRates: React.Dispatch<React.SetStateAction<CurrencyRates>>;
  packingUnits: PackingUnit[];
  setPackingUnits: React.Dispatch<React.SetStateAction<PackingUnit[]>>;
  packingUnitMap: { [key: number]: PackingUnit };
  warehouseMap: { [key: number]: Warehouse };
  
  // Recycle Bin
  recycleBin: RecycleBinItem[];
  setRecycleBin: React.Dispatch<React.SetStateAction<RecycleBinItem[]>>;
  addToRecycleBin: (item: any, collectionKey: CollectionKey) => void;
  restoreFromRecycleBin: (recycleItemId: string) => void;
  deletePermanentlyFromRecycleBin: (recycleItemId: string) => void;
  cleanRecycleBin: () => void;
  getItemSummary: (item: any, collectionKey: CollectionKey) => string; // New: Expose getItemSummary

  // CRUD operations
  saveItem: (key: CollectionKey, item: any) => void;
  deleteItem: (key: CollectionKey, id: number) => void;
  getNextId: (key: CollectionKey) => number;
  setNextIdForCollection: (key: CollectionKey, nextId: number) => void;
  updateStockFromOrder: (newOrder: PurchaseOrder | SellOrder | null, oldOrder: PurchaseOrder | SellOrder | null) => void;
  updateAverageCosts: (purchaseOrder: PurchaseOrder) => void;
  updateStockForUtilization: (newOrder: UtilizationOrder | null, oldOrder: UtilizationOrder | null) => void; // New: Stock management for utilization

  // Modals
  showAlertModal: (title: string, message: string) => void;
  showConfirmationModal: (title: string, message: string, onConfirm: () => void, actionLabel?: string) => void; // Updated signature
  isConfirmationModalOpen: boolean;
  confirmationModalProps: { title: string; message: string; onConfirm: () => void; actionLabel?: string } | null; // Updated signature
  closeConfirmationModal: () => void;

  // Currency conversion utility
  convertCurrency: (amount: number, fromCurrency: Currency, toCurrency: Currency) => number;

  // Running balances for bank accounts
  runningBalancesMap: Map<number, Map<string, number>>; // bankAccountId -> (transactionId -> balanceAfterTransaction)
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useLocalStorage<Product[]>('products', initialData.products);
  const [suppliers, setSuppliers] = useLocalStorage<Supplier[]>('suppliers', initialData.suppliers);
  const [customers, setCustomers] = useLocalStorage<Customer[]>('customers', initialData.customers);
  const [warehouses, setWarehouses] = useLocalStorage<Warehouse[]>('warehouses', initialData.warehouses);
  const [purchaseOrders, setPurchaseOrders] = useLocalStorage<PurchaseOrder[]>('purchaseOrders', initialData.purchaseOrders);
  const [sellOrders, setSellOrders] = useLocalStorage<SellOrder[]>('sellOrders', initialData.sellOrders);
  const [incomingPayments, setIncomingPayments] = useLocalStorage<Payment[]>('incomingPayments', initialData.incomingPayments);
  const [outgoingPayments, setOutgoingPayments] = useLocalStorage<Payment[]>('outgoingPayments', initialData.outgoingPayments);
  const [productMovements, setProductMovements] = useLocalStorage<ProductMovement[]>('productMovements', initialData.productMovements);
  const [bankAccounts, setBankAccounts] = useLocalStorage<BankAccount[]>('bankAccounts', initialData.bankAccounts);
  const [utilizationOrders, setUtilizationOrders] = useLocalStorage<UtilizationOrder[]>('utilizationOrders', initialData.utilizationOrders); // New: Utilization Orders

  const [settings, setSettings] = useLocalStorage<Settings>('settings', initialSettings);
  const [currencyRates, setCurrencyRates] = useLocalStorage<CurrencyRates>('currencyRates', defaultCurrencyRates);
  const [packingUnits, setPackingUnits] = useLocalStorage<PackingUnit[]>('packingUnits', initialSettings.packingUnits);
  
  // Internal state for next IDs, managed by DataProvider
  // This will be initialized by useAppInitialization based on actual data, not hardcoded defaults.
  const [nextIds, setNextIds] = useLocalStorage<{ [key: string]: number }>('nextIds', {}); 

  // Add console logs for debugging
  console.log("[DataContext] products:", products);
  console.log("[DataContext] customers:", customers);
  console.log("[DataContext] suppliers:", suppliers);
  console.log("[DataContext] warehouses:", warehouses);
  console.log("[DataContext] purchaseOrders:", purchaseOrders);
  console.log("[DataContext] incomingPayments:", incomingPayments);
  console.log("[DataContext] outgoingPayments:", outgoingPayments);
  console.log("[DataContext] productMovements:", productMovements);
  console.log("[DataContext] packingUnits:", packingUnits);
  console.log("[DataContext] bankAccounts:", bankAccounts);
  console.log("[DataContext] utilizationOrders:", utilizationOrders); // New: Log utilization orders
  console.log("[DataContext] nextIds (initial load from localStorage):", nextIds);


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

  // --- Running Balances Map for Bank Accounts ---
  const runningBalancesMap = useMemo(() => {
    const balances = new Map<number, Map<string, number>>(); // bankAccountId -> (transactionId -> balanceAfterTransaction)

    bankAccounts.forEach(account => {
      const accountTransactions: BankTransactionForRunningBalance[] = [];

      // Initial balance as a transaction (using epoch date to ensure it's sorted first)
      accountTransactions.push({
        id: `initial-${account.id}`,
        date: '1970-01-01', 
        amount: account.initialBalance,
        type: 'initial',
        bankAccountId: account.id,
        originalPaymentCurrency: account.currency,
        originalPaymentAmount: account.initialBalance,
      });

      // Incoming payments
      incomingPayments.forEach(p => {
        if (p.bankAccountId === account.id) {
          const amountInAccountCurrency = convertCurrency(p.amount, p.paymentCurrency, account.currency);
          accountTransactions.push({
            id: `inc-${p.id}`,
            date: p.date,
            amount: amountInAccountCurrency,
            type: 'incoming',
            bankAccountId: account.id,
            originalPaymentCurrency: p.paymentCurrency,
            originalPaymentAmount: p.amount,
          });
        }
      });

      // Outgoing payments
      outgoingPayments.forEach(p => {
        if (p.bankAccountId === account.id) {
          const amountInAccountCurrency = convertCurrency(p.amount, p.paymentCurrency, account.currency);
          accountTransactions.push({
            id: `out-${p.id}`,
            date: p.date,
            amount: amountInAccountCurrency,
            type: 'outgoing',
            bankAccountId: account.id,
            originalPaymentCurrency: p.paymentCurrency,
            originalPaymentAmount: p.amount,
          });
        }
      });

      // Sort all transactions for this account by date, then by type (initial -> incoming -> outgoing)
      accountTransactions.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA !== dateB) return dateA - dateB;
        const typeOrder = { 'initial': 0, 'incoming': 1, 'outgoing': 2 };
        return typeOrder[a.type] - typeOrder[b.type];
      });

      let currentRunningBalance = 0;
      const accountBalances = new Map<string, number>();

      accountTransactions.forEach(t => {
        if (t.type === 'initial') {
          currentRunningBalance = t.amount;
        } else if (t.type === 'incoming') {
          currentRunningBalance += t.amount;
        } else if (t.type === 'outgoing') {
          currentRunningBalance -= t.amount;
        }
        accountBalances.set(t.id, currentRunningBalance);
      });
      balances.set(account.id, accountBalances);
    });
    return balances;
  }, [bankAccounts, incomingPayments, outgoingPayments, convertCurrency]);


  // Use the new inventory management hook
  const {
    updateStockFromOrder: baseUpdateStockFromOrder,
    updateAverageCosts: baseUpdateAverageAverageCosts,
  } = useInventoryManagement({ products: Array.isArray(products) ? products : [], setProducts });

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

          const totalStock = Object.values(product.stock || {}).reduce((a: number, b: number) => a + b, 0) as number;
          const stockBeforeThisOrder = totalStock - (item.qty as number);

          if (stockBeforeThisOrder > 0 && (product.averageLandedCost || 0) > 0) {
            const oldTotalValue = stockBeforeThisOrder * (product.averageLandedCost as number);
            const newItemsValue = (item.qty as number) * landedCostInMainCurrency;
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

  // New: Stock management for Utilization Orders
  const updateStockForUtilization = useCallback((newOrder: UtilizationOrder | null, oldOrder: UtilizationOrder | null) => {
    setProducts(prevProducts => {
      const updatedProducts = JSON.parse(JSON.stringify(prevProducts)); // Deep copy

      // --- 1. Reverse old stock change if an old order exists ---
      if (oldOrder) {
        (oldOrder.items || []).forEach(item => {
          const p = updatedProducts.find((prod: Product) => prod.id === item.productId);
          if (p) {
            if (!p.stock) p.stock = {};
            p.stock[oldOrder.warehouseId] = (p.stock[oldOrder.warehouseId] || 0) + item.quantity;
          }
        });
      }

      // --- 2. Apply new stock change if a new order exists ---
      if (newOrder) {
        (newOrder.items || []).forEach(item => {
          const p = updatedProducts.find((prod: Product) => prod.id === item.productId);
          if (p) {
            if (!p.stock) p.stock = {};
            p.stock[newOrder.warehouseId] = (p.stock[newOrder.warehouseId] || 0) - item.quantity;
            if (p.stock[newOrder.warehouseId] < 0) p.stock[newOrder.warehouseId] = 0; // Ensure stock doesn't go negative
          }
        });
      }
      return updatedProducts;
    });
  }, [setProducts]);

  // Use the new recycle bin hook
  const {
    recycleBin,
    setRecycleBin,
    addToRecycleBin,
    restoreFromRecycleBin,
    deletePermanentlyFromRecycleBin,
    cleanRecycleBin,
    getItemSummary,
  } = useRecycleBin({
    setProducts, setSuppliers, setCustomers, setWarehouses, setPurchaseOrders, setSellOrders,
    setIncomingPayments, setOutgoingPayments, setProductMovements, setPackingUnits, setSettings, setBankAccounts, setUtilizationOrders, // Added setUtilizationOrders
    products: Array.isArray(products) ? products : [],
    suppliers: Array.isArray(suppliers) ? suppliers : [],
    customers: Array.isArray(customers) ? customers : [],
    warehouses: Array.isArray(warehouses) ? warehouses : [],
    purchaseOrders: Array.isArray(purchaseOrders) ? purchaseOrders : [],
    sellOrders: Array.isArray(sellOrders) ? sellOrders : [],
    incomingPayments: Array.isArray(incomingPayments) ? incomingPayments : [],
    outgoingPayments: Array.isArray(outgoingPayments) ? outgoingPayments : [],
    productMovements: Array.isArray(productMovements) ? productMovements : [],
    packingUnits: Array.isArray(packingUnits) ? packingUnits : [],
    settings,
    bankAccounts: Array.isArray(bankAccounts) ? bankAccounts : [],
    utilizationOrders: Array.isArray(utilizationOrders) ? utilizationOrders : [], // Added utilizationOrders
    showAlertModal, // Pass showAlertModal
    showConfirmationModal, // Pass showConfirmationModal
  });

  // Memoized map for packing units
  const packingUnitMap = useMemo(() => {
    return packingUnits.reduce((acc, pu) => ({ ...acc, [pu.id]: pu }), {} as { [key: number]: PackingUnit });
  }, [packingUnits]);

  // Memoized map for warehouses
  const warehouseMap = useMemo(() => {
    return warehouses.reduce((acc, w) => ({ ...acc, [w.id]: w }), {} as { [key: number]: Warehouse });
  }, [warehouses]);

  // Use the new CRUD operations hook
  const {
    getNextId,
    setNextIdForCollection,
    saveItem,
    deleteItem,
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
    setUtilizationOrders, // New: setUtilizationOrders
    setPackingUnits,
    setBankAccounts,
    setSettings,
    setNextIds,
    // Pass current state values for validation (will cause re-render of useCrudOperations, but not recreate saveItem/deleteItem)
    products: Array.isArray(products) ? products : [],
    suppliers: Array.isArray(suppliers) ? suppliers : [],
    customers: Array.isArray(customers) ? customers : [],
    warehouses: Array.isArray(warehouses) ? warehouses : [],
    purchaseOrders: Array.isArray(purchaseOrders) ? purchaseOrders : [],
    sellOrders: Array.isArray(sellOrders) ? sellOrders : [],
    incomingPayments: Array.isArray(incomingPayments) ? incomingPayments : [],
    outgoingPayments: Array.isArray(outgoingPayments) ? outgoingPayments : [],
    productMovements: Array.isArray(productMovements) ? productMovements : [],
    bankAccounts: Array.isArray(bankAccounts) ? bankAccounts : [],
    utilizationOrders: Array.isArray(utilizationOrders) ? utilizationOrders : [], // New: utilizationOrders
    packingUnits: Array.isArray(packingUnits) ? packingUnits : [],
    settings,
    // Other stable dependencies
    nextIds,
    showAlertModal,
    showConfirmationModal,
    updateStockFromOrder,
    updateAverageCosts,
    updateStockForUtilization, // New: Pass updateStockForUtilization
    addToRecycleBin,
  });

  // --- Initialization Logic ---
  useAppInitialization({
    products: Array.isArray(products) ? products : [],
    suppliers: Array.isArray(suppliers) ? suppliers : [],
    customers: Array.isArray(customers) ? customers : [],
    warehouses: Array.isArray(warehouses) ? warehouses : [],
    purchaseOrders: Array.isArray(purchaseOrders) ? purchaseOrders : [],
    sellOrders: Array.isArray(sellOrders) ? sellOrders : [],
    incomingPayments: Array.isArray(incomingPayments) ? incomingPayments : [],
    outgoingPayments: Array.isArray(outgoingPayments) ? outgoingPayments : [],
    productMovements: Array.isArray(productMovements) ? productMovements : [],
    bankAccounts: Array.isArray(bankAccounts) ? bankAccounts : [],
    utilizationOrders: Array.isArray(utilizationOrders) ? utilizationOrders : [],
    settings,
    currencyRates,
    packingUnits: Array.isArray(packingUnits) ? packingUnits : [],
    recycleBin: Array.isArray(recycleBin) ? recycleBin : [],
    setProducts, setSuppliers, setCustomers, setWarehouses, setPurchaseOrders, setSellOrders,
    setIncomingPayments, setOutgoingPayments, setProductMovements, setBankAccounts, setUtilizationOrders,
    setSettings, setCurrencyRates, setPackingUnits, setRecycleBin, setNextIds,
  });

  const productsWithTotalStock = useMemo(() => {
    return Array.isArray(products) ? products.map(p => ({
      ...p,
      totalStock: Object.values(p.stock || {}).reduce((a: number, b: number) => a + b, 0),
    })) : [];
  }, [products]);

  console.log("DEBUG: DataContext render - isConfirmationModalOpen:", isConfirmationModalOpen);
  console.log("DEBUG: DataContext render - confirmationModalProps:", confirmationModalProps);

  const value = useMemo(() => ({
    products: productsWithTotalStock, setProducts,
    suppliers: Array.isArray(suppliers) ? suppliers : [], setSuppliers,
    customers: Array.isArray(customers) ? customers : [], setCustomers,
    warehouses: Array.isArray(warehouses) ? warehouses : [], setWarehouses,
    purchaseOrders: Array.isArray(purchaseOrders) ? purchaseOrders : [], setPurchaseOrders,
    sellOrders: Array.isArray(sellOrders) ? sellOrders : [], setSellOrders,
    incomingPayments: Array.isArray(incomingPayments) ? incomingPayments : [], setIncomingPayments,
    outgoingPayments: Array.isArray(outgoingPayments) ? outgoingPayments : [], setOutgoingPayments,
    productMovements: Array.isArray(productMovements) ? productMovements : [], setProductMovements,
    bankAccounts: Array.isArray(bankAccounts) ? bankAccounts : [], setBankAccounts,
    utilizationOrders: Array.isArray(utilizationOrders) ? utilizationOrders : [], setUtilizationOrders, // New: utilizationOrders
    settings, setSettings,
    currencyRates, setCurrencyRates,
    packingUnits: Array.isArray(packingUnits) ? packingUnits : [], setPackingUnits,
    packingUnitMap,
    warehouseMap,
    recycleBin, setRecycleBin, addToRecycleBin, restoreFromRecycleBin, deletePermanentlyFromRecycleBin, cleanRecycleBin, getItemSummary,
    saveItem, deleteItem, getNextId, setNextIdForCollection,
    updateStockFromOrder, updateAverageCosts, updateStockForUtilization, // New: updateStockForUtilization
    showAlertModal, showConfirmationModal,
    isConfirmationModalOpen, confirmationModalProps, closeConfirmationModal,
    convertCurrency,
    runningBalancesMap, // Expose the running balances map
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
    bankAccounts, setBankAccounts,
    utilizationOrders, setUtilizationOrders, // New: utilizationOrders
    settings, setSettings,
    currencyRates, setCurrencyRates,
    packingUnits, setPackingUnits,
    packingUnitMap,
    warehouseMap,
    recycleBin, setRecycleBin, addToRecycleBin, restoreFromRecycleBin, deletePermanentlyFromRecycleBin, cleanRecycleBin, getItemSummary,
    saveItem, deleteItem, getNextId, setNextIdForCollection,
    updateStockFromOrder, updateAverageCosts, updateStockForUtilization, // New: updateStockForUtilization
    showAlertModal, showConfirmationModal,
    isConfirmationModalOpen, confirmationModalProps, closeConfirmationModal,
    convertCurrency,
    runningBalancesMap, // Include in the memoized value
  ]);

  return (
    <DataContext.Provider value={value}>
      {children}
      {/* Always render AlertDialog, but conditionally render its content */}
      <AlertDialog open={isConfirmationModalOpen} onOpenChange={closeConfirmationModal}>
        {confirmationModalProps && (
          <AlertDialogContent className="z-50"> {/* Added z-50 for visibility */}
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmationModalProps.title}</AlertDialogTitle>
              <AlertDialogDescription>{confirmationModalProps.message}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                console.log("DataContext: AlertDialogCancel clicked.");
                closeConfirmationModal();
              }}>{t('cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                console.log("DataContext: AlertDialogAction clicked. Executing onConfirm.");
                if (confirmationModalProps.onConfirm) {
                  confirmationModalProps.onConfirm();
                }
                closeConfirmationModal();
              }}>
                {confirmationModalProps.actionLabel || t('confirm')} {/* Use dynamic label or default to 'Confirm' */}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
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