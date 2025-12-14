"use client";

import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import ImageBlock from './ImageBlock';

const SuppliersCustomersHelp: React.FC = () => {
  return (
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
  );
};

export default SuppliersCustomersHelp;