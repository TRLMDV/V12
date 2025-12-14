"use client";

import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Warehouse as WarehouseIcon } from 'lucide-react';
import ImageBlock from './ImageBlock';
import { t } from '@/utils/i18n';

const WarehousesHelp: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <WarehouseIcon className="h-5 w-5 text-sky-600" />
          <CardTitle>{t('help.warehouses.title')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible>
          <AccordionItem value="w-1">
            <AccordionTrigger>{t('help.warehouses.addTitle')}</AccordionTrigger>
            <AccordionContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <ol className="list-decimal pl-5 text-sm space-y-1">
                    <li>{t('help.warehouses.step1')}</li>
                    <li>{t('help.warehouses.step2')}</li>
                    <li>{t('help.warehouses.step3')}</li>
                  </ol>
                </div>
                <ImageBlock alt={t('help.warehouses.addImageAlt')} src="/help/warehouses/add-warehouse.png" />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default WarehousesHelp;