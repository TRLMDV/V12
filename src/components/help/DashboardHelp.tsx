"use client";

import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ImageBlock from './ImageBlock';

const DashboardHelp: React.FC = () => {
  return (
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
  );
};

export default DashboardHelp;