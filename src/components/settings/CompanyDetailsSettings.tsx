"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ImageUpload from '@/components/ImageUpload';
import { toast } from 'sonner';
import { Settings } from '@/types';

interface CompanyDetailsSettingsProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

const CompanyDetailsSettings: React.FC<CompanyDetailsSettingsProps> = ({ settings, setSettings, t }) => {
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [companyLogo, setCompanyLogo] = useState<string | null>(settings.companyLogo);

  useEffect(() => {
    setCompanyName(settings.companyName);
    setCompanyLogo(settings.companyLogo);
  }, [settings]);

  const handleSaveCompanyDetails = () => {
    setSettings(prev => ({ ...prev, companyName, companyLogo: companyLogo || '' }));
    toast.success(t('success'), { description: t('detailsUpdated') });
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4">{t('companyDetails')}</h2>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="companyName" className="text-right">{t('companyName')}</Label>
          <Input
            id="companyName"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-start gap-4">
          <Label className="text-right">{t('companyLogo')}</Label>
          <div className="col-span-3">
            <ImageUpload
              label=""
              initialImageUrl={companyLogo || undefined}
              onImageChange={setCompanyLogo}
              previewSize="sm"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSaveCompanyDetails}>{t('saveCompanyDetails')}</Button>
      </div>
    </div>
  );
};

export default CompanyDetailsSettings;