"use client";

import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { initialData, initialSettings, defaultCurrencyRates } from '@/data/initialData';
import {
  Product, Supplier, Customer, Warehouse, PurchaseOrder, SellOrder, Payment, ProductMovement,
  CurrencyRates, Settings, RecycleBinItem, PackingUnit, BankAccount, UtilizationOrder
} from '@/types';

export function useDataState() {
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
  const [utilizationOrders, setUtilizationOrders] = useLocalStorage<UtilizationOrder[]>('utilizationOrders', initialData.utilizationOrders);

  const [settings, setSettings] = useLocalStorage<Settings>('settings', initialSettings);
  const [currencyRates, setCurrencyRates] = useLocalStorage<CurrencyRates>('currencyRates', defaultCurrencyRates);
  const [packingUnits, setPackingUnits] = useLocalStorage<PackingUnit[]>('packingUnits', initialSettings.packingUnits);
  
  const [nextIds, setNextIds] = useLocalStorage<{ [key: string]: number }>('nextIds', {}); 
  const [recycleBin, setRecycleBin] = useLocalStorage<RecycleBinItem[]>('recycleBin', []);

  return {
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
  };
}