"use client";

import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Box } from 'lucide-react';
import ImageBlock from './ImageBlock';
import { t } from '@/utils/i18n';

const ProductsHelp: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Box className="h-5 w-5 text-sky-600" />
          <CardTitle>{t('help.products.title')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible>
          <AccordionItem value="p-1">
            <AccordionTrigger>{t('help.products.addTitle')}</AccordionTrigger>
            <AccordionContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <ol className="list-decimal pl-5 space-y-1 text-sm">
                    <li>{t('help.products.addStep1')}</li>
                    <li>{t('help.products.addStep2')}</li>
                    <li>{t('help.products.addStep3')}</li>
                    <li>{t('help.products.addStep4')}</li>
                  </ol>
                </div>
                <ImageBlock alt={t('help.products.addImageAlt')} src="/help/products/add-product.png" />
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="p-2">
            <AccordionTrigger>{t('help.products.editTitle')}</AccordionTrigger>
            <AccordionContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm">
                    {t('help.products.editText')}
                  </p>
                </div>
                <ImageBlock alt={t('help.products.editImageAlt')} src="/help/products/edit-product.png" />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default ProductsHelp;