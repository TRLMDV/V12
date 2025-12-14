"use client";

import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ImageBlock from './ImageBlock';

const GettingStartedHelp: React.FC = () => {
  return (
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
  );
};

export default GettingStartedHelp;