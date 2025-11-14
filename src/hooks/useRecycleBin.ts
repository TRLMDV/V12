"use client";

import { useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { MOCK_CURRENT_DATE } from '@/data/initialData'; // Corrected import
import { t } from '@/utils/i18n';
import {
  RecycleBinItem, CollectionKey, Product, Supplier, Customer, Warehouse, PurchaseOrder, SellOrder, Payment, ProductMovement, PackingUnit, PaymentCategorySetting, Settings, BankAccount, UtilizationOrder
} from '@/types';
import { useModals } from './useModals'; // Assuming useModals is in the same hooks directory

interface UseRecycleBinProps {
  // Pass setters for active data collections
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  setWarehouses: React.Dispatch<React.SetStateAction<Warehouse[]>>;
  setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  setSellOrders: React.Dispatch<React.SetStateAction<SellOrder[]>>;
  setIncomingPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  setOutgoingPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  setProductMovements: React.Dispatch<React.SetStateAction<ProductMovement[]>>;
  setPackingUnits: React.Dispatch<React.SetStateAction<PackingUnit[]>>;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  setBankAccounts: React.Dispatch<React.SetStateAction<BankAccount[]>>;
  setUtilizationOrders: React.Dispatch<React.SetStateAction<UtilizationOrder[]>>; // New: setUtilizationOrders

  // Pass current state values for display/validation in summary
  products: Product[];
  suppliers: Supplier[];
  customers: Customer[];
  warehouses: Warehouse[];
  purchaseOrders: PurchaseOrder[];
  sellOrders: SellOrder[];
  incomingPayments: Payment[];
  outgoingPayments: Payment[];
  productMovements: ProductMovement[];
  packingUnits: PackingUnit[];
  settings: Settings;
  bankAccounts: BankAccount[];
  utilizationOrders: UtilizationOrder[]; // New: utilizationOrders
}

export function useRecycleBin({
  setProducts, setSuppliers, setCustomers, setWarehouses, setPurchaseOrders, setSellOrders,
  setIncomingPayments, setOutgoingPayments, setProductMovements, setPackingUnits, setSettings, setBankAccounts, setUtilizationOrders, // Added setUtilizationOrders
  products, suppliers, customers, warehouses, purchaseOrders, sellOrders, incomingPayments, outgoingPayments,
  productMovements, packingUnits, settings, bankAccounts, utilizationOrders, // Added utilizationOrders
}: UseRecycleBinProps) {
  const [recycleBin, setRecycleBin] = useLocalStorage<RecycleBinItem[]>('recycleBin', []);
  const { showAlertModal, showConfirmationModal } = useModals();

  // Memoized maps for item summary generation
  const supplierMap = useCallback(() => suppliers.reduce((acc, s) => ({ ...acc, [s.id]: s }), {} as { [key: number]: Supplier }), [suppliers]);
  const customerMap = useCallback(() => customers.reduce((acc, c) => ({ ...acc, [c.id]: c }), {} as { [key: number]: Customer }), [customers]);
  const warehouseMap = useCallback(() => warehouses.reduce((acc, w) => ({ ...acc, [w.id]: w }), {} as { [key: number]: Warehouse }), [warehouses]);
  const productMap = useCallback(() => products.reduce((acc, p) => ({ ...acc, [p.id]: p }), {} as { [key: number]: Product }), [products]);

  const getItemSummary = useCallback((item: any, collectionKey: CollectionKey): string => {
    switch (collectionKey) {
      case 'products':
        const product = item as Product;
        return `${product.name} (SKU: ${product.sku})`;
      case 'suppliers':
        const supplier = item as Supplier;
        return `${supplier.name} (Contact: ${supplier.contact})`;
      case 'customers':
        const customer = item as Customer;
        return `${customer.name} (Email: ${customer.email})`;
      case 'warehouses':
        const warehouse = item as Warehouse;
        return `${warehouse.name} (${warehouse.location})`;
      case 'purchaseOrders':
        const po = item as PurchaseOrder;
        const poSupplier = supplierMap()[po.contactId]?.name || 'N/A';
        return `PO #${po.id} (${poSupplier}) - Total: ${po.total.toFixed(2)} AZN`;
      case 'sellOrders':
        const so = item as SellOrder;
        const soCustomer = customerMap()[so.contactId]?.name || 'N/A';
        return `SO #${so.id} (${soCustomer}) - Total: ${so.total.toFixed(2)} AZN`;
      case 'incomingPayments':
      case 'outgoingPayments':
        const payment = item as Payment;
        const orderRef = payment.orderId === 0 ? t('manualExpense') : `${t('orderId')} #${payment.orderId}`;
        return `${t('paymentId')} #${payment.id} - ${payment.amount.toFixed(2)} ${payment.paymentCurrency} (${orderRef})`;
      case 'productMovements':
        const pm = item as ProductMovement;
        const source = warehouseMap()[pm.sourceWarehouseId]?.name || 'N/A';
        const dest = warehouseMap()[pm.destWarehouseId]?.name || 'N/A';
        return `${t('movement')} #${pm.id} from ${source} to ${dest}`;
      case 'utilizationOrders': // New: Utilization Order summary
        const uo = item as UtilizationOrder;
        const uoWarehouse = warehouseMap()[uo.warehouseId]?.name || 'N/A';
        const totalUtilizedItems = uo.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
        const commentSummary = uo.comment ? ` - "${uo.comment}"` : '';
        return `${t('utilizationOrder')} #${uo.id} (${uoWarehouse}) - ${totalUtilizedItems} ${t('items')}${commentSummary}`;
      case 'packingUnits':
        const pu = item as PackingUnit;
        return `${pu.name} (${pu.conversionFactor} ${t(pu.baseUnit)})`;
      case 'paymentCategories':
        const pc = item as PaymentCategorySetting;
        return `${pc.name}`;
      case 'bankAccounts':
        const ba = item as BankAccount;
        return `${ba.name} (${ba.currency})`;
      default:
        return JSON.stringify(item);
    }
  }, [supplierMap, customerMap, warehouseMap, productMap, t]);


  const addToRecycleBin = useCallback((item: any, collectionKey: CollectionKey) => {
    const recycleItemId = `${String(collectionKey)}-${item.id}-${Date.now()}`;
    const newItem: RecycleBinItem = {
      id: recycleItemId,
      originalId: item.id,
      collectionKey: collectionKey as CollectionKey,
      data: item,
      deletedAt: MOCK_CURRENT_DATE.toISOString(),
    };
    setRecycleBin(prev => [...prev, newItem]);
    showAlertModal(t('success'), t('itemMovedToRecycleBin'));
    console.log("useRecycleBin: Item added to recycle bin:", newItem);
  }, [setRecycleBin, showAlertModal, t]);

  const restoreFromRecycleBin = useCallback((recycleItemId: string) => {
    console.log("DEBUG: useRecycleBin - restoreFromRecycleBin called for ID:", recycleItemId); // New log
    showConfirmationModal(
      t('restoreData'),
      t('restoreWarning'),
      () => {
        console.log("DEBUG: useRecycleBin - restoreFromRecycleBin - Confirmation callback executed."); // New log
        setRecycleBin(prevRecycleBin => {
          const itemToRestore = prevRecycleBin.find(item => item.id === recycleItemId);
          if (!itemToRestore) {
            showAlertModal(t('error'), t('itemNotFoundInRecycleBin'));
            console.error("useRecycleBin: Item not found in recycle bin for restore:", recycleItemId);
            return prevRecycleBin;
          }

          const { collectionKey, data } = itemToRestore;
          let setter: React.Dispatch<React.SetStateAction<any[]>> | React.Dispatch<React.SetStateAction<Settings>>;

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
            case 'utilizationOrders': setter = setUtilizationOrders; break;
            case 'packingUnits': setter = setPackingUnits; break;
            case 'bankAccounts': setter = setBankAccounts; break;
            case 'paymentCategories':
              setSettings(prevSettings => ({
                ...prevSettings,
                paymentCategories: [...(prevSettings.paymentCategories || []), data],
              }));
              showAlertModal(t('success'), t('itemRestored'));
              console.log("useRecycleBin: Payment category restored:", data);
              return prevRecycleBin.filter(item => item.id !== recycleItemId);
            default:
              showAlertModal(t('error'), t('unknownCollectionType'));
              console.error("useRecycleBin: Unknown collection type for restore:", collectionKey);
              return prevRecycleBin;
          }

          (setter as React.Dispatch<React.SetStateAction<any[]>>)(prevItems => {
            if (prevItems.some((i: any) => i.id === data.id)) {
              showAlertModal(t('error'), t('itemAlreadyExists'));
              console.warn("useRecycleBin: Item already exists in active data, not restoring:", data);
              return prevItems;
            }
            console.log(`useRecycleBin: Restoring item to ${collectionKey}:`, data);
            return [...prevItems, data];
          });

          showAlertModal(t('success'), t('itemRestored'));
          return prevRecycleBin.filter(item => item.id !== recycleItemId);
        });
      },
      t('restore') // Pass action label
    );
  }, [setRecycleBin, setProducts, setSuppliers, setCustomers, setWarehouses, setPurchaseOrders, setSellOrders, setIncomingPayments, setOutgoingPayments, setProductMovements, setPackingUnits, setBankAccounts, setUtilizationOrders, setSettings, showAlertModal, showConfirmationModal, t]);

  const deletePermanentlyFromRecycleBin = useCallback((recycleItemId: string) => {
    console.log("DEBUG: useRecycleBin - deletePermanentlyFromRecycleBin called for ID:", recycleItemId); // New log
    showConfirmationModal(
      t('deletePermanently'),
      t('deletePermanentlyWarning'),
      () => {
        console.log("DEBUG: useRecycleBin - deletePermanentlyFromRecycleBin - Confirmation callback executed."); // New log
        setRecycleBin(prev => prev.filter(item => item.id !== recycleItemId));
        showAlertModal(t('success'), t('itemDeletedPermanently'));
        console.log("useRecycleBin: Item permanently deleted:", recycleItemId);
      },
      t('deletePermanently') // Pass action label
    );
  }, [setRecycleBin, showConfirmationModal, showAlertModal, t]);

  const cleanRecycleBin = useCallback(() => {
    console.log("DEBUG: useRecycleBin - cleanRecycleBin called."); // New log
    showConfirmationModal(
      t('cleanRecycleBin'),
      t('cleanRecycleBinWarning'),
      () => {
        console.log("DEBUG: useRecycleBin - cleanRecycleBin - Confirmation callback executed."); // New log
        setRecycleBin([]);
        showAlertModal(t('success'), t('recycleBinCleaned'));
        console.log("useRecycleBin: Recycle bin cleaned.");
      },
      t('cleanRecycleBin') // Pass action label
    );
  }, [setRecycleBin, showConfirmationModal, showAlertModal, t]);

  return {
    recycleBin,
    setRecycleBin,
    addToRecycleBin,
    restoreFromRecycleBin,
    deletePermanentlyFromRecycleBin,
    cleanRecycleBin,
    getItemSummary,
  };
}