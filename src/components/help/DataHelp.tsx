"use client";

import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ImageBlock from './ImageBlock';
import { t } from '@/utils/i18n';

const DataHelp: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('help.data.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible>
          <AccordionItem value="d-1">
            <AccordionTrigger>{t('help.data.backupTitle')}</AccordionTrigger>
            <AccordionContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm">
                    {t('help.data.backupText')}
                  </p>
                </div>
                <ImageBlock alt={t('help.data.backupImageAlt')} src="/help/data/backup-recyclebin.png" />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default DataHelp;