"use client";

import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
import ImageBlock from './ImageBlock';

const PaymentsHelp: React.FC = () => {
  return (
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
                <ImageBlock alt="Payments list and add payment dialog" src="/help/payments/list.png" />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default PaymentsHelp;