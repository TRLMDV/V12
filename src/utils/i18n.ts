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
    transactionId: 'Transaction ID', // New translation key
    // New calendar and reminder translations
    calendarAndReminders: 'Calendar & Reminders',
    addReminder: 'Add Reminder',
    editReminder: 'Edit Reminder',
    saveReminder: 'Save Reminder',
    deleteReminder: 'Delete Reminder',
    deleteReminderWarning: 'Are you sure you want to delete this reminder? This action cannot be undone.',
    noRemindersForSelectedDate: 'No reminders for the selected date.',
    selectADate: 'Select a date to view reminders.',
    message: 'Message',
    time: 'Time',
    pickADate: 'Pick a date',
    allFieldsRequired: 'All fields are required.',
    reminderAdded: 'Reminder added successfully.',
    reminderUpdated: 'Reminder updated successfully.',
    reminderDeleted: 'Reminder deleted successfully.',
    reminder: 'Reminder',
    dismiss: 'Dismiss',
    // New clock and calendar settings translations
    clockSettings: 'Clock Settings',
    showClockOnDashboard: 'Show Clock on Dashboard',
    calendarSettings: 'Calendar Settings',
    showCalendarOnDashboard: 'Show Calendar on Dashboard',
    enterTimeIn24HourFormat: 'Enter time in HH:mm (24-hour format)', // New translation key
    invalidTimeFormat: 'Invalid time format. Please use HH:mm (e.g., 14:30).', // New translation key
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