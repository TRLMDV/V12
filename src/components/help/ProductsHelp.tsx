"use client";

import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Box } from 'lucide-react';
import ImageBlock from './ImageBlock';

const ProductsHelp: React.FC = () => {
  return (
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
                <ImageBlock alt="Add product form with fields and save button" src="/help/products/add-product.png" />
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
                <ImageBlock alt="Product list and edit actions" src="/help/products/edit-product.png" />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default ProductsHelp;