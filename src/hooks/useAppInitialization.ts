"use client";

import { useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { initialSettings } from '@/data/initialData'; // Only need initialSettings for settings-specific defaults
import {
  Product, Supplier, Customer, Warehouse, PurchaseOrder, SellOrder, Payment, ProductMovement,
  CurrencyRates, Settings, RecycleBinItem, PackingUnit, BankAccount, UtilizationOrder, QuickButton, Reminder
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
    const piecePackingUnit = packingUnits.find(pu => pu.name === 'Piece');
    const piecePackingUnitId = piecePackingUnit ? piecePackingUnit.id : undefined;

    const getMaxId = (collection: { id: number }[]): number => {
      return collection.length > 0 ? Math.max(...collection.map(item => item.id)) : 0;
    };

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
        paymentCategories: getMaxId(settings.paymentCategories || []) + 1,
        packingUnits: getMaxId(settings.packingUnits || []) + 1,
        quickButtons: getMaxId(settings.quickButtons || []) + 1,
        reminders: getMaxId(settings.reminders || []) + 1, // New: Reminders
      };
      return newNextIds;
    };

    // This effect runs on every render, but the 'initialized' flag ensures
    // certain first-time setup logic only executes once.
    // The individual useLocalStorage hooks already handle populating with initialData
    // if localStorage is empty for that specific key.
    if (!initialized) {
      console.log("useAppInitialization: App not initialized. Performing first-time setup.");
      // Ensure settings and currencyRates have their defaults if not already set by useLocalStorage
      // (This is a fallback, useLocalStorage should handle it)
      if (!settings.companyName) setSettings(initialSettings);
      if (!currencyRates['AZN']) setCurrencyRates(initialSettings.currencyRates); // Use initialSettings.currencyRates

      setInitialized(true);
      console.log("useAppInitialization: App initialized.");
    }

    // This part always runs to keep nextIds up-to-date and apply default packing unit
    const currentCalculatedNextIds = calculateNextIds();
    setNextIds(currentCalculatedNextIds);
    console.log("useAppInitialization: Recalculated nextIds:", currentCalculatedNextIds);

    // Ensure all existing products have 'Piece' as defaultPackingUnitId
    if (piecePackingUnitId !== undefined) {
      setProducts(prevProducts => {
        let changed = false;
        const updatedProducts = prevProducts.map(p => {
          if (p.defaultPackingUnitId === undefined || p.defaultPackingUnitId === null) {
            changed = true;
            return { ...p, defaultPackingUnitId: piecePackingUnitId };
          }
          return p;
        });
        return changed ? updatedProducts : prevProducts;
      });
    }
  }, [
    initialized, setInitialized,
    products, setProducts, suppliers, customers, warehouses,
    purchaseOrders, sellOrders, incomingPayments, outgoingPayments,
    productMovements, bankAccounts, utilizationOrders,
    settings, setSettings, currencyRates, setCurrencyRates,
    packingUnits, setPackingUnits, recycleBin, setRecycleBin, setNextIds,
  ]);
}