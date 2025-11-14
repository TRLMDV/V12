"use client";

import { useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { initialData, initialSettings, defaultCurrencyRates, MOCK_CURRENT_DATE } from '@/data/initialData'; // Corrected import
import {
  Product, Supplier, Customer, Warehouse, PurchaseOrder, SellOrder, Payment, ProductMovement,
  CurrencyRates, Settings, RecycleBinItem, PackingUnit, BankAccount, UtilizationOrder
} from '@/types';

interface UseAppInitializationProps {
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
  setUtilizationOrders: React.Dispatch<React.SetStateAction<UtilizationOrder[]>>; // New: setUtilizationOrders
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  setCurrencyRates: React.Dispatch<React.SetStateAction<CurrencyRates>>;
  setPackingUnits: React.Dispatch<React.SetStateAction<PackingUnit[]>>;
  setRecycleBin: React.Dispatch<React.SetStateAction<RecycleBinItem[]>>;
  setNextIds: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>;
}

export function useAppInitialization({
  setProducts, setSuppliers, setCustomers, setWarehouses, setPurchaseOrders, setSellOrders,
  setIncomingPayments, setOutgoingPayments, setProductMovements, setBankAccounts, setUtilizationOrders, // Added setUtilizationOrders
  setSettings, setCurrencyRates, setPackingUnits, setRecycleBin, setNextIds,
}: UseAppInitializationProps) {
  const [initialized, setInitialized] = useLocalStorage<boolean>('initialized', false);

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
      setBankAccounts(initialData.bankAccounts);
      setUtilizationOrders(initialData.utilizationOrders); // New: Initialize utilization orders
      setSettings(initialSettings);
      setCurrencyRates(defaultCurrencyRates);
      setPackingUnits(initialSettings.packingUnits);
      setRecycleBin([]);

      // Initialize nextIds based on initial data (which are now empty, so start from 1)
      const initialNextIds: { [key: string]: number } = {};
      (Object.keys(initialData) as (keyof typeof initialData)[]).forEach(key => {
        initialNextIds[key] = 1;
      });
      initialNextIds.paymentCategories = initialSettings.paymentCategories.length > 0 ? Math.max(...initialSettings.paymentCategories.map(c => c.id)) + 1 : 1;
      initialNextIds.packingUnits = initialSettings.packingUnits.length > 0 ? Math.max(...initialSettings.packingUnits.map(pu => pu.id)) + 1 : 1;
      initialNextIds.bankAccounts = initialData.bankAccounts.length > 0 ? Math.max(...initialData.bankAccounts.map(ba => ba.id)) + 1 : 1;
      initialNextIds.utilizationOrders = initialData.utilizationOrders.length > 0 ? Math.max(...initialData.utilizationOrders.map(uo => uo.id)) + 1 : 1; // New: Initialize utilizationOrders nextId
      initialNextIds.quickButtons = initialSettings.quickButtons.length > 0 ? Math.max(...initialSettings.quickButtons.map(qb => qb.id)) + 1 : 1; // New: Initialize quickButtons nextId
      setNextIds(initialNextIds);
      setInitialized(true);
    }
  }, [initialized, setInitialized, setProducts, setSuppliers, setCustomers, setWarehouses, setPurchaseOrders, setSellOrders, setIncomingPayments, setOutgoingPayments, setProductMovements, setBankAccounts, setUtilizationOrders, setSettings, setCurrencyRates, setPackingUnits, setNextIds, setRecycleBin]);
}