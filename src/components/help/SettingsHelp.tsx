"use client";

import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings as SettingsIcon } from 'lucide-react';
import ImageBlock from './ImageBlock';
import { t } from '@/utils/i18n';

const SettingsHelp: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <SettingsIcon className="h-5 w-5 text-sky-600" />
          <CardTitle>{t('help.settings.title')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="s-1">
            <AccordionTrigger>{t('help.settings.themeLangTitle')}</AccordionTrigger>
            <AccordionContent>
              <ImageBlock alt={t('help.settings.themeLangImageAlt')} src="/help/settings/theme-language.png" />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="s-2">
            <AccordionTrigger>{t('help.settings.currenciesTitle')}</AccordionTrigger>
            <AccordionContent>
              <ImageBlock alt={t('help.settings.currenciesImageAlt')} src="/help/settings/currencies.png" />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="s-3">
            <AccordionTrigger>{t('help.settings.quickWidgetsTitle')}</AccordionTrigger>
            <AccordionContent>
              <ImageBlock alt={t('help.settings.dashboardWidgetsImageAlt')} src="/help/settings/dashboard-widgets.png" />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="s-4">
            <AccordionTrigger>{t('help.settings.packingPaymentsTitle')}</AccordionTrigger>
            <AccordionContent>
              <ImageBlock alt={t('help.settings.packingPaymentsImageAlt')} src="/help/settings/packing-payments.png" />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default SettingsHelp;