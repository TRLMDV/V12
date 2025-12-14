"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { t } from '@/utils/i18n';
import { PlusCircle, Box, Users, Warehouse as WarehouseIcon, ShoppingCart, DollarSign, ArrowLeftRight, MinusCircle, Banknote, BarChart, Settings as SettingsIcon, HelpCircle } from 'lucide-react';

const ImageBlock: React.FC<{ alt: string }> = ({ alt }) => (
  <div className="rounded-md border bg-muted/20 p-3">
    <svg
      viewBox="0 0 400 220"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-48 rounded-md"
      role="img"
      aria-label={alt}
    >
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#f8fafc" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="400" height="220" rx="8" fill="url(#g1)" />
      {/* Window header */}
      <rect x="16" y="16" width="368" height="24" rx="6" fill="#cbd5e1" />
      <circle cx="32" cy="28" r="5" fill="#ef4444" />
      <circle cx="50" cy="28" r="5" fill="#f59e0b" />
      <circle cx="68" cy="28" r="5" fill="#22c55e" />
      {/* Sidebar */}
      <rect x="16" y="48" width="72" height="156" rx="6" fill="#e5e7eb" />
      <rect x="24" y="60" width="56" height="14" rx="4" fill="#94a3b8" />
      <rect x="24" y="82" width="56" height="12" rx="4" fill="#cbd5e1" />
      <rect x="24" y="100" width="56" height="12" rx="4" fill="#cbd5e1" />
      <rect x="24" y="118" width="56" height="12" rx="4" fill="#cbd5e1" />
      {/* Content area */}
      <rect x="96" y="56" width="276" height="32" rx="6" fill="#e2e8f0" />
      <rect x="96" y="96" width="276" height="20" rx="4" fill="#cbd5e1" />
      <rect x="96" y="122" width="276" height="20" rx="4" fill="#cbd5e1" />
      <rect x="96" y="148" width="276" height="20" rx="4" fill="#cbd5e1" />
      {/* Accent callout box */}
      <rect x="96" y="174" width="180" height="20" rx="4" fill="#38bdf8" opacity="0.7" />
      {/* Caption */}
      <text x="200" y="210" textAnchor="middle" fontSize="12" fill="#475569">
        {alt}
      </text>
    </svg>
    <p className="text-xs text-muted-foreground mt-2">{alt}</p>
  </div>
);

const Help: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-sky-600" />
          <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-200">
            {t('help') || 'Help & Tutorials'}
          </h1>
        </div>
        <p className="text-muted-foreground mt-1">
          {t('learnToUseApp') || 'Learn how to use every part of the app with step-by-step guides and illustrations.'}
        </p>
      </div>

      <Tabs defaultValue="getting-started" className="w-full">
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="suppliers-customers">Suppliers & Customers</TabsTrigger>
          <TabsTrigger value="warehouses">Warehouses</TabsTrigger>
          <TabsTrigger value="orders">Purchase & Sell Orders</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="stock">Stock & Movements</TabsTrigger>
          <TabsTrigger value="bank">Bank</TabsTrigger>
          <TabsTrigger value="finance">Finance & Profitability</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="data">Import/Export & Recycle Bin</TabsTrigger>
        </TabsList>

        <TabsContent value="getting-started" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="gs-1">
                  <AccordionTrigger className="text-left">
                    1) Navigating the App
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="mb-2">
                          Use the left sidebar on desktop, or the menu button on mobile, to move between pages like Dashboard, Products, Orders, Bank, and Settings.
                        </p>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                          <li>Desktop: Sidebar with icons and page names.</li>
                          <li>Mobile: Tap the menu button to open navigation.</li>
                        </ul>
                      </div>
                      <ImageBlock alt="App navigation: sidebar on desktop and mobile menu" />
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="gs-2">
                  <AccordionTrigger className="text-left">
                    2) Quick Setup
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="mb-2">
                          Go to Settings to choose theme, VAT, markup, and currencies. You can add your company name and logo, but they are optional.
                        </p>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                          <li>Theme: light or dark.</li>
                          <li>Taxes and markups: set defaults for calculations.</li>
                          <li>Currencies: pick active and main currency.</li>
                        </ul>
                      </div>
                      <ImageBlock alt="Settings overview with theme, VAT, markup, currencies" />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Box className="h-5 w-5 text-sky-600" />
                <CardTitle>Products</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="p-1">
                  <AccordionTrigger>How to add a product</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <ol className="list-decimal pl-5 space-y-1 text-sm">
                          <li>Go to Products.</li>
                          <li>Click the Add button.</li>
                          <li>Fill in name, SKU, cost, min stock, and optional image.</li>
                          <li>Save to create the product.</li>
                        </ol>
                      </div>
                      <ImageBlock alt="Add product form with fields and save button" />
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="p-2">
                  <AccordionTrigger>Editing and managing stock</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm">
                          Edit products to update details. Stock updates come from purchase orders, sell orders, product movements, and utilization.
                        </p>
                      </div>
                      <ImageBlock alt="Product list and edit actions" />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers-customers" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-sky-600" />
                <CardTitle>Suppliers & Customers</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="sc-1">
                  <AccordionTrigger>Adding suppliers and customers</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm mb-2">
                          Use the Add button on Suppliers or Customers page to create contacts.
                        </p>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                          <li>Optional fields: email, phone, address.</li>
                          <li>Default currency/warehouse can be set for faster orders.</li>
                        </ul>
                      </div>
                      <ImageBlock alt="Supplier and customer forms" />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="warehouses" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <WarehouseIcon className="h-5 w-5 text-sky-600" />
                <CardTitle>Warehouses</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="w-1">
                  <AccordionTrigger>Adding a warehouse</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <ol className="list-decimal pl-5 text-sm space-y-1">
                          <li>Go to Warehouses and click Add.</li>
                          <li>Enter name, location, and type.</li>
                          <li>Save the warehouse.</li>
                        </ol>
                      </div>
                      <ImageBlock alt="Add warehouse form fields" />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-sky-600" />
                <CardTitle>Purchase & Sell Orders</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="o-1">
                  <AccordionTrigger>Create a purchase order</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <ol className="list-decimal pl-5 text-sm space-y-1">
                          <li>Go to Purchase Orders and click Add.</li>
                          <li>Select supplier and destination warehouse.</li>
                          <li>Add items with prices and currency.</li>
                          <li>Save. Receiving will update stock and costs.</li>
                        </ol>
                      </div>
                      <ImageBlock alt="Purchase order form with items" />
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="o-2">
                  <AccordionTrigger>Create a sell order</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <ol className="list-decimal pl-5 text-sm space-y-1">
                          <li>Go to Sell Orders and click Add.</li>
                          <li>Select customer and source warehouse.</li>
                          <li>Add items, VAT, and prices.</li>
                          <li>Confirm to decrease stock and track revenue.</li>
                        </ol>
                      </div>
                      <ImageBlock alt="Sell order form with items and VAT" />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-sky-600" />
                <CardTitle>Payments</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="pay-1">
                  <AccordionTrigger>Incoming and outgoing payments</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm">
                          Record payments in their respective pages. Link them to orders or enter manual descriptions and categories.
                        </p>
                      </div>
                      <ImageBlock alt="Payments list and add payment dialog" />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-sky-600" />
                <CardTitle>Stock & Movements</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="st-1">
                  <AccordionTrigger>Product movements</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm">
                          Move stock between warehouses with Product Movement; quantities adjust at source and destination.
                        </p>
                      </div>
                      <ImageBlock alt="Product movement form between warehouses" />
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="st-2">
                  <AccordionTrigger>Utilization</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm">
                          Create utilization orders to write off damaged or expired goods; stock is reduced in the selected warehouse.
                        </p>
                      </div>
                      <ImageBlock alt="Utilization order form" />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bank" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-sky-600" />
                <CardTitle>Bank</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="b-1">
                  <AccordionTrigger>Bank accounts and transactions</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <ol className="list-decimal pl-5 text-sm space-y-1">
                          <li>Go to Bank and add a bank account with currency.</li>
                          <li>Record deposits or withdrawals; balances update automatically.</li>
                          <li>Open transaction history for detailed view.</li>
                        </ol>
                      </div>
                      <ImageBlock alt="Bank accounts table and transaction modals" />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart className="h-5 w-5 text-sky-600" />
                <CardTitle>Finance & Profitability</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="f-1">
                  <AccordionTrigger>Finance overview</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm">
                          Review income and expenses, currency conversions, and totals in your main currency.
                        </p>
                      </div>
                      <ImageBlock alt="Finance page overview" />
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="f-2">
                  <AccordionTrigger>Profitability</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm">
                          Analyze profits using average landed costs from purchase orders and revenues from sell orders.
                        </p>
                      </div>
                      <ImageBlock alt="Profitability charts and tables" />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-sky-600" />
                <CardTitle>Settings</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="s-1">
                  <AccordionTrigger>Theme and Language</AccordionTrigger>
                  <AccordionContent>
                    <ImageBlock alt="Theme and language options" />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="s-2">
                  <AccordionTrigger>Currencies and Rates</AccordionTrigger>
                  <AccordionContent>
                    <ImageBlock alt="Main and active currencies, rates editor" />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="s-3">
                  <AccordionTrigger>Quick Buttons, Calendar & Clock</AccordionTrigger>
                  <AccordionContent>
                    <ImageBlock alt="Dashboard widgets and quick buttons settings" />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="s-4">
                  <AccordionTrigger>Packing Units and Payment Categories</AccordionTrigger>
                  <AccordionContent>
                    <ImageBlock alt="Manage packing units and payment categories" />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="d-1">
                  <AccordionTrigger>Widgets and quick actions</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm">
                          Customize your dashboard with currency rates, sales chart, clock, calendar, and quick buttons in Settings.
                        </p>
                      </div>
                      <ImageBlock alt="Dashboard with widgets and quick buttons" />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Import/Export & Recycle Bin</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="d-1">
                  <AccordionTrigger>Backup, restore and recycle bin</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm">
                          Use Data Import/Export to back up and restore. Deleted items go to the Recycle Bin, where you can restore or permanently delete.
                        </p>
                      </div>
                      <ImageBlock alt="JSON backup/restore and recycle bin" />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Help;