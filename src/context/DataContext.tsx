import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { t } from '@/utils/i18n';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

import { useModals } from '@/hooks/useModals';
import { useInventoryManagement } from '@/hooks/useInventoryManagement';
import { useCrudOperations } from '@/hooks/useCrudOperations';
import { useRecycleBin } from '@/hooks/useRecycleBin';
import { useAppInitialization } from '@/hooks/useAppInitialization';

import { useDataState } from '@/hooks/useDataState';
import { useDataMaps } from '@/hooks/useDataMaps';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { useBankBalances } from '@/hooks/useBankBalances';

import {
  Product, Supplier, Customer, Warehouse, PurchaseOrder, SellOrder, Payment, ProductMovement,
  CurrencyRates, Settings, RecycleBinItem, CollectionKey, PackingUnit, BankAccount, UtilizationOrder, Currency, Reminder
} from '@/types';

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
  utilizationOrders: UtilizationOrder[];
  setUtilizationOrders: React.Dispatch<React.SetStateAction<UtilizationOrder[]>>;
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  currencyRates: CurrencyRates;
  setCurrencyRates: React.Dispatch<React.SetStateAction<CurrencyRates>>;
  packingUnits: PackingUnit[];
  setPackingUnits: React.Dispatch<React.SetStateAction<PackingUnit[]>>;
  packingUnitMap: { [key: number]: PackingUnit };
  warehouseMap: { [key: number]: Warehouse };
  productMap: { [key: number]: Product };
  
  recycleBin: RecycleBinItem[];
  setRecycleBin: React.Dispatch<React.SetStateAction<RecycleBinItem[]>>;
  addToRecycleBin: (item: any, collectionKey: CollectionKey) => void;
  restoreFromRecycleBin: (recycleItemId: string) => void;
  deletePermanentlyFromRecycleBin: (recycleItemId: string) => void;
  cleanRecycleBin: () => void;
  getItemSummary: (item: any, collectionKey: CollectionKey) => string;

  saveItem: (key: CollectionKey, item: any) => void;
  deleteItem: (key: CollectionKey, id: number) => void;
  getNextId: (key: CollectionKey) => number;
  setNextIdForCollection: (key: CollectionKey, nextId: number) => void;
  updateStockFromOrder: (newOrder: PurchaseOrder | SellOrder | null, oldOrder: PurchaseOrder | SellOrder | null) => void;
  updateAverageCosts: (purchaseOrder: PurchaseOrder) => void;
  updateStockForUtilization: (newOrder: UtilizationOrder | null, oldOrder: UtilizationOrder | null) => void;
  updateStockForProductMovement: (newMovement: ProductMovement | null, oldMovement: ProductMovement | null) => void; // New: Add to context type

  showAlertModal: (title: string, message: string, description?: string) => void;
  showConfirmationModal: (title: string, message: string, onConfirm: () => void, actionLabel?: string) => void;
  isConfirmationModalOpen: boolean;
  confirmationModalProps: { title: string; message: string; onConfirm: () => void; actionLabel?: string } | null;
  closeConfirmationModal: () => void;

  convertCurrency: (amount: number, fromCurrency: Currency, toCurrency: Currency) => number;

  runningBalancesMap: Map<number, Map<string, number>>;

  nextIds: { [key: string]: number };
  setNextIds: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    products, setProducts,
    suppliers, setSuppliers,
    customers, setCustomers,
    warehouses, setWarehouses,
    purchaseOrders, setPurchaseOrders,
    sellOrders, setSellOrders,
    incomingPayments, setIncomingPayments,
    outgoingPayments, setOutgoingPayments,
    productMovements, setProductMovements,
    bankAccounts, setBankAccounts,
    utilizationOrders, setUtilizationOrders,
    settings, setSettings,
    currencyRates, setCurrencyRates,
    packingUnits, setPackingUnits,
    nextIds, setNextIds,
    recycleBin, setRecycleBin,
  } = useDataState();

  console.log("[DataContext] products:", products);
  console.log("[DataContext] customers:", customers);
  console.log("[DataContext] suppliers:", suppliers);
  console.log("[DataContext] warehouses:", warehouses);
  console.log("[DataContext] purchaseOrders:", purchaseOrders);
  console.log("[DataContext] incomingPayments:", incomingPayments);
  console.log("[DataContext] outgoingPayments:", outgoingPayments);
  console.log("[DataContext] productMovements:", productMovements);
  console.log("[DataContext] packingUnits:", packingUnits);
  console.log("[DataContext] bankAccounts (from useDataState):", bankAccounts);
  console.log("[DataContext] utilizationOrders:", utilizationOrders);
  console.log("[DataContext] nextIds (from useDataState):", nextIds);

  const {
    showAlertModal,
    showConfirmationModal,
    isConfirmationModalOpen,
    confirmationModalProps,
    closeConfirmationModal,
  } = useModals();

  const { convertCurrency } = useCurrencyConverter({ currencyRates });

  const { runningBalancesMap } = useBankBalances({ bankAccounts, incomingPayments, outgoingPayments, convertCurrency });

  const { packingUnitMap, warehouseMap } = useDataMaps({ packingUnits, warehouses });
  const productMap = useMemo(() => products.reduce((acc, p) => ({ ...acc, [p.id]: p }), {} as { [key: number]: Product }), [products]);

  const {
    updateStockFromOrder: baseUpdateStockFromOrder,
    updateAverageCosts: baseUpdateAverageAverageCosts,
    updateStockForProductMovement: baseUpdateStockForProductMovement,
  } = useInventoryManagement({ products: Array.isArray(products) ? products : [], setProducts });

  const updateAverageCosts = React.useCallback((purchaseOrder: PurchaseOrder) => {
    setProducts(prevProducts => {
      const updatedProducts = JSON.parse(JSON.stringify(prevProducts));
      (purchaseOrder.items || []).forEach(item => {
        const product = updatedProducts.find((p: Product) => p.id === item.productId);
        if (product) {
          const landedCostInAZN = item.landedCostPerUnit || 0;
          if (landedCostInAZN <= 0) return;

          const totalStock = Object.values(product.stock || {}).reduce((a: number, b: number) => a + b, 0) as number;
          const stockBeforeThisOrder = totalStock - parseFloat(String(item.qty));

          if (stockBeforeThisOrder > 0 && (product.averageLandedCost || 0) > 0) {
            const oldTotalValue = stockBeforeThisOrder * (product.averageLandedCost as number);
            const newItemsValue = parseFloat(String(item.qty)) * landedCostInAZN;
            if (totalStock > 0) {
              product.averageLandedCost = parseFloat(((oldTotalValue + newItemsValue) / totalStock).toFixed(4));
            } else {
              product.averageLandedCost = landedCostInAZN;
            }
          } else {
            product.averageLandedCost = landedCostInAZN;
          }
        }
      });
      return updatedProducts;
    });
  }, [setProducts]);

  const updateStockFromOrder = React.useCallback((newOrder: PurchaseOrder | SellOrder | null, oldOrder: PurchaseOrder | SellOrder | null) => {
    baseUpdateStockFromOrder(newOrder, oldOrder);
  }, [baseUpdateStockFromOrder]);

  const updateStockForProductMovement = React.useCallback((newMovement: ProductMovement | null, oldMovement: ProductMovement | null) => {
    baseUpdateStockForProductMovement(newMovement, oldMovement);
  }, [baseUpdateStockForProductMovement]);

  const updateStockForUtilization = React.useCallback((newOrder: UtilizationOrder | null, oldOrder: UtilizationOrder | null) => {
    setProducts(prevProducts => {
      const updatedProducts = JSON.parse(JSON.stringify(prevProducts));

      if (oldOrder) {
        (oldOrder.items || []).forEach(item => {
          const p = updatedProducts.find((prod: Product) => prod.id === item.productId);
          if (p) {
            if (!p.stock) p.stock = {};
            p.stock[oldOrder.warehouseId] = (p.stock[oldOrder.warehouseId] || 0) + parseFloat(String(item.quantity));
          }
        });
      }

      if (newOrder) {
        (newOrder.items || []).forEach(item => {
          const p = updatedProducts.find((prod: Product) => prod.id === item.productId);
          if (p) {
            if (!p.stock) p.stock = {};
            p.stock[newOrder.warehouseId] = (p.stock[newOrder.warehouseId] || 0) - parseFloat(String(item.quantity));
            if (p.stock[newOrder.warehouseId] < 0) p.stock[newOrder.warehouseId] = 0;
          }
        });
      }
      return updatedProducts;
    });
  }, [setProducts]);

  const {
    recycleBin: recycleBinHook,
    setRecycleBin: setRecycleBinHook,
    addToRecycleBin,
    restoreFromRecycleBin,
    deletePermanentlyFromRecycleBin,
    cleanRecycleBin,
    getItemSummary,
  } = useRecycleBin({
    setProducts, setSuppliers, setCustomers, setWarehouses, setPurchaseOrders, setSellOrders,
    setIncomingPayments, setOutgoingPayments, setProductMovements, setPackingUnits, setSettings, setBankAccounts, setUtilizationOrders,
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
    utilizationOrders: Array.isArray(utilizationOrders) ? utilizationOrders : [],
    showAlertModal,
    showConfirmationModal,
  });

  React.useEffect(() => {
    setRecycleBin(recycleBinHook);
  }, [recycleBinHook, setRecycleBin]);


  const {
    getNextId,
    setNextIdForCollection,
    saveItem,
    deleteItem,
  } = useCrudOperations({
    setProducts, setSuppliers, setCustomers, setWarehouses, setPurchaseOrders, setSellOrders,
    setIncomingPayments, setOutgoingPayments, setProductMovements, setUtilizationOrders,
    setPackingUnits, setBankAccounts, setSettings, setNextIds,
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
    packingUnits: Array.isArray(packingUnits) ? packingUnits : [],
    settings,
    nextIds,
    showAlertModal,
    showConfirmationModal,
    updateStockFromOrder,
    updateAverageCosts,
    updateStockForUtilization,
    updateStockForProductMovement,
    addToRecycleBin,
  });

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

  useEffect(() => {
    if (purchaseOrders.length === 0) {
      setProducts(prevProducts => {
        let changed = false;
        const updatedProducts = prevProducts.map(p => {
          if (p.averageLandedCost !== 0) {
            changed = true;
            return { ...p, averageLandedCost: 0 };
          }
          return p;
        });
        return changed ? updatedProducts : prevProducts;
      });
    }
  }, [purchaseOrders, setProducts]);


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
    utilizationOrders: Array.isArray(utilizationOrders) ? utilizationOrders : [], setUtilizationOrders,
    settings, setSettings,
    currencyRates, setCurrencyRates,
    packingUnits: Array.isArray(packingUnits) ? packingUnits : [], setPackingUnits,
    packingUnitMap,
    warehouseMap,
    productMap,
    recycleBin, setRecycleBin, addToRecycleBin, restoreFromRecycleBin, deletePermanentlyFromRecycleBin, cleanRecycleBin, getItemSummary,
    saveItem, deleteItem, getNextId, setNextIdForCollection,
    updateStockFromOrder, updateAverageCosts, updateStockForUtilization,
    updateStockForProductMovement,
    showAlertModal, showConfirmationModal,
    isConfirmationModalOpen, confirmationModalProps, closeConfirmationModal,
    convertCurrency,
    runningBalancesMap,
    nextIds,
    setNextIds,
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
    utilizationOrders, setUtilizationOrders,
    settings, setSettings,
    currencyRates, setCurrencyRates,
    packingUnits, setPackingUnits,
    packingUnitMap,
    warehouseMap,
    productMap,
    recycleBin, setRecycleBin, addToRecycleBin, restoreFromRecycleBin, deletePermanentlyFromRecycleBin, cleanRecycleBin, getItemSummary,
    saveItem, deleteItem, getNextId, setNextIdForCollection,
    updateStockFromOrder, updateAverageCosts, updateStockForUtilization,
    updateStockForProductMovement,
    showAlertModal, showConfirmationModal,
    isConfirmationModalOpen, confirmationModalProps, closeConfirmationModal,
    convertCurrency,
    runningBalancesMap,
    nextIds,
    setNextIds,
  ]);

  console.log("[DataContext] Final context value.bankAccounts:", value.bankAccounts);
  console.log("[DataContext] Final context value.nextIds:", value.nextIds);

  return (
    <DataContext.Provider value={value}>
      {children}
      <AlertDialog open={isConfirmationModalOpen} onOpenChange={closeConfirmationModal}>
        {confirmationModalProps && (
          <AlertDialogContent className="z-50">
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
                {confirmationModalProps.actionLabel || t('confirm')}
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