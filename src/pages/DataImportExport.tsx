"use client";

import React, { useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { t } from '@/utils/i18n';

// Import new modular components
import JsonBackupRestore from '@/components/data-import-export/JsonBackupRestore';
import ProductsImportExport from '@/components/data-import-export/ProductsImportExport';
import CustomersImportExport from '@/components/data-import-export/CustomersImportExport';
import SuppliersImportExport from '@/components/data-import-export/SuppliersImportExport';
import PurchaseOrdersImportExport from '@/components/data-import-export/PurchaseOrdersImportExport';
import SellOrdersImportExport from '@/components/data-import-export/SellOrdersImportExport';
import IncomingPaymentsImportExport from '@/components/data-import-export/IncomingPaymentsImportExport';
import OutgoingPaymentsImportExport from '@/components/data-import-export/OutgoingPaymentsImportExport';
import ProductMovementsImportExport from '@/components/data-import-export/ProductMovementsImportExport';
import UtilizationImportExport from '@/components/data-import-export/UtilizationImportExport'; // New import
import RecycleBinSection from '@/components/data-import-export/RecycleBinSection';

import { Product, Customer, Supplier, Warehouse } from '@/types';

const DataImportExport: React.FC = () => {
  const {
    products, suppliers, customers, warehouses, purchaseOrders, sellOrders,
    incomingPayments, outgoingPayments, productMovements, utilizationOrders, settings, currencyRates, // Added utilizationOrders
    setProducts, setSuppliers, setCustomers, setWarehouses, setPurchaseOrders,
    setSellOrders, setIncomingPayments, setOutgoingPayments, setProductMovements, setUtilizationOrders, // Added setUtilizationOrders
    setSettings, setCurrencyRates,
    showConfirmationModal,
    getNextId,
    setNextIdForCollection,
    recycleBin,
    restoreFromRecycleBin,
    deletePermanentlyFromRecycleBin,
    cleanRecycleBin,
    getItemSummary,
    showAlertModal,
  } = useData();

  const supplierMap = useMemo(() => suppliers.reduce((acc, s) => ({ ...acc, [s.id]: s }), {} as { [key: number]: Supplier }), [suppliers]);
  const customerMap = useMemo(() => customers.reduce((acc, c) => ({ ...acc, [c.id]: c }), {} as { [key: number]: Customer }), [customers]);
  const warehouseMap = useMemo(() => warehouses.reduce((acc, w) => ({ ...acc, [w.id]: w }), {} as { [key: number]: Warehouse }), [warehouses]);
  const productMap = useMemo(() => products.reduce((acc, p) => ({ ...acc, [p.id]: p }), {} as { [key: number]: Product }), [products]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-200 mb-6">{t('dataImportExport')}</h1>

      <JsonBackupRestore
        products={products}
        suppliers={suppliers}
        customers={customers}
        warehouses={warehouses}
        purchaseOrders={purchaseOrders}
        sellOrders={sellOrders}
        incomingPayments={incomingPayments}
        outgoingPayments={outgoingPayments}
        productMovements={productMovements}
        utilizationOrders={utilizationOrders} // Added utilizationOrders
        settings={settings}
        currencyRates={currencyRates}
        setProducts={setProducts}
        setSuppliers={setSuppliers}
        setCustomers={setCustomers}
        setWarehouses={setWarehouses}
        setPurchaseOrders={setPurchaseOrders}
        setSellOrders={setSellOrders}
        setIncomingPayments={setIncomingPayments}
        setOutgoingPayments={setOutgoingPayments}
        setProductMovements={setProductMovements}
        setUtilizationOrders={setUtilizationOrders} // Added setUtilizationOrders
        setSettings={setSettings}
        setCurrencyRates={setCurrencyRates}
        showConfirmationModal={showConfirmationModal}
        t={t}
      />

      <ProductsImportExport
        products={products}
        setProducts={setProducts}
        getNextId={getNextId}
        setNextIdForCollection={setNextIdForCollection}
        t={t}
      />

      <CustomersImportExport
        customers={customers}
        setCustomers={setCustomers}
        getNextId={getNextId}
        setNextIdForCollection={setNextIdForCollection}
        t={t}
      />

      <SuppliersImportExport
        suppliers={suppliers}
        setSuppliers={setSuppliers}
        getNextId={getNextId}
        setNextIdForCollection={setNextIdForCollection}
        t={t}
      />

      <PurchaseOrdersImportExport
        purchaseOrders={purchaseOrders}
        setPurchaseOrders={setPurchaseOrders}
        suppliers={suppliers}
        warehouses={warehouses}
        productMap={productMap}
        supplierMap={supplierMap}
        warehouseMap={warehouseMap}
        currencyRates={currencyRates}
        getNextId={getNextId}
        setNextIdForCollection={setNextIdForCollection}
        showAlertModal={showAlertModal}
        t={t}
      />

      <SellOrdersImportExport
        sellOrders={sellOrders}
        setSellOrders={setSellOrders}
        customers={customers}
        warehouses={warehouses}
        productMap={productMap}
        customerMap={customerMap}
        warehouseMap={warehouseMap}
        settings={settings}
        getNextId={getNextId}
        setNextIdForCollection={setNextIdForCollection}
        showAlertModal={showAlertModal}
        t={t}
      />

      <IncomingPaymentsImportExport
        incomingPayments={incomingPayments}
        setIncomingPayments={setIncomingPayments}
        sellOrders={sellOrders}
        customers={customerMap} // Pass customerMap for display
        currencyRates={currencyRates}
        getNextId={getNextId}
        setNextIdForCollection={setNextIdForCollection}
        showAlertModal={showAlertModal}
        t={t}
      />

      <OutgoingPaymentsImportExport
        outgoingPayments={outgoingPayments}
        setOutgoingPayments={setOutgoingPayments}
        purchaseOrders={purchaseOrders}
        suppliers={supplierMap} // Pass supplierMap for display
        currencyRates={currencyRates}
        getNextId={getNextId}
        setNextIdForCollection={setNextIdForCollection}
        showAlertModal={showAlertModal}
        t={t}
      />

      <ProductMovementsImportExport
        productMovements={productMovements}
        setProductMovements={setProductMovements}
        warehouses={warehouses}
        productMap={productMap}
        warehouseMap={warehouseMap}
        getNextId={getNextId}
        setNextIdForCollection={setNextIdForCollection}
        showAlertModal={showAlertModal}
        t={t}
      />

      <UtilizationImportExport
        utilizationOrders={utilizationOrders}
        setUtilizationOrders={setUtilizationOrders}
        warehouses={warehouses}
        productMap={productMap}
        warehouseMap={warehouseMap}
        getNextId={getNextId}
        setNextIdForCollection={setNextIdForCollection}
        showAlertModal={showAlertModal}
        t={t}
      />

      <RecycleBinSection
        recycleBin={recycleBin}
        restoreFromRecycleBin={restoreFromRecycleBin}
        deletePermanentlyFromRecycleBin={deletePermanentlyFromRecycleBin}
        cleanRecycleBin={cleanRecycleBin}
        getItemSummary={getItemSummary}
        t={t}
      />
    </div>
  );
};

export default DataImportExport;