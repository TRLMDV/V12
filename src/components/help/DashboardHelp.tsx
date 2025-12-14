"use client";

import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ImageBlock from './ImageBlock';
import { t } from '@/utils/i18n';

const DashboardHelp: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('help.dashboard.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible>
          <AccordionItem value="d-1">
            <AccordionTrigger>{t('help.dashboard.widgetsTitle')}</AccordionTrigger>
            <AccordionContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm">
                    {t('help.dashboard.widgetsText')}
                  </p>
                </div>
                <ImageBlock alt={t('help.dashboard.overviewImageAlt')} src="/help/dashboard/overview.png" />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default DashboardHelp;