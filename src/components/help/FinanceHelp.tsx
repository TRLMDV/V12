"use client";

import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart } from 'lucide-react';
import ImageBlock from './ImageBlock';

const FinanceHelp: React.FC = () => {
  return (
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
                <ImageBlock alt="Finance page overview" src="/help/finance/overview.png" />
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
                <ImageBlock alt="Profitability charts and tables" src="/help/finance/profitability.png" />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default FinanceHelp;