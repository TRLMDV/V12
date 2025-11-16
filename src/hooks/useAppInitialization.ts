"use client";

import { useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { initialData, initialSettings, defaultCurrencyRates, MOCK_CURRENT_DATE } from '@/data/initialData'; // Corrected import
import {
  Product, Supplier, Customer, Warehouse, PurchaseOrder, SellOrder, Payment, ProductMovement,
  CurrencyRates, Settings, RecycleBinItem, PackingUnit, BankAccount, UtilizationOrder, QuickButton
} from '@/types';

interface UseAppInitializationProps {
  products: Product[];
  suppliers: Supplier[];
  customers: Customer[];
  warehouses: Warehouse[];
  purchaseOrders: PurchaseOrder[];
  sellOrders: SellOrder[];
  incomingPayments: Payment[];
  outgoingPayments: Payment[];
  productMovements: ProductMovement[];
  bankAccounts: BankAccount[];
  utilizationOrders: UtilizationOrder[];
  settings: Settings;
  currencyRates: CurrencyRates;
  packingUnits: PackingUnit[];
  recycleBin: RecycleBinItem[];

  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  setWarehouses: React.Dispatch<React.SetStateAction<Warehouse[]>>;
  setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  setSellOrders: React.Dispatch<React.SetStateAction<SellOrder[]>>;
  setIncomingPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  setOutgoingPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  setProductMovements: React.Dispatch<React.SetStateAction<ProductMovement[]>>;
  setBankAccounts: React.Dispatch<React.SetStateAction<BankAccount[]>>;
  setUtilizationOrders: React.Dispatch<React.SetStateAction<UtilizationOrder[]>>;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  setCurrencyRates: React.Dispatch<React.SetStateAction<CurrencyRates>>;
  setPackingUnits: React.Dispatch<React.SetStateAction<PackingUnit[]>>;
  setRecycleBin: React.Dispatch<React.SetStateAction<RecycleBinItem[]>>;
  setNextIds: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>;
}

export function useAppInitialization({
  products, suppliers, customers, warehouses, purchaseOrders, sellOrders,
  incomingPayments, outgoingPayments, productMovements, bankAccounts, utilizationOrders,
  settings, currencyRates, packingUnits, recycleBin,
  setProducts, setSuppliers, setCustomers, setWarehouses, setPurchaseOrders, setSellOrders,
  setIncomingPayments, setOutgoingPayments, setProductMovements, setBankAccounts, setUtilizationOrders,
  setSettings, setCurrencyRates, setPackingUnits, setRecycleBin, setNextIds,
}: UseAppInitializationProps) {
  const [initialized, setInitialized] = useLocalStorage<boolean>('initialized', false);

  useEffect(() => {
    // Helper to get the max ID from a collection
    const getMaxId = (collection: { id: number }[]): number => {
      return collection.length > 0 ? Math.max(...collection.map(item => item.id)) : 0;
    };

    // Calculate nextIds based on current data in localStorage (or initialData if localStorage is empty)
    const calculateNextIds = () => {
      const newNextIds: { [key: string]: number } = {
        products: getMaxId(products) + 1,
        suppliers: getMaxId(suppliers) + 1,
        customers: getMaxId(customers) + 1,
        warehouses: getMaxId(warehouses) + 1,
        purchaseOrders: getMaxId(purchaseOrders) + 1,
        sellOrders: getMaxId(sellOrders) + 1,
        incomingPayments: getMaxId(incomingPayments) + 1,
        outgoingPayments: getMaxId(outgoingPayments) + 1,
        productMovements: getMaxId(productMovements) + 1,
        bankAccounts: getMaxId(bankAccounts) + 1,
        utilizationOrders: getMaxId(utilizationOrders) + 1,
        // For settings-managed collections, use the settings object directly
        paymentCategories: getMaxId(settings.paymentCategories || []) + 1,
        packingUnits: getMaxId(settings.packingUnits || []) + 1,
        quickButtons: getMaxId(settings.quickButtons || []) + 1,
      };
      return newNextIds;
    };

    // This effect runs on every mount/data change, but the initialization logic only runs once
    // or if localStorage is completely empty.
    if (!initialized) {
      console.log("useAppInitialization: App not initialized. Setting default data and calculating nextIds.");
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
      setBankAccounts(initialData.bankAccounts);
      setUtilizationOrders(initialData.utilizationOrders);
      setSettings(initialSettings);
      setCurrencyRates(defaultCurrencyRates);
      setPackingUnits(initialSettings.packingUnits);
      setRecycleBin([]);

      // Calculate and set nextIds based on these initial (empty) collections
      const calculatedInitialNextIds = calculateNextIds();
      setNextIds(calculatedInitialNextIds);
      setInitialized(true);
      console.log("useAppInitialization: App initialized with nextIds:", calculatedInitialNextIds);
    } else {
      // If already initialized, ensure nextIds are always up-to-date with current data
      // This handles cases where items might have been added/deleted and nextIds in localStorage
      // might not reflect the true max ID.
      const currentCalculatedNextIds = calculateNextIds();
      setNextIds(currentCalculatedNextIds);
      console.log("useAppInitialization: App already initialized. Recalculated nextIds:", currentCalculatedNextIds);
    }
  }, [
    initialized, setInitialized,
    products, suppliers, customers, warehouses, purchaseOrders, sellOrders,
    incomingPayments, outgoingPayments, productMovements, bankAccounts, utilizationOrders,
    settings, currencyRates, packingUnits, recycleBin,
    setProducts, setSuppliers, setCustomers, setWarehouses, setPurchaseOrders, setSellOrders,
    setIncomingPayments, setOutgoingPayments, setProductMovements, setBankAccounts, setUtilizationOrders,
    setSettings, setCurrencyRates, setPackingUnits, setRecycleBin, setNextIds,
  ]);
}