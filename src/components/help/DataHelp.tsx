"use client";

import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ImageBlock from './ImageBlock';

const DataHelp: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Import/Export & Recycle Bin</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible>
          <AccordionItem value="d-1">
            <AccordionTrigger>Backup, restore and recycle bin</AccordionTrigger>
            <AccordionContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm">
                    Use Data Import/Export to back up and restore. Deleted items go to the Recycle Bin, where you can restore or permanently delete.
                  </p>
                </div>
                <ImageBlock alt="JSON backup/restore and recycle bin" />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default DataHelp;