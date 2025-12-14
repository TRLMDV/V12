"use client";

import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react';
import ImageBlock from './ImageBlock';

const OrdersHelp: React.FC = () => {
  return (
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
  );
};

export default OrdersHelp;