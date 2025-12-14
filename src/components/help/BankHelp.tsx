"use client";

import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Banknote } from 'lucide-react';
import ImageBlock from './ImageBlock';

const BankHelp: React.FC = () => {
  return (
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
                <ImageBlock alt="Bank accounts table and transaction modals" src="/help/bank/accounts.png" />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default BankHelp;