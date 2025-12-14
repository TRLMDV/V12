"use client";

import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeftRight, MinusCircle } from 'lucide-react';
import ImageBlock from './ImageBlock';
import { t } from '@/utils/i18n';

const StockHelp: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="h-5 w-5 text-sky-600" />
          <CardTitle>{t('help.stock.title')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible>
          <AccordionItem value="st-1">
            <AccordionTrigger>{t('help.stock.movementsTitle')}</AccordionTrigger>
            <AccordionContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm">
                    {t('help.stock.movementsText')}
                  </p>
                </div>
                <ImageBlock alt={t('help.stock.movementsImageAlt')} src="/help/stock/movement.png" />
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="st-2">
            <AccordionTrigger>{t('help.stock.utilizationTitle')}</AccordionTrigger>
            <AccordionContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm">
                    {t('help.stock.utilizationText')}
                  </p>
                </div>
                <ImageBlock alt={t('help.stock.utilizationImageAlt')} src="/help/stock/utilization.png" />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default StockHelp;