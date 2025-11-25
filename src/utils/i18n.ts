import { useState, useEffect } from 'react';

const i18n = {
  en: {
    backupRestore: 'Backup & Restore', backupData: 'Backup Data', restoreData: 'Restore Data', restoreWarning: 'This will overwrite all current data. Are you sure you want to proceed?', restoreSuccess: 'Data restored successfully. The application will now reload.', restoreError: 'Invalid backup file.',
    theme: 'Theme', light: 'Light', dark: 'Dark', companyDetails: 'Company Details', companyName: 'Company Name', companyLogo: 'Company Logo', changeLogo: 'Change File', saveCompanyDetails: 'Save Company Details', success: 'Success', detailsUpdated: 'Company details updated.',
    dashboard: 'Dashboard', products: 'Products', purchaseOrders: 'Purchase Orders', sellOrders: 'Sell Orders', suppliers: 'Suppliers', customers: 'Customers', incomingPayments: 'Incoming Payments', outgoingPayments: 'Outgoing Payments', warehouses: 'Warehouses', productMovement: 'Product Movement', utilization: 'Utilization', finance: 'Finance', profitability: 'Profitability', dataImportExport: 'Data Import/Export', totalRevenueShipped: 'Total Revenue (Shipped)', cogs: 'Cost of Goods Sold (COGS)', grossProfitShipped: 'Gross Profit (Shipped)', liveCurrencyRates: 'Live Currency Rates (to {mainCurrency})', overduePaymentAlerts: 'Overdue Payment Alerts', orderId: 'Order ID', customer: 'Customer', orderDate: 'Order Date', daysOverdue: 'Days Overdue', amountDue: 'Amount Due', noOverduePayments: 'No overdue payments. All accounts are settled!', lowStockAlerts: 'Low Stock Alerts', product: 'Product', sku: 'SKU', totalStock: 'Total Stock', minStock: 'Min. Stock', noLowStockProducts: 'No products are low on stock. Great job!', addProduct: 'Add Product', image: 'Image', name: 'Name', category: 'Category', avgLandedCost: 'Avg. Landed Cost',
    edit: 'Edit', delete: 'Delete', noItemsFound: 'No items found.', editProduct: 'Edit Product', createProduct: 'Create Product', productName: 'Product Name', productImage: 'Product Image', chooseFile: 'Choose File', minimumStockLevel: 'Minimum Stock Level', saveProduct: 'Save Product', editSellOrder: 'Edit Sell Order', createSellOrder: 'Create Sell Order', editPurchaseOrder: 'Edit Purchase Order', 'createPurchaseOrder': 'Create PurchaseOrder', supplier: 'Supplier', sourceWarehouse: 'Source Warehouse', destinationWarehouse: 'Destination Warehouse', status: 'Status', draft: 'Draft', confirmed: 'Confirmed', ordered: 'Ordered', 'shipped': 'Shipped', received: 'Received', orderItems: 'Order Items', selectProduct: 'Select Product', qty: 'Qty', price: 'Price', addItem: 'Add Item', exchangeRateToAZN: 'Exchange Rate to AZN', exchangeRatePlaceholder: 'e.g., 2.00 for EUR', exchangeRateHelpText: 'Enter the value of 1 unit of the foreign currency in AZN.', fees: 'Fees', vatPercent: 'VAT (%)', total: 'Total', saveOrder: 'Save Order', stockError: 'Stock Error', notEnoughStock: 'Not enough stock for', available: 'Available', 'requested': 'Requested', language: 'Language', addWarehouse: 'Add Warehouse', productsInThisWarehouse: 'Products in This Warehouse', noProductsStored: 'No products currently stored here.', addPO: 'Add PO', addSO: 'Add SO', filterByWarehouse: 'Filter by Warehouse:', allWarehouses: 'All Warehouses', noOrdersForWarehouse: 'No orders found for this warehouse.', orderStatus: 'Order Status', paymentStatus: 'Payment Status', paid: 'Paid', partiallyPaid: 'Partially Paid', unpaid: 'Unpaid', addPayment: 'Add Payment', paymentId: 'Payment ID', linkedOrder: 'Linked Order', amount: 'Amount', method: 'Method', newMovement: 'New Movement', from: 'From', to: 'To', totalItems: 'Total Items', view: 'View', detailsForMovement: 'Details for Movement', financeTitle: 'Finance - Profit & Loss', period: 'Period:', allTime: 'All Time', thisYear: 'This Year', thisMonth: 'This Month', 'thisWeek': 'This Week', today: 'This Day', keyMetrics: 'Key Metrics', totalRevenue: 'Total Revenue', grossProfit: 'Gross Profit', totalVatCollected: 'Total VAT Collected', cashFlow: 'Cash Flow', totalIncomingPayments: 'Total Incoming Payments', totalOutgoingPayments: 'Total Outgoing Payments', netCashFlow: 'Net Cash Flow', profitabilityAnalysis: 'Profitability Analysis', startDate: 'Start Date', 'endDate': 'End Date', filter: 'Filter', salesPercentage: 'Sales Percentage (by Qty)', daysInStock: 'Days in Stock', totalSales: 'Total Sales (Markup-Based)', cleanProfit: 'Clean Profit (Markup-Based)',
    currencyRatesSettings: 'Currency Rates (to {mainCurrency})', toCurrency: 'to {targetCurrency}', saveCurrencyRates: 'Save Currency Rates', ratesUpdated: 'Currency rates updated.', invalidRates: 'Please enter valid numbers for currency rates.',
    productsSubtotal: 'Products Subtotal',
    qtySold: 'Qty Sold',
    manualExpense: 'Manual Expense / Unlinked Payment',
    landedCostPlusMarkup: 'Avg LC + Markup (Excl VAT)',
    landedCostPlusMarkupPlusVat: 'Avg LC + Markup + VAT (Incl VAT)',
    totals: 'Totals',
    orderSummary: 'Order Summary',
    orderFees: 'Order Fees',
    feeType: 'Fee Type',
    order: 'Order',
    exportedSuccessfully: 'exported successfully',
    exportError: 'Export Error',
    selectCategory: 'Select Category',
    filterByCategory: 'Filter by Category',
    allCategories: 'All Categories',
    // New Bank page translations
    bank: 'Bank',
    bankAccount: 'Bank Account',
    setInitialCapital: 'Set Initial Capital',
    initialCapital: 'Initial Capital',
    currentBalance: 'Current Balance',
    transactionHistory: 'Transaction History',
    date: 'Date',
    description: 'Description',
    incoming: 'Incoming',
    outgoing: 'Outgoing',
    balance: 'Balance',
    noTransactionsFound: 'No transactions found for the selected period.',
    bankAccounts: 'Bank Accounts',
    yourBankAccounts: 'Your Bank Accounts',
    addBankAccount: 'Add Bank Account',
    editBankAccount: 'Edit Bank Account',
    deleteBankAccount: 'Delete Bank Account',
    bankAccountName: 'Account Name',
    selectCurrency: 'Select Currency',
    saveBankAccount: 'Save Bank Account',
    noBankAccountsFound: 'No bank accounts found. Add one to start tracking your finances!',
    bankAccountNameRequired: 'Bank account name is required.',
    bankAccountCurrencyRequired: 'Bank account currency is required.',
    invalidInitialBalance: 'Initial balance must be a valid number.',
    deleteBankAccountWarning: 'Are you sure you want to delete the bank account "{accountName}"? This action cannot be undone.',
    cannotDeleteBankAccountWithPayments: 'Cannot delete bank account because it has associated payments. Please delete all payments linked to this account first.',
    selectBankAccount: 'Select Bank Account',
    noBankAccountsAvailable: 'No bank accounts available. Please create one first.',
    depositMoney: 'Deposit Money',
    withdrawMoney: 'Withdraw Money',
    withdrawal: 'Withdrawal',
    pleaseAddBankAccountInstruction: 'To view transactions, please add a bank account first using the "Add Bank Account" button.',
    bankAccountBalance: 'Bank Account Balance',
    creationDate: 'Creation Date', // New: Creation Date label
    bankAccountCreationDateRequired: 'Bank account creation date is required.', // New: Validation message
    // New Utilization Order translations
    utilizationOrders: 'Utilization Orders',
    addUtilizationOrder: 'Add Utilization Order',
    editUtilizationOrder: 'Edit Utilization Order',
    saveUtilizationOrder: 'Save Utilization Order',
    detailsForUtilizationOrder: 'Details for Utilization Order',
    noUtilizationOrdersFound: 'No utilization orders found.',
    utilizationOrder: 'Utilization Order',
    items: 'Items',
    cannotDeleteProductInUtilizationOrders: 'Cannot delete product because it is part of one or more utilization orders.',
    utilizationOrdersImportExportDescription: 'Import new utilization orders (items must be added manually) or export your existing utilization order records.',
    importUtilizationOrdersDescription: 'Import Utilization Orders',
    comment: 'Comment', // New: Comment label
    orderCommentPlaceholder: 'e.g., Special delivery instructions, payment terms, internal notes', // New: Placeholder for order comment
    utilizationCommentPlaceholder: 'e.g., Damaged goods, expired products, internal use', // New: Placeholder for utilization comment
    noComment: 'No comment provided', // New: Display when no comment
    confirm: 'Confirm', // New translation
    // Quick Buttons
    quickButtons: 'Quick Buttons',
    addQuickButton: 'Add Quick Button',
    editQuickButton: 'Edit Quick Button',
    deleteQuickButton: 'Delete Quick Button',
    buttonLabel: 'Button Label',
    buttonAction: 'Button Action',
    buttonSize: 'Button Size',
    buttonColor: 'Button Color',
    saveQuickButton: 'Save Quick Button',
    noQuickButtonsFound: 'No quick buttons configured. Add some to speed up your workflow!',
    quickButtonAdded: 'Quick button added successfully.',
    quickButtonUpdated: 'Quick button updated successfully.',
    quickButtonDeleted: 'Quick button deleted successfully.',
    deleteQuickButtonWarning: 'Are you sure you want to delete this quick button? This action cannot be undone.',
    selectButtonAction: 'Select Action',
    selectButtonSize: 'Select Size',
    selectButtonColor: 'Select Color',
    quickPurchaseOrderAdd: 'Quick Purchase Order Add',
    quickSellOrderAdd: 'Quick Sell Order Add',
    quickProductMovement: 'Quick Product Movement',
    quickProductAdd: 'Quick Product Add',
    quickSupplierAdd: 'Quick Supplier Add',
    quickCustomerAdd: 'Quick Customer Add',
    quickIncomingPaymentsAdd: 'Quick Incoming Payment Add',
    quickOutgoingPaymentsAdd: 'Quick Outgoing Payment Add',
    quickWarehouseAdd: 'Quick Warehouse Add',
    quickUtilization: 'Quick Utilization Order Add',
    quickBankDeposit: 'Quick Bank Deposit',
    quickBankWithdrawal: 'Quick Bank Withdrawal',
    sizeSm: 'Small',
    sizeMd: 'Medium',
    sizeLg: 'Large',
    colorBlue: 'Blue',
    colorGreen: 'Green',
    colorRed: 'Red',
    colorPurple: 'Purple',
    colorOrange: 'Orange',
    colorYellow: 'Yellow',
    colorEmerald: 'Emerald',
    colorIndigo: 'Indigo',
    colorPink: 'Pink',
    colorTeal: 'Teal',
    yes: 'Yes', // Added 'Yes'
    no: 'No', // Added 'No'
    selectWarehouseToSeeStock: 'Select warehouse to see stock', // New translation key
    deleteSellOrder: 'Delete Sell Order', // New translation key
    deleteSellOrderWarning: 'Are you sure you want to delete this Sell Order?', // New translation key
    alsoDeleteAssociatedItems: 'This will also move the following associated items to the Recycle Bin', // New translation key
    selectAll: 'Select All', // New translation key
    deselectAll: 'Deselect All', // New translation key
    allCurrenciesSelected: 'All active currencies selected.', // New translation key
    allCurrenciesDeselected: 'All active currencies deselected (except main currency).', // New translation key
    exportTransactionsToExcel: 'Export Transactions to Excel', // New translation key
    feesExchangeRateToAZN: 'Fees Exchange Rate to AZN', // New translation key
    // New sales chart translations
    salesChart: 'Sales Chart',
    showSalesChartOnDashboard: 'Show Sales Chart on Dashboard',
    yearlySales: 'Yearly Sales',
    monthlySales: 'Monthly Sales',
    selectYear: 'Select Year',
    selectMonth: 'Select Month',
    totalSalesValue: 'Total Sales Value',
    noSalesData: 'No sales data available for the selected period.',
    salesOverview: 'Sales Overview',
    salesByMonth: 'Sales by Month',
    salesByDay: 'Sales by Day',
    previous: 'Previous',
    next: 'Next',
    jan: 'Jan', feb: 'Feb', mar: 'Mar', apr: 'Apr', may: 'May', jun: 'Jun', jul: 'Jul', aug: 'Aug', sep: 'Sep', oct: 'Oct', nov: 'Nov', dec: 'Dec',
    day: 'Day',
    singlePeriod: 'Single Period', // New translation key
    allPeriods: 'All Periods', // New translation key
    // New translations for ProductTransactionsModal
    productTransactions: 'Product Transactions',
    productTransactionsDescription: 'List of all purchase and sales orders containing this product.',
    purchaseOrdersWithProduct: 'Purchase Orders with Product',
    purchaseOrdersWithProductDescription: 'List of purchase orders containing this product.',
    priceInOrderCurrency: 'Price (Order Currency)',
    currencyRateToMainCurrency: 'Rate (1 {orderCurrency} to {mainCurrency})',
    noPurchaseOrdersFoundForProduct: 'No purchase orders found for this product.',
    salesOrdersWithProduct: 'Sales Orders with Product', // New
    saleDate: 'Sale Date', // New
    priceExclVat: 'Price (Excl. VAT)', // New
    priceInclVat: 'Price (Incl. VAT)', // New
    noSalesOrdersFoundForProduct: 'No sales orders found for this product.', // New
    landedCostPerUnit: 'Landed Cost Per Unit', // New translation key
  }
};

// Language is fixed to English for now
const currentLang = 'en';

export function t(key: keyof typeof i18n.en | string, replacements?: { [key: string]: string | number }): string {
  let text = (i18n.en as Record<string, string>)[key] || key; // Cast to Record<string, string> for dynamic access
  if (replacements) {
    for (const placeholder in replacements) {
      text = text.replace(`{${placeholder}}`, String(replacements[placeholder]));
    }
  }
  return text;
}

export function getKeyAsPageId(key: string): string {
  // from camelCase to kebab-case, e.g., purchaseOrders -> purchase-orders
  return key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}
```
<dyad-write path="src/forms/ProductMovementForm.tsx" description="Fixed useMemo import and Input onChange handler.">
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { MOCK_CURRENT_DATE } from '@/data/initialData'; // Corrected import
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/utils/i18n';
import { ProductMovement, Product, Warehouse } from '@/types'; // Import types from types file

interface ProductMovementFormProps {
  movementId?: number;
  onSuccess: () => void;
}

interface MovementItemState {
  productId: number | '';
  quantity: number;
}

const ProductMovementForm: React.FC<ProductMovementFormProps> = ({ movementId, onSuccess }) => {
  const { productMovements, products, warehouses, saveItem, showAlertModal, setProducts } = useData();
  const isEdit = movementId !== undefined;

  const [sourceWarehouseId, setSourceWarehouseId] = useState<number | ''>('');
  const [destWarehouseId, setDestWarehouseId] = useState<number | ''>('');
  const [movementItems, setMovementItems] = useState<MovementItemState[]>([{ productId: '', quantity: 1 }]);
  const [openComboboxIndex, setOpenComboboxIndex] = useState<number | null>(null); // State for which product combobox is open
  const [searchQuery, setSearchQuery] = useState(''); // New state for product search input

  useEffect(() => {
    if (isEdit) {
      const existingMovement = productMovements.find(m => m.id === movementId);
      if (existingMovement) {
        setSourceWarehouseId(existingMovement.sourceWarehouseId);
        setDestWarehouseId(existingMovement.destWarehouseId);
        setMovementItems(existingMovement.items.map(item => ({ productId: item.productId, quantity: item.quantity })));
      }
    } else {
      setSourceWarehouseId('');
      setDestWarehouseId('');
      setMovementItems([{ productId: '', quantity: 1 }]);
    }
  }, [movementId, isEdit, productMovements]);

  const addMovementItem = useCallback(() => {
    setMovementItems(prev => [...prev, { productId: '', quantity: 1 }]);
  }, []);

  const removeMovementItem = useCallback((index: number) => {
    setMovementItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleItemChange = useCallback((index: number, field: keyof MovementItemState, value: any) => {
    setMovementItems(prev =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }, []);

  const filteredProducts = useMemo(() => {
    const trimmedSearchQuery = searchQuery.trim().toLowerCase();
    if (trimmedSearchQuery === '') {
      return products;
    }
    return products.filter(product => {
      const productName = String(product.name).trim().toLowerCase();
      const productSku = String(product.sku).trim().toLowerCase();
      return productName.startsWith(trimmedSearchQuery) || productSku.startsWith(trimmedSearchQuery);
    });
  }, [products, searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (sourceWarehouseId === '' || destWarehouseId === '') {
      showAlertModal('Validation Error', 'Please select both source and destination warehouses.');
      return;
    }
    if (sourceWarehouseId === destWarehouseId) {
      showAlertModal('Validation Error', 'Source and Destination warehouses cannot be the same.');
      return;
    }

    const newItems = movementItems.filter(item => item.productId !== '' && item.quantity > 0);
    if (newItems.length === 0) {
      showAlertModal('Validation Error', 'Please ensure all items have a selected product and a quantity greater than zero.');
      return;
    }

    // Deep copy products for validation and potential update
    const productsCopy: Product[] = JSON.parse(JSON.stringify(products));
    const currentMovement = isEdit ? productMovements.find(m => m.id === movementId) : null;

    // --- Revert stock change if editing an existing movement ---
    if (isEdit && currentMovement) {
      currentMovement.items.forEach(item => {
        const p = productsCopy.find(p => p.id === item.productId);
        if (p && p.stock) {
          p.stock[currentMovement.sourceWarehouseId] = (p.stock[currentMovement.sourceWarehouseId] || 0) + item.quantity;
          p.stock[currentMovement.destWarehouseId] = (p.stock[currentMovement.destWarehouseId] || 0) - item.quantity;
        }
      });
    }

    // --- Check stock and apply new movement (dry run) ---
    for (const item of newItems) {
      const p = productsCopy.find(p => p.id === item.productId);
      if (!p || !p.stock) {
        showAlertModal('Error', `Product data missing for item ID ${item.productId}`);
        return;
      }

      const stockInSource = p.stock[sourceWarehouseId as number] || 0;
      if (stockInSource < item.quantity) {
        const originalProduct = products.find(prod => prod.id === item.productId);
        const safeProductName = originalProduct?.name || 'Unknown Product';
        showAlertModal('Stock Error', `${t('notEnoughStock')} ${safeProductName}. ${t('available')}: ${stockInSource}, ${t('requested')}: ${item.quantity}.`);
        return;
      }
      // Apply tentative stock changes for subsequent checks in the same form submission
      p.stock[sourceWarehouseId as number] = stockInSource - item.quantity;
      p.stock[destWarehouseId as number] = (p.stock[destWarehouseId as number] || 0) + item.quantity;
    }

    // If all checks pass, update the actual products state
    setProducts(productsCopy);

    const movementToSave: ProductMovement = {
      id: movementId || 0,
      sourceWarehouseId: sourceWarehouseId as number,
      destWarehouseId: destWarehouseId as number,
      items: newItems.map(item => ({ productId: item.productId as number, quantity: item.quantity })),
      date: MOCK_CURRENT_DATE.toISOString().slice(0, 10),
    };

    saveItem('productMovements', movementToSave);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="sourceWarehouseId" className="text-right">
            {t('fromWarehouse')}
          </Label>
          <Select onValueChange={(value) => setSourceWarehouseId(parseInt(value))} value={String(sourceWarehouseId)}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder={t('sourceWarehouse')} />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map(w => (
                <SelectItem key={w.id} value={String(w.id)}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="destWarehouseId" className="text-right">
            {t('toWarehouse')}
          </Label>
          <Select onValueChange={(value) => setDestWarehouseId(parseInt(value))} value={String(destWarehouseId)}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder={t('destinationWarehouse')} />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map(w => (
                <SelectItem key={w.id} value={String(w.id)}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <h4 className="font-semibold mt-4 mb-2 text-gray-700 dark:text-slate-200">{t('productsToMove')}</h4>
        <div id="movement-items">
          {movementItems.map((item, index) => (
            <div key={index} className="grid grid-cols-10 gap-2 mb-2 items-center">
              <Popover open={openComboboxIndex === index} onOpenChange={(open) => {
                setOpenComboboxIndex(open ? index : null);
                if (!open) {
                  setSearchQuery(''); // Clear search query when popover closes
                }
              }}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openComboboxIndex === index}
                    className="col-span-6 justify-between"
                  >
                    {item.productId
                      ? products.find(p => p.id === item.productId)?.name || t('selectProduct')
                      : t('selectProduct')}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command shouldFilter={false}>
                    <div className="p-1">
                      <Input
                        placeholder={t('searchProductBySku')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <CommandEmpty>{t('noProductFound')}</CommandEmpty>
                    <CommandGroup key={searchQuery}>
                      {filteredProducts.map((product) => (
                        <CommandItem
                          key={product.id}
                          value={`${product.name} ${product.sku}`} // Searchable value
                          onSelect={() => {
                            handleItemChange(index, 'productId', product.id);
                            setOpenComboboxIndex(null);
                            setSearchQuery(''); // Clear search query after selection
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              item.productId === product.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {product.name} ({product.sku})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                className="col-span-3"
                min="1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeMovementItem(index)}
                className="col-span-1 text-red-500 hover:text-red-700"
              >
                &times;
              </Button>
            </div>
          ))}
        </div>
        <Button type="button" onClick={addMovementItem} variant="outline" className="mt-2">
          {t('addItem')}
        </Button>
      </div>
      <div className="flex justify-end mt-6 border-t pt-4 dark:border-slate-700">
        <Button type="submit">{t('saveMovement')}</Button>
      </div>
    </form>
  );
};

export default ProductMovementForm;