"use client";

import { useCallback } from 'react';
import { toast as sonnerToast } from 'sonner';
import { t } from '@/utils/i18n';
import {
  Product, Supplier, Customer, Warehouse, PurchaseOrder, SellOrder, Payment, ProductMovement,
  CollectionKey
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
  nextIds: { [key: string]: number }; // Still need nextIds value for getNextId
  setNextIds: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>;
  showAlertModal: (title: string, message: string) => void;
  showConfirmationModal: (title: string, message: string, onConfirm: () => void) => void;
  updateStockFromOrder: (newOrder: PurchaseOrder | SellOrder | null, oldOrder: PurchaseOrder | SellOrder | null) => void;
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
  nextIds, setNextIds,
  showAlertModal, showConfirmationModal,
  updateStockFromOrder,
  addToRecycleBin,
  // Current state values for validation, not for useCallback dependencies
  products, suppliers, customers, warehouses, purchaseOrders, sellOrders, incomingPayments, outgoingPayments, productMovements,
}: UseCrudOperationsProps) {

  const getNextId = useCallback((key: CollectionKey) => {
    return nextIds[key] || 1;
  }, [nextIds]); // nextIds is a dependency here, which is fine as it's a single object.

  const setNextIdForCollection = useCallback((key: CollectionKey, newNextId: number) => {
    setNextIds(prev => ({ ...prev, [key]: newNextId }));
  }, [setNextIds]); // setNextIds is stable.

  const saveItem = useCallback((key: CollectionKey, item: any) => {
    let setter: React.Dispatch<React.SetStateAction<any[]>>;
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

    setter(prevItems => {
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
    setIncomingPayments, setOutgoingPayments, setProductMovements,
    getNextId, setNextIdForCollection, showAlertModal,
    // Include current state values for validation, but not as dependencies for useCallback
    products, suppliers, customers, warehouses, purchaseOrders, sellOrders, incomingPayments, outgoingPayments, productMovements,
  ]);

  const deleteItem = useCallback((key: CollectionKey, id: number) => {
    const onConfirmDelete = () => {
      let setter: React.Dispatch<React.SetStateAction<any[]>>;
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
        if (hasOrders) { showAlertModal('Deletion Failed', 'Cannot delete this product because it is used in existing purchase or sell orders.'); return; }

        const hasMovements = productMovements.some(m => m.items?.some(i => i.productId === id));
        if (hasMovements) { showAlertModal('Deletion Failed', 'Cannot delete this product. It is used in existing product movements.'); return; }

        const productToDelete = products.find(p => p.id === id);
        if (productToDelete && productToDelete.stock && Object.values(productToDelete.stock).some(qty => qty > 0)) {
          showAlertModal('Deletion Failed', 'Cannot delete this product. There is remaining stock across warehouses.');
          return;
        }
      }
      if (key === 'warehouses') {
        const warehouseToDelete = currentCollection.find((w: Warehouse) => w.id === id);
        if (warehouseToDelete && warehouseToDelete.type === 'Main') {
          showAlertModal('Deletion Failed', 'Cannot delete the Main Warehouse. Please designate another warehouse as Main first.');
          return;
        }
        if (products.some(p => p.stock && p.stock[id] && p.stock[id] > 0)) {
          showAlertModal('Deletion Failed', 'Cannot delete this warehouse because it contains stock. Please move all products first.');
          return;
        }
        const hasOrders = purchaseOrders.some(o => o.warehouseId === id) ||
                         sellOrders.some(o => o.warehouseId === id) ||
                         productMovements.some(m => m.sourceWarehouseId === id || m.destWarehouseId === id);
        if (hasOrders) { showAlertModal('Deletion Failed', 'Cannot delete this warehouse. It is used in existing orders or movements.'); return; }
      }
      if (key === 'suppliers' || key === 'customers') {
        const orderCollection = key === 'suppliers' ? purchaseOrders : sellOrders;
        if (orderCollection.some(o => o.contactId === id)) { showAlertModal('Deletion Failed', `Cannot delete this ${key.slice(0, -1)} because they are linked to existing orders.`); return; }
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
      setter(prevItems => prevItems.filter(i => i.id !== id)); // Remove from active data
    };
    showConfirmationModal(t('confirmation'), t('areYouSure'), onConfirmDelete);
  }, [
    setProducts, setSuppliers, setCustomers, setWarehouses, setPurchaseOrders, setSellOrders,
    setIncomingPayments, setOutgoingPayments, setProductMovements,
    showAlertModal, showConfirmationModal, updateStockFromOrder, addToRecycleBin,
    // Include current state values for validation, but not as dependencies for useCallback
    products, suppliers, customers, warehouses, purchaseOrders, sellOrders, incomingPayments, outgoingPayments, productMovements,
  ]);

  return {
    getNextId,
    setNextIdForCollection,
    saveItem,
    deleteItem,
  };
}