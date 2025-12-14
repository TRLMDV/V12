"use client";

import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings as SettingsIcon } from 'lucide-react';
import ImageBlock from './ImageBlock';

const SettingsHelp: React.FC = () => {
  return (
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
  );
};

export default SettingsHelp;