"use client";

import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart } from 'lucide-react';
import ImageBlock from './ImageBlock';
import { t } from '@/utils/i18n';

const FinanceHelp: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart className="h-5 w-5 text-sky-600" />
          <CardTitle>{t('help.finance.title')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible>
          <AccordionItem value="f-1">
            <AccordionTrigger>{t('help.finance.overviewTitle')}</AccordionTrigger>
            <AccordionContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm">
                    {t('help.finance.overviewText')}
                  </p>
                </div>
                <ImageBlock alt={t('help.finance.overviewImageAlt')} src="/help/finance/overview.png" />
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="f-2">
            <AccordionTrigger>{t('help.finance.profitTitle')}</AccordionTrigger>
            <AccordionContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm">
                    {t('help.finance.profitText')}
                  </p>
                </div>
                <ImageBlock alt={t('help.finance.profitImageAlt')} src="/help/finance/profitability.png" />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default FinanceHelp;