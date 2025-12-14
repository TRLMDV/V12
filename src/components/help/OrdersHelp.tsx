"use client";

import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react';
import ImageBlock from './ImageBlock';
import { t } from '@/utils/i18n';

const OrdersHelp: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-sky-600" />
          <CardTitle>{t('help.orders.title')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible>
          <AccordionItem value="o-1">
            <AccordionTrigger>{t('help.orders.poTitle')}</AccordionTrigger>
            <AccordionContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <ol className="list-decimal pl-5 text-sm space-y-1">
                    <li>{t('help.orders.poStep1')}</li>
                    <li>{t('help.orders.poStep2')}</li>
                    <li>{t('help.orders.poStep3')}</li>
                    <li>{t('help.orders.poStep4')}</li>
                  </ol>
                </div>
                <ImageBlock alt={t('help.orders.poImageAlt')} src="/help/orders/purchase-order.png" />
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="o-2">
            <AccordionTrigger>{t('help.orders.soTitle')}</AccordionTrigger>
            <AccordionContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <ol className="list-decimal pl-5 text-sm space-y-1">
                    <li>{t('help.orders.soStep1')}</li>
                    <li>{t('help.orders.soStep2')}</li>
                    <li>{t('help.orders.soStep3')}</li>
                    <li>{t('help.orders.soStep4')}</li>
                  </ol>
                </div>
                <ImageBlock alt={t('help.orders.soImageAlt')} src="/help/orders/sell-order.png" />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default OrdersHelp;