"use client";

import { useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { initialData, initialSettings, defaultCurrencyRates, MOCK_CURRENT_DATE } from '@/data/initialData';
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
      };
      return newNextIds;
    };

    // This block ensures that if the app is truly starting fresh (localStorage 'initialized' is false)
    // AND a collection is empty, it gets populated with its initialData (which are empty arrays).
    // This is to ensure the structure exists, even if empty.
    // If data was just imported, the collections will NOT be empty, so this block will be skipped for them.
    if (!initialized) {
      console.log("useAppInitialization: App not initialized. Checking for empty collections to set initial data.");
      if (warehouses.length === 0) setWarehouses(initialData.warehouses);
      if (products.length === 0) setProducts(initialData.products);
      if (suppliers.length === 0) setSuppliers(initialData.suppliers);
      if (customers.length === 0) setCustomers(initialData.customers);
      if (purchaseOrders.length === 0) setPurchaseOrders(initialData.purchaseOrders);
      if (sellOrders.length === 0) setSellOrders(initialData.sellOrders);
      if (incomingPayments.length === 0) setIncomingPayments(initialData.incomingPayments);
      if (outgoingPayments.length === 0) setOutgoingPayments(initialData.outgoingPayments);
      if (productMovements.length === 0) setProductMovements(initialData.productMovements);
      if (bankAccounts.length === 0) setBankAccounts(initialData.bankAccounts);
      if (utilizationOrders.length === 0) setUtilizationOrders(initialData.utilizationOrders);
      if (packingUnits.length === 0) setPackingUnits(initialSettings.packingUnits);
      if (recycleBin.length === 0) setRecycleBin([]);

      // For settings and currencyRates, useLocalStorage already handles initial population
      // if localStorage is empty. We don't need to explicitly set them here if they are already populated
      // by useLocalStorage reading initialSettings/defaultCurrencyRates.
      // However, if settings.companyName is still empty, it means initialSettings wasn't fully applied or was cleared.
      if (!settings.companyName) setSettings(initialSettings);
      if (!currencyRates['AZN']) setCurrencyRates(defaultCurrencyRates);

      // After ensuring all collections have at least their initial (possibly empty) structure, mark as initialized.
      setInitialized(true);
      console.log("useAppInitialization: App initialized. Next IDs calculated.");
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
    products, setProducts, suppliers, setSuppliers, customers, setCustomers, warehouses, setWarehouses,
    purchaseOrders, setPurchaseOrders, sellOrders, setSellOrders, incomingPayments, setIncomingPayments,
    outgoingPayments, setOutgoingPayments, productMovements, setProductMovements, bankAccounts, setBankAccounts,
    utilizationOrders, setUtilizationOrders, settings, setSettings, currencyRates, setCurrencyRates,
    packingUnits, setPackingUnits, recycleBin, setRecycleBin, setNextIds,
  ]);
}