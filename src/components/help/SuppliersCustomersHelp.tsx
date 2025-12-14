"use client";

import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import ImageBlock from './ImageBlock';
import { t } from '@/utils/i18n';

const SuppliersCustomersHelp: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-sky-600" />
          <CardTitle>{t('help.contacts.title')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible>
          <AccordionItem value="sc-1">
            <AccordionTrigger>{t('help.contacts.addTitle')}</AccordionTrigger>
            <AccordionContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm mb-2">
                    {t('help.contacts.addText')}
                  </p>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    <li>{t('help.contacts.optionalBullet')}</li>
                    <li>{t('help.contacts.defaultBullet')}</li>
                  </ul>
                </div>
                <ImageBlock alt={t('help.contacts.formsImageAlt')} src="/help/contacts/forms.png" />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default SuppliersCustomersHelp;