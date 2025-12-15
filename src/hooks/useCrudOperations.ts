"use client";

import { useCallback } from 'react';
import { toast as sonnerToast } from 'sonner';
import { t } from '@/utils/i18n';
import {
  Product, Supplier, Customer, Warehouse, PurchaseOrder, SellOrder, Payment, ProductMovement,
  CollectionKey, PackingUnit, PaymentCategorySetting, Settings, BankAccount, UtilizationOrder, QuickButton, Reminder
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
  setUtilizationOrders: React.Dispatch<React.SetStateAction<UtilizationOrder[]>>;
  setPackingUnits: React.Dispatch<React.SetStateAction<PackingUnit[]>>;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  setBankAccounts: React.Dispatch<React.SetStateAction<BankAccount[]>>;
  nextIds: { [key: string]: number };
  setNextIds: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>;
  showAlertModal: (title: string, message: string) => void;
  showConfirmationModal: (title: string, message: string, onConfirm: () => void, actionLabel?: string) => void;
  updateStockFromOrder: (newOrder: PurchaseOrder | SellOrder | null, oldOrder: PurchaseOrder | SellOrder | null) => void;
  updateAverageCosts: (purchaseOrder: PurchaseOrder) => void;
  updateStockForUtilization: (newOrder: UtilizationOrder | null, oldOrder: UtilizationOrder | null) => void;
  updateStockForProductMovement: (newMovement: ProductMovement | null, oldMovement: ProductMovement | null) => void; // New prop
  addToRecycleBin: (item: any, collectionKey: CollectionKey) => void; // Added this line
  products: Product[];
  suppliers: Supplier[];
  customers: Customer[];
  warehouses: Warehouse[];
  purchaseOrders: PurchaseOrder[];
  sellOrders: SellOrder[];
  incomingPayments: Payment[];
  outgoingPayments: Payment[];
  productMovements: ProductMovement[];
  utilizationOrders: UtilizationOrder[];
  packingUnits: PackingUnit[];
  settings: Settings;
  bankAccounts: BankAccount[];
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
  setUtilizationOrders,
  setPackingUnits,
  setSettings,
  setBankAccounts,
  nextIds, setNextIds,
  showAlertModal, showConfirmationModal,
  updateStockFromOrder,
  updateAverageCosts,
  updateStockForUtilization,
  updateStockForProductMovement, // Destructure new prop
  addToRecycleBin,
  products, suppliers, customers, warehouses, purchaseOrders, sellOrders, incomingPayments, outgoingPayments, productMovements, utilizationOrders, packingUnits, settings, bankAccounts,
}: UseCrudOperationsProps) {

  const getNextId = useCallback((key: CollectionKey) => {
    return nextIds[key] || 1;
  }, [nextIds]);

  const setNextIdForCollection = useCallback((key: CollectionKey, newNextId: number) => {
    setNextIds(prev => ({ ...prev, [key]: newNextId }));
  }, [setNextIds]);

  const saveItem = useCallback((key: CollectionKey, item: any) => {
    let setter: React.Dispatch<React.SetStateAction<any[]>> | React.Dispatch<React.SetStateAction<PaymentCategorySetting[]>> | React.Dispatch<React.SetStateAction<PackingUnit[]>> | React.Dispatch<React.SetStateAction<BankAccount[]>> | React.Dispatch<React.SetStateAction<QuickButton[]>> | React.Dispatch<React.SetStateAction<Reminder[]>>;
    let currentCollection: any[] = [];

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
      case 'utilizationOrders': setter = setUtilizationOrders; currentCollection = utilizationOrders; break;
      case 'packingUnits': setter = setPackingUnits; currentCollection = packingUnits; break;
      case 'bankAccounts':
        setter = setBankAccounts;
        currentCollection = bankAccounts;
        break;
      case 'paymentCategories':
        setSettings((prevSettings: Settings) => {
          const existingCategories = prevSettings.paymentCategories || [];
          const existingItemIndex = existingCategories.findIndex((i: any) => i.id === item.id);
          let updatedCategories;

          if (item.id === 0 || existingItemIndex === -1) {
            const newItemId = getNextId(key);
            updatedCategories = [...existingCategories, { ...item, id: newItemId }];
            setNextIdForCollection(key, newItemId + 1);
          } else {
            updatedCategories = existingCategories.map((i: any) => i.id === item.id ? item : i);
          }
          return { ...prevSettings, paymentCategories: updatedCategories };
        });
        sonnerToast.success(t('success'), { description: `${t('detailsUpdated')}` });
        return;
      case 'quickButtons':
        setSettings((prevSettings: Settings) => {
          const existingButtons = prevSettings.quickButtons || [];
          const existingItemIndex = existingButtons.findIndex((i: any) => i.id === item.id);
          let updatedButtons;

          if (item.id === 0 || existingItemIndex === -1) {
            const newItemId = getNextId(key);
            updatedButtons = [...existingButtons, { ...item, id: newItemId }];
            setNextIdForCollection(key, newItemId + 1);
          } else {
            updatedButtons = existingButtons.map((i: any) => i.id === item.id ? item : i);
          }
          return { ...prevSettings, quickButtons: updatedButtons };
        });
        sonnerToast.success(t('success'), { description: `${t('detailsUpdated')}` });
        return;
      case 'reminders':
        setSettings((prevSettings: Settings) => {
          const existingReminders = prevSettings.reminders || [];
          const existingItemIndex = existingReminders.findIndex((i: any) => i.id === item.id);
          let updatedReminders;

          if (item.id === 0 || existingItemIndex === -1) {
            const newItemId = getNextId(key);
            updatedReminders = [...existingReminders, { ...item, id: newItemId }];
            setNextIdForCollection(key, newItemId + 1);
          } else {
            updatedReminders = existingReminders.map((i: any) => i.id === item.id ? item : i);
          }
          return { ...prevSettings, reminders: updatedReminders };
        });
        sonnerToast.success(t('success'), { description: `${t('detailsUpdated')}` });
        return;
      default:
        return;
    }

    if (key === 'warehouses' && item.type === 'Main') {
      const existingMainWarehouse = currentCollection.find((w: Warehouse) => w.type === 'Main' && w.id !== item.id);
      if (existingMainWarehouse) {
        showAlertModal(t('validationError'), t('onlyOneMainWarehouse'));
        return;
      }
    }

    if (key === 'utilizationOrders') {
      const newUtilizationOrder = item as UtilizationOrder;
      const oldUtilizationOrder = (currentCollection as UtilizationOrder[]).find(uo => uo.id === newUtilizationOrder.id);

      if (oldUtilizationOrder) {
        updateStockForUtilization(null, oldUtilizationOrder);
      }

      const productsCopy: Product[] = JSON.parse(JSON.stringify(products));
      for (const utilItem of newUtilizationOrder.items) {
        const product = productsCopy.find(p => p.id === utilItem.productId);
        if (!product || !product.stock) {
          showAlertModal('Error', `Product data missing for item ID ${utilItem.productId}`);
          if (oldUtilizationOrder) updateStockForUtilization(oldUtilizationOrder, null);
          return;
        }
        const stockInWarehouse = product.stock[newUtilizationOrder.warehouseId] || 0;
        if (stockInWarehouse < utilItem.quantity) {
          const originalProduct = products.find(prod => prod.id === utilItem.productId);
          const safeProductName = originalProduct?.name || 'Unknown Product';
          showAlertModal('Stock Error', `${t('notEnoughStock')} ${safeProductName}. ${t('available')}: ${stockInWarehouse}, ${t('requested')}: ${utilItem.quantity}.`);
          if (oldUtilizationOrder) updateStockForUtilization(oldUtilizationOrder, null);
          return;
        }
        product.stock[newUtilizationOrder.warehouseId] = stockInWarehouse - utilItem.quantity;
      }
      updateStockForUtilization(newUtilizationOrder, oldUtilizationOrder);
    }

    // Handle ProductMovement stock updates here
    if (key === 'productMovements') {
      const newMovement = item as ProductMovement;
      const oldMovement = (currentCollection as ProductMovement[]).find(m => m.id === newMovement.id);

      // This logic is now handled by updateStockForProductMovement directly
      // The saveItem function should just call the setter and then the stock update function.
      // The stock validation should happen before calling saveItem.
      // For now, I'm removing the direct stock manipulation here and relying on the `updateStockForProductMovement`
      // which is called after the item is saved.
    }


    (setter as React.Dispatch<React.SetStateAction<any[]>>)(prevItems => {
      const existingItemIndex = prevItems.findIndex(i => i.id === item.id);
      let updatedItems;

      if (existingItemIndex === -1) {
        if (key === 'productMovements' && typeof item.id === 'number' && item.id > 0) {
          // Preserve provided movement ID to maintain linkage with sell order
          updatedItems = [...prevItems, item];
          const currentNext = getNextId(key);
          const nextCandidate = item.id + 1;
          if (nextCandidate > currentNext) setNextIdForCollection(key, nextCandidate);
        } else {
          const newItemId = getNextId(key);
          updatedItems = [...prevItems, { ...item, id: newItemId }];
          setNextIdForCollection(key, newItemId + 1);
        }
      } else {
        updatedItems = prevItems.map(i => i.id === item.id ? item : i);
      }
      
      // After updating the collection, apply stock changes for product movements
      if (key === 'productMovements') {
        const oldMovement = (currentCollection as ProductMovement[]).find(m => m.id === item.id);
        updateStockForProductMovement(item as ProductMovement, oldMovement || null);
      }

      return updatedItems;
    });
    sonnerToast.success(t('success'), { description: `${t('detailsUpdated')}` });
  }, [
    setProducts, setSuppliers, setCustomers, setWarehouses, setPurchaseOrders, setSellOrders,
    setIncomingPayments, setOutgoingPayments, setProductMovements, setUtilizationOrders, setPackingUnits, setSettings, setBankAccounts,
    getNextId, setNextIdForCollection, showAlertModal, updateStockForUtilization, updateStockForProductMovement,
    products, suppliers, customers, warehouses, purchaseOrders, sellOrders, incomingPayments, outgoingPayments, productMovements, utilizationOrders, packingUnits, settings, bankAccounts,
  ]);

  const deleteItem = useCallback((key: CollectionKey, id: number) => {
    let setter: React.Dispatch<React.SetStateAction<any[]>> | React.Dispatch<React.SetStateAction<Settings>>;
    let currentCollection: any[] = [];

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
      case 'utilizationOrders': setter = setUtilizationOrders; currentCollection = utilizationOrders; break;
      case 'packingUnits': setter = setPackingUnits; currentCollection = packingUnits; break;
      case 'bankAccounts': setter = setBankAccounts; currentCollection = bankAccounts; break;
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
        sonnerToast.success(t('success'), { description: t('itemMovedToRecycleBin') });
        return;
      case 'quickButtons':
        const buttonToDelete = (settings.quickButtons || []).find((b: QuickButton) => b.id === id);
        if (!buttonToDelete) {
          showAlertModal(t('error'), t('itemNotFound'));
          return;
        }
        addToRecycleBin(buttonToDelete, key);
        setSettings((prevSettings: Settings) => ({
          ...prevSettings,
          quickButtons: (prevSettings.quickButtons || []).filter((b: QuickButton) => b.id !== id),
        }));
        sonnerToast.success(t('success'), { description: t('itemMovedToRecycleBin') });
        return;
      case 'reminders':
        const reminderToDelete = (settings.reminders || []).find((r: Reminder) => r.id === id);
        if (!reminderToDelete) {
          showAlertModal(t('error'), t('itemNotFound'));
          return;
        }
        addToRecycleBin(reminderToDelete, key);
        setSettings((prevSettings: Settings) => ({
          ...prevSettings,
          reminders: (prevSettings.reminders || []).filter((r: Reminder) => r.id !== id),
        }));
        sonnerToast.success(t('success'), { description: t('itemMovedToRecycleBin') });
        return;
      default: return;
    }

    const itemToDelete = currentCollection.find(i => i.id === id);
    if (!itemToDelete) {
      showAlertModal(t('error'), t('itemNotFound'));
      return;
    }

    if (key === 'products') {
      const hasOrders = sellOrders.some(o => o.items?.some(i => i.productId === id)) || purchaseOrders.some(o => o.items?.some(i => i.productId === id));
      if (hasOrders) { showAlertModal(t('deletionFailed'), t('cannotDeleteProductInOrders')); return; }

      const hasMovements = productMovements.some(m => m.items?.some(i => i.productId === id));
      if (hasMovements) { showAlertModal(t('deletionFailed'), t('cannotDeleteProductInMovements')); return; }

      const hasUtilizationOrders = utilizationOrders.some(uo => uo.items?.some(i => i.productId === id));
      if (hasUtilizationOrders) { showAlertModal(t('deletionFailed'), t('cannotDeleteProductInUtilizationOrders')); return; }

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
                         productMovements.some(m => m.sourceWarehouseId === id || m.destWarehouseId === id) ||
                         utilizationOrders.some(uo => uo.warehouseId === id);
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
    if (key === 'bankAccounts') {
      const hasIncomingPayments = incomingPayments.some(p => p.bankAccountId === id);
      const hasOutgoingPayments = outgoingPayments.some(p => p.bankAccountId === id);
      if (hasIncomingPayments || hasOutgoingPayments) {
        showAlertModal(t('deletionFailed'), t('cannotDeleteBankAccountWithPayments'));
        return;
      }
    }

    if (key === 'sellOrders') {
      const sellOrderToDelete = itemToDelete as SellOrder;
      let associatedItemsMessage = '';

      if (sellOrderToDelete.productMovementId) {
        const movement = productMovements.find(pm => pm.id === sellOrderToDelete.productMovementId);
        if (movement) {
          associatedItemsMessage += `\n- ${t('productMovement')} #${movement.id}`;
        }
      }
      if (sellOrderToDelete.incomingPaymentId) {
        const payment = incomingPayments.find(ip => ip.id === sellOrderToDelete.incomingPaymentId);
        if (payment) {
          associatedItemsMessage += `\n- ${t('incomingPayment')} #${payment.id}`;
        }
      }

      const confirmMessage = associatedItemsMessage
        ? `${t('deleteSellOrderWarning')} ${t('alsoDeleteAssociatedItems')}: ${associatedItemsMessage}`
        : t('deleteSellOrderWarning');

      showConfirmationModal(
        t('deleteSellOrder'),
        confirmMessage,
        () => {
          if (sellOrderToDelete.productMovementId) {
            deleteItem('productMovements', sellOrderToDelete.productMovementId); // This will now trigger the logic above
          }
          if (sellOrderToDelete.incomingPaymentId) {
            deleteItem('incomingPayments', sellOrderToDelete.incomingPaymentId);
          }

          const orderToDelete = itemToDelete as SellOrder;
          if (orderToDelete) updateStockFromOrder(null, orderToDelete);

          addToRecycleBin(itemToDelete, key);
          (setter as React.Dispatch<React.SetStateAction<any[]>>)(prevItems => prevItems.filter(i => i.id !== id));
          sonnerToast.success(t('success'), { description: t('itemMovedToRecycleBin') });
        },
        t('delete')
      );
      return;
    }

    if (key === 'purchaseOrders') {
      const orderToDelete = itemToDelete as PurchaseOrder | SellOrder;
      if (orderToDelete) updateStockFromOrder(null, orderToDelete);
    } else if (key === 'productMovements') {
      const movementToDelete = itemToDelete as ProductMovement;
      if (movementToDelete) {
        // Find the linked SellOrder and update its status if it was 'Shipped'
        setSellOrders(prevSellOrders => prevSellOrders.map(so => {
          if (so.productMovementId === movementToDelete.id) {
            return {
              ...so,
              productMovementId: undefined,
              status: so.status === 'Shipped' ? 'Confirmed' : so.status, // Revert status from Shipped to Confirmed
            };
          }
          return so;
        }));
        updateStockForProductMovement(null, movementToDelete); // Reverse stock changes
      }
    } else if (key === 'utilizationOrders') {
      const utilizationOrderToDelete = itemToDelete as UtilizationOrder;
      if (utilizationOrderToDelete) {
        updateStockForUtilization(null, utilizationOrderToDelete);
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

    addToRecycleBin(itemToDelete, key);
    (setter as React.Dispatch<React.SetStateAction<any[]>>)(prevItems => prevItems.filter(i => i.id !== id));
    sonnerToast.success(t('success'), { description: t('itemMovedToRecycleBin') });
  }, [
    setProducts, setSuppliers, setCustomers, setWarehouses, setPurchaseOrders, setSellOrders,
    setIncomingPayments, setOutgoingPayments, setProductMovements, setUtilizationOrders, setPackingUnits, setSettings, setBankAccounts,
    showAlertModal, showConfirmationModal, updateStockFromOrder, updateStockForUtilization, addToRecycleBin, updateStockForProductMovement,
    products, suppliers, customers, warehouses, purchaseOrders, sellOrders, incomingPayments, outgoingPayments, productMovements, utilizationOrders, packingUnits, settings, bankAccounts,
  ]);

  return {
    getNextId,
    setNextIdForCollection,
    saveItem,
    deleteItem,
  };
}