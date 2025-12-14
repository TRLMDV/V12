"use client";

import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ImageBlock from './ImageBlock';
import { t } from '@/utils/i18n';

const GettingStartedHelp: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('help.gettingStarted.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="gs-1">
            <AccordionTrigger className="text-left">
              {t('help.gettingStarted.navTitle')}
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="mb-2">
                    {t('help.gettingStarted.navText')}
                  </p>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    <li>{t('help.gettingStarted.desktopBullet')}</li>
                    <li>{t('help.gettingStarted.mobileBullet')}</li>
                  </ul>
                </div>
                <ImageBlock alt={t('help.gettingStarted.navImageAlt')} src="/help/getting-started/navigation.png" />
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="gs-2">
            <AccordionTrigger className="text-left">
              {t('help.gettingStarted.quickSetupTitle')}
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="mb-2">
                    {t('help.gettingStarted.quickSetupText')}
                  </p>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    <li>{t('help.gettingStarted.themeBullet')}</li>
                    <li>{t('help.gettingStarted.taxesBullet')}</li>
                    <li>{t('help.gettingStarted.currenciesBullet')}</li>
                  </ul>
                </div>
                <ImageBlock alt={t('help.gettingStarted.settingsImageAlt')} src="/help/settings/overview.png" />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default GettingStartedHelp;