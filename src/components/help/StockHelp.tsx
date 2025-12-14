"use client";

import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeftRight, MinusCircle } from 'lucide-react';
import ImageBlock from './ImageBlock';

const StockHelp: React.FC = () => {
  return (
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
  );
};

export default StockHelp;