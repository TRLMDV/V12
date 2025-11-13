"use client";

import { useCallback } from 'react';
import { toast as sonnerToast } from 'sonner';
import { t } from '@/utils/i18n';
import {
  Product, Supplier, Customer, Warehouse, PurchaseOrder, SellOrder, Payment, ProductMovement,
  CollectionKey, PackingUnit, PaymentCategorySetting, Settings
} from '@/types';

interface UseCrudOperationsProps {
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  setWarehouses: React.Dispatch<React.SetStateAction<Warehouse[]>>;
  setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  setSellOrders: React.Dispatch<React.SetStateAction<SellOrder[]>>;
  setIncomingPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  setOutgoingPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  setProductMovements: React.Dispatch<React.SetStateAction<ProductMovement[]>>;
  setPackingUnits: React.Dispatch<React.SetStateAction<PackingUnit[]>>; // Added
  setSettings: React.Dispatch<React.SetStateAction<Settings>>; // Added for paymentCategories
  nextIds: { [key: string]: number }; // Still need nextIds value for getNextId
  setNextIds: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>;
  showAlertModal: (title: string, message: string) => void;
  showConfirmationModal: (title: string, message: string, onConfirm: () => void) => void;
  updateStockFromOrder: (newOrder: PurchaseOrder | SellOrder | null, oldOrder: PurchaseOrder | SellOrder | null) => void;
  updateAverageCosts: (purchaseOrder: PurchaseOrder) => void; // Added
  addToRecycleBin: (item: any, collectionKey: CollectionKey) => void;
  // Pass current state values for validation checks where needed, but not as dependencies for useCallback
  products: Product[];
  suppliers: Supplier[];
  customers: Customer[];
  warehouses: Warehouse[];
  purchaseOrders: PurchaseOrder[];
  sellOrders: SellOrder[];
  incomingPayments: Payment[];
  outgoingPayments: Payment[];
  productMovements: ProductMovement[];
  packingUnits: PackingUnit[]; // Added
  settings: Settings; // Added for paymentCategories
}

export function useCrudOperations({
  setProducts,
  setSuppliers,
  setCustomers,
  setWarehouses,
  setPurchaseOrders,
  setSellOrders,
  setIncomingPayments,
  setOutgoingPayments,
  setProductMovements,
  setPackingUnits, // Destructure new prop
  setSettings, // Destructure new prop
  nextIds, setNextIds,
  showAlertModal, showConfirmationModal,
  updateStockFromOrder,
  addToRecycleBin,
  // Current state values for validation, not for useCallback dependencies
  products, suppliers, customers, warehouses, purchaseOrders, sellOrders, incomingPayments, outgoingPayments, productMovements, packingUnits, settings,
}: UseCrudOperationsProps) {

  const getNextId = useCallback((key: CollectionKey) => {
    return nextIds[key] || 1;
  }, [nextIds]); // nextIds is a dependency here, which is fine as it's a single object.

  const setNextIdForCollection = useCallback((key: CollectionKey, newNextId: number) => {
    setNextIds(prev => ({ ...prev, [key]: newNextId }));
  }, [setNextIds]); // setNextIds is stable.

  const saveItem = useCallback((key: CollectionKey, item: any) => {
    let setter: React.Dispatch<React.SetStateAction<any[]>> | React.Dispatch<React.SetStateAction<PaymentCategorySetting[]>> | React.Dispatch<React.SetStateAction<PackingUnit[]>>;
    let currentCollection: any[] = []; // To be populated for validation

    switch (key) {
      case 'products': setter = setProducts; currentCollection = products; break;
      case 'suppliers': setter = setSuppliers; currentCollection = suppliers; break;
      case 'customers': setter = setCustomers; currentCollection = customers; break;
      case 'warehouses': setter = setWarehouses; currentCollection = warehouses; break;
      case 'purchaseOrders': setter = setPurchaseOrders; currentCollection = purchaseOrders; break;
      case 'sellOrders': setter = setSellOrders; currentCollection = sellOrders; break;
      case 'incomingPayments': setter = setIncomingPayments; currentCollection = incomingPayments; break;
      case 'outgoingPayments': setter = setOutgoingPayments; currentCollection = outgoingPayments; break;
      case 'productMovements': setter = setProductMovements; currentCollection = productMovements; break;
      case 'packingUnits': setter = setPackingUnits; currentCollection = packingUnits; break;
      case 'paymentCategories':
        setSettings((prevSettings: Settings) => {
          const existingCategories = prevSettings.paymentCategories || [];
          const existingItemIndex = existingCategories.findIndex((i: any) => i.id === item.id);
          let updatedCategories;

          if (item.id === 0 || existingItemIndex === -1) { // New item
            const newItemId = getNextId(key);
            updatedCategories = [...existingCategories, { ...item, id: newItemId }];
            setNextIdForCollection(key, newItemId + 1);
          } else { // Existing item, update it
            updatedCategories = existingCategories.map((i: any) => i.id === item.id ? item : i);
          }
          return { ...prevSettings, paymentCategories: updatedCategories };
        });
        sonnerToast.success(t('success'), { description: `${t('detailsUpdated')}` });
        return;
      default: return;
    }

    // Specific validation for warehouses (needs currentCollection)
    if (key === 'warehouses' && item.type === 'Main') {
      const existingMainWarehouse = currentCollection.find((w: Warehouse) => w.type === 'Main' && w.id !== item.id);
      if (existingMainWarehouse) {
        showAlertModal(t('validationError'), t('onlyOneMainWarehouse'));
        return;
      }
    }

    (setter as React.Dispatch<React.SetStateAction<any[]>>)(prevItems => {
      const existingItemIndex = prevItems.findIndex(i => i.id === item.id);
      let updatedItems;

      if (item.id === 0 || existingItemIndex === -1) { // New item
        const newItemId = getNextId(key);
        updatedItems = [...prevItems, { ...item, id: newItemId }];
        setNextIdForCollection(key, newItemId + 1); // Increment next ID for this collection
      } else { // Existing item, update it
        updatedItems = prevItems.map(i => i.id === item.id ? item : i);
      }
      return updatedItems;
    });
    sonnerToast.success(t('success'), { description: `${t('detailsUpdated')}` });
  }, [
    setProducts, setSuppliers, setCustomers, setWarehouses, setPurchaseOrders, setSellOrders,
    setIncomingPayments, setOutgoingPayments, setProductMovements, setPackingUnits, setSettings,
    getNextId, setNextIdForCollection, showAlertModal,
    // Include current state values for validation, but not as dependencies for useCallback
    products, suppliers, customers, warehouses, purchaseOrders, sellOrders, incomingPayments, outgoingPayments, productMovements, packingUnits, settings,
  ]);

  const deleteItem = useCallback((key: CollectionKey, id: number) => {
    const onConfirmDelete = () => {
      let setter: React.Dispatch<React.SetStateAction<any[]>> | React.Dispatch<React.SetStateAction<Settings>>;
      let currentCollection: any[] = []; // To be populated for validation

      switch (key) {
        case 'products': setter = setProducts; currentCollection = products; break;
        case 'suppliers': setter = setSuppliers; currentCollection = suppliers; break;
        case 'customers': setter = setCustomers; currentCollection = customers; break;
        case 'warehouses': setter = setWarehouses; currentCollection = warehouses; break;
        case 'purchaseOrders': setter = setPurchaseOrders; currentCollection = purchaseOrders; break;
        case 'sellOrders': setter = setSellOrders; currentCollection = sellOrders; break;
        case 'incomingPayments': setter = setIncomingPayments; currentCollection = incomingPayments; break;
        case 'outgoingPayments': setter = setOutgoingPayments; currentCollection = outgoingPayments; break;
        case 'productMovements': setter = setProductMovements; currentCollection = productMovements; break;
        case 'packingUnits': setter = setPackingUnits; currentCollection = packingUnits; break;
        case 'paymentCategories':
          const categoryToDelete = (settings.paymentCategories || []).find((c: PaymentCategorySetting) => c.id === id);
          if (!categoryToDelete) {
            showAlertModal(t('error'), t('itemNotFound'));
            return;
          }
          addToRecycleBin(categoryToDelete, key);
          setSettings((prevSettings: Settings) => ({
            ...prevSettings,
            paymentCategories: (prevSettings.paymentCategories || []).filter((c: PaymentCategorySetting) => c.id !== id),
          }));
          return;
        default: return;
      }

      const itemToDelete = currentCollection.find(i => i.id === id);
      if (!itemToDelete) {
        showAlertModal(t('error'), t('itemNotFound'));
        return;
      }

      // --- Deletion validation checks (need current state values) ---
      if (key === 'products') {
        const hasOrders = sellOrders.some(o => o.items?.some(i => i.productId === id)) || purchaseOrders.some(o => o.items?.some(i => i.productId === id));
        if (hasOrders) { showAlertModal(t('deletionFailed'), t('cannotDeleteProductInOrders')); return; }

        const hasMovements = productMovements.some(m => m.items?.some(i => i.productId === id));
        if (hasMovements) { showAlertModal(t('deletionFailed'), t('cannotDeleteProductInMovements')); return; }

        const productToDelete = products.find(p => p.id === id);
        if (productToDelete && productToDelete.stock && Object.values(productToDelete.stock).some(qty => qty > 0)) {
          showAlertModal(t('deletionFailed'), t('cannotDeleteProductWithStock'));
          return;
        }
      }
      if (key === 'warehouses') {
        const warehouseToDelete = currentCollection.find((w: Warehouse) => w.id === id);
        if (warehouseToDelete && warehouseToDelete.type === 'Main') {
          showAlertModal(t('deletionFailed'), t('cannotDeleteMainWarehouse'));
          return;
        }
        if (products.some(p => p.stock && p.stock[id] && p.stock[id] > 0)) {
          showAlertModal(t('deletionFailed'), t('cannotDeleteWarehouseWithStock'));
          return;
        }
        const hasOrders = purchaseOrders.some(o => o.warehouseId === id) ||
                         sellOrders.some(o => o.warehouseId === id) ||
                         productMovements.some(m => m.sourceWarehouseId === id || m.destWarehouseId === id);
        if (hasOrders) { showAlertModal(t('deletionFailed'), t('cannotDeleteWarehouseInUse')); return; }
      }
      if (key === 'suppliers' || key === 'customers') {
        const orderCollection = key === 'suppliers' ? purchaseOrders : sellOrders;
        if (orderCollection.some(o => o.contactId === id)) { showAlertModal(t('deletionFailed'), t(`cannotDeleteContactInOrders`, { contactType: t(key.slice(0, -1) as keyof typeof t) })); return; }
      }
      if (key === 'packingUnits') {
        if (products.some(p => p.defaultPackingUnitId === id)) {
          showAlertModal(t('deletionFailed'), t('cannotDeletePackingUnitInUse'));
          return;
        }
        if (purchaseOrders.some(po => po.items.some(item => item.packingUnitId === id)) ||
            sellOrders.some(so => so.items.some(item => item.packingUnitId === id))) {
          showAlertModal(t('deletionFailed'), t('cannotDeletePackingUnitInOrders'));
          return;
        }
      }

      // Reverse stock change if deleting a completed order/movement
      if (key === 'purchaseOrders' || key === 'sellOrders') {
        const orderToDelete = currentCollection.find(o => o.id === id);
        if (orderToDelete) updateStockFromOrder(null, orderToDelete);
      } else if (key === 'productMovements') {
        const movementToDelete = currentCollection.find(m => m.id === id);
        if (movementToDelete) {
          setSellOrders(prevSellOrders => prevSellOrders.map(so =>
            so.productMovementId === movementToDelete.id
              ? { ...so, productMovementId: undefined }
              : so
          ));

          setProducts(prevProducts => prevProducts.map(p => {
            if (p.stock && movementToDelete.items?.some(item => item.productId === p.id)) {
              const newP = { ...p, stock: { ...p.stock } };
              movementToDelete.items.forEach(item => {
                if (item.productId === p.id) {
                  newP.stock[movementToDelete.sourceWarehouseId] = (newP.stock[movementToDelete.sourceWarehouseId] || 0) + item.quantity;
                  newP.stock[movementToDelete.destWarehouseId] = (newP.stock[movementToDelete.destWarehouseId] || 0) - item.quantity;
                }
              });
              return newP;
            }
            return p;
          }));
        }
      } else if (key === 'incomingPayments') {
        const paymentToDelete = itemToDelete as Payment;
        if (paymentToDelete.orderId !== 0) {
          setSellOrders(prevSellOrders => prevSellOrders.map(so =>
            so.incomingPaymentId === paymentToDelete.id
              ? { ...so, incomingPaymentId: undefined }
              : so
          ));
        }
      }

      // Move to recycle bin instead of permanent deletion
      addToRecycleBin(itemToDelete, key);
      (setter as React.Dispatch<React.SetStateAction<any[]>>)(prevItems => prevItems.filter(i => i.id !== id)); // Remove from active data
    };
    showConfirmationModal(t('confirmation'), t('areYouSure'), onConfirmDelete);
  }, [
    setProducts, setSuppliers, setCustomers, setWarehouses, setPurchaseOrders, setSellOrders,
    setIncomingPayments, setOutgoingPayments, setProductMovements, setPackingUnits, setSettings,
    showAlertModal, showConfirmationModal, updateStockFromOrder, addToRecycleBin,
    // Include current state values for validation, but not as dependencies for useCallback
    products, suppliers, customers, warehouses, purchaseOrders, sellOrders, incomingPayments, outgoingPayments, productMovements, packingUnits, settings,
  ]);

  return {
    getNextId,
    setNextIdForCollection,
    saveItem,
    deleteItem,
  };
}