"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useData, MOCK_CURRENT_DATE } from '@/context/DataContext'; // MOCK_CURRENT_DATE is still from DataContext
import { t } from '@/utils/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ImageUpload from '@/components/ImageUpload';
import { toast } from 'sonner';
import CodeConfirmationModal from '@/components/CodeConfirmationModal'; // Import the new component
import { Slider } from '@/components/ui/slider'; // Import Slider component
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'; // Import Table components
import { PlusCircle, Edit, Trash2 } from 'lucide-react'; // Import icons
import FormModal from '@/components/FormModal'; // Import FormModal
import PaymentCategoryForm from '@/forms/PaymentCategoryForm'; // Import new form
import { Settings, CurrencyRates, Product, Customer, PaymentCategorySetting, Currency } from '@/types'; // Import types from types file

const ALL_CURRENCIES: Currency[] = [
  'AZN', 'USD', 'EUR', 'RUB', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'CNY', 'KWD', 'BHD', 'OMR', 'JOD', 'GIP', 'KYD', 'KRW', 'SGD', 'INR', 'MXN', 'SEK', 'THB'
];

const SettingsPage: React.FC = () => {
  const { settings, setSettings, currencyRates, setCurrencyRates, showConfirmationModal, getNextId, setNextIdForCollection } = useData();

  const [companyName, setCompanyName] = useState(settings.companyName);
  const [companyLogo, setCompanyLogo] = useState<string | null>(settings.companyLogo);
  const [theme, setTheme] = useState<'light' | 'dark'>(settings.theme);
  const [defaultVat, setDefaultVat] = useState(settings.defaultVat);
  const [defaultMarkup, setDefaultMarkup] = useState(settings.defaultMarkup);
  const [displayScale, setDisplayScale] = useState(settings.displayScale); // New state for display scale
  const [mainCurrency, setMainCurrency] = useState<Currency>(settings.mainCurrency); // New state for main currency

  // States for all currency rates
  const [rates, setRates] = useState<CurrencyRates>(currencyRates);

  // States for Payment Categories
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PaymentCategorySetting | undefined>(undefined);

  // States for the new code confirmation modal
  const [isCodeConfirmationModalOpen, setIsCodeConfirmationModalOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  useEffect(() => {
    setCompanyName(settings.companyName);
    setCompanyLogo(settings.companyLogo);
    setTheme(settings.theme);
    setDefaultVat(settings.defaultVat);
    setDefaultMarkup(settings.defaultMarkup);
    setDisplayScale(settings.displayScale);
    setMainCurrency(settings.mainCurrency); // Initialize main currency
    setRates(currencyRates); // Initialize all rates
  }, [settings, currencyRates]);

  const handleSaveCompanyDetails = () => {
    setSettings(prev => ({ ...prev, companyName, companyLogo: companyLogo || '' }));
    toast.success(t('success'), { description: t('detailsUpdated') });
  };

  const handleSaveCurrencyRates = () => {
    const invalidRates = ALL_CURRENCIES.filter(c => c !== 'AZN' && (isNaN(rates[c]) || rates[c] <= 0));
    if (invalidRates.length > 0) {
      toast.error(t('invalidRates'), { description: `Please enter valid positive numbers for: ${invalidRates.join(', ')}` });
      return;
    }
    setCurrencyRates(prev => ({ ...prev, ...rates, AZN: 1.00 })); // Ensure AZN is always 1.00
    toast.success(t('success'), { description: t('ratesUpdated') });
  };

  const handleSaveDefaultVat = () => {
    if (isNaN(defaultVat) || defaultVat < 0 || defaultVat > 100) {
      toast.error('Validation Error', { description: 'VAT percentage must be between 0 and 100.' });
      return;
    }
    setSettings(prev => ({ ...prev, defaultVat }));
    toast.success(t('success'), { description: t('vatUpdated') });
  };

  const handleSaveDefaultMarkup = () => {
    if (isNaN(defaultMarkup) || defaultMarkup < 0) {
      toast.error('Validation Error', { description: 'Markup percentage cannot be negative.' });
      return;
    }
    setSettings(prev => ({ ...prev, defaultMarkup }));
    toast.success(t('success'), { description: t('markupUpdated') });
  };

  const handleSaveDisplayScale = () => {
    if (isNaN(displayScale) || displayScale < 50 || displayScale > 150) {
      toast.error('Validation Error', { description: 'Display scale must be between 50% and 150%.' });
      return;
    }
    setSettings(prev => ({ ...prev, displayScale }));
    toast.success(t('success'), { description: t('displayScaleUpdated') });
  };

  const handleSaveMainCurrency = () => {
    setSettings(prev => ({ ...prev, mainCurrency }));
    toast.success(t('success'), { description: t('mainCurrencyUpdated') });
  };

  const handleThemeChange = (value: 'light' | 'dark') => {
    setTheme(value);
    setSettings(prev => ({ ...prev, theme: value }));
    // The MainLayout useEffect will handle applying the class to document.documentElement
  };

  const performEraseAllData = useCallback(() => {
    // Clear all local storage items used by the app
    localStorage.removeItem('products');
    localStorage.removeItem('suppliers');
    localStorage.removeItem('customers');
    localStorage.removeItem('warehouses');
    localStorage.removeItem('purchaseOrders');
    localStorage.removeItem('sellOrders');
    localStorage.removeItem('incomingPayments');
    localStorage.removeItem('outgoingPayments');
    localStorage.removeItem('productMovements');
    localStorage.removeItem('settings');
    localStorage.removeItem('currencyRates');
    localStorage.removeItem('nextIds');
    localStorage.removeItem('initialized'); // Reset initialization flag

    toast.success(t('success'), { description: t('allDataErased') });
    setTimeout(() => window.location.reload(), 1000); // Reload to re-initialize with default data
  }, []);

  const generateRandomCode = useCallback(() => {
    return Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit random number
  }, []);

  const handleCodeConfirmation = useCallback((enteredCode: string) => {
    if (enteredCode === generatedCode) {
      performEraseAllData();
    } else {
      // This case should ideally be caught by CodeConfirmationModal itself,
      // but added here as a fallback.
      toast.error(t('codeMismatchError'), { description: t('pleaseEnterCorrectCode') });
    }
    setIsCodeConfirmationModalOpen(false);
  }, [generatedCode, performEraseAllData]);

  const handleEraseAllData = useCallback(() => {
    showConfirmationModal(
      t('eraseAllData'),
      t('eraseAllDataWarning'),
      () => {
        const code = generateRandomCode();
        setGeneratedCode(code);
        setIsCodeConfirmationModalOpen(true);
      }
    );
  }, [showConfirmationModal, generateRandomCode]);

  // --- Payment Category Management ---
  const handleAddCategory = () => {
    setEditingCategory(undefined);
    setIsCategoryModalOpen(true);
  };

  const handleEditCategory = (category: PaymentCategorySetting) => {
    setEditingCategory(category);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (newCategory: PaymentCategorySetting) => {
    setSettings(prevSettings => {
      const existingCategories = prevSettings.paymentCategories || [];
      let updatedCategories;

      if (newCategory.id === 0) { // Add new category
        const newId = getNextId('paymentCategories');
        updatedCategories = [...existingCategories, { ...newCategory, id: newId }];
        setNextIdForCollection('paymentCategories', newId + 1);
        toast.success(t('success'), { description: t('categoryAdded') });
      } else { // Update existing category
        updatedCategories = existingCategories.map(cat =>
          cat.id === newCategory.id ? { ...cat, name: newCategory.name } : cat
        );
        toast.success(t('success'), { description: t('categoryUpdated') });
      }
      return { ...prevSettings, paymentCategories: updatedCategories };
    });
    setIsCategoryModalOpen(false);
  };

  const handleDeleteCategory = (categoryId: number) => {
    showConfirmationModal(
      t('deleteCategory'),
      t('deleteCategoryWarning'),
      () => {
        setSettings(prevSettings => ({
          ...prevSettings,
          paymentCategories: (prevSettings.paymentCategories || []).filter(cat => cat.id !== categoryId),
        }));
        toast.success(t('success'), { description: t('categoryDeleted') });
      }
    );
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-200 mb-6">{t('settings')}</h1>

      {/* Company Details */}
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

      {/* Theme Settings */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4">{t('theme')}</h2>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="theme-select" className="text-right">{t('theme')}</Label>
          <Select onValueChange={handleThemeChange} value={theme}>
            <SelectTrigger id="theme-select" className="col-span-3">
              <SelectValue placeholder={t('light')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">{t('light')}</SelectItem>
              <SelectItem value="dark">{t('dark')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Program Display Scaling */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4">{t('programDisplayScaling')}</h2>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="displayScale" className="text-right">{t('displayScale')}</Label>
            <div className="col-span-2 flex items-center gap-2">
              <Slider
                id="displayScale"
                min={50}
                max={150}
                step={1}
                value={[displayScale]}
                onValueChange={(value) => setDisplayScale(value[0])}
                className="w-full"
              />
            </div>
            <Input
              type="number"
              min="50"
              max="150"
              step="1"
              value={displayScale}
              onChange={(e) => setDisplayScale(parseInt(e.target.value) || 0)}
              className="col-span-1 text-center"
            />
            <span className="text-gray-700 dark:text-slate-300">%</span>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSaveDisplayScale}>{t('saveDisplayScale')}</Button>
        </div>
      </div>

      {/* Default VAT */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4">{t('defaultVat')}</h2>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="defaultVat" className="text-right">{t('defaultVat')}</Label>
          <Input
            id="defaultVat"
            type="number"
            step="0.01"
            value={defaultVat}
            onChange={(e) => setDefaultVat(parseFloat(e.target.value) || 0)}
            className="col-span-3"
            min="0"
            max="100"
          />
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={handleSaveDefaultVat}>{t('saveDefaultVat')}</Button>
        </div>
      </div>

      {/* Default Markup */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4">{t('defaultMarkup')}</h2>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="defaultMarkup" className="text-right">{t('defaultMarkup')}</Label>
          <Input
            id="defaultMarkup"
            type="number"
            step="0.01"
            value={defaultMarkup}
            onChange={(e) => setDefaultMarkup(parseFloat(e.target.value) || 0)}
            className="col-span-3"
            min="0"
          />
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={handleSaveDefaultMarkup}>{t('saveDefaultMarkup')}</Button>
        </div>
      </div>

      {/* Main Currency Selection */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4">{t('mainCurrencySettings')}</h2>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="mainCurrency-select" className="text-right">{t('mainCurrency')}</Label>
          <Select onValueChange={(value: Currency) => setMainCurrency(value)} value={mainCurrency}>
            <SelectTrigger id="mainCurrency-select" className="col-span-3">
              <SelectValue placeholder="AZN" />
            </SelectTrigger>
            <SelectContent>
              {ALL_CURRENCIES.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={handleSaveMainCurrency}>{t('saveMainCurrency')}</Button>
        </div>
      </div>

      {/* Currency Rates */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4">{t('currencyRatesSettings')}</h2>
        <p className="text-gray-600 dark:text-slate-400 mb-4">{t('currencyRatesDescription')}</p>
        <div className="grid gap-4 py-4">
          {ALL_CURRENCIES.filter(c => c !== 'AZN').map(c => (
            <div key={c} className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={`${c}-to-azn`} className="text-right">{c} {t('toAzn')}</Label>
              <Input
                id={`${c}-to-azn`}
                type="number"
                step="0.0001"
                value={rates[c]}
                onChange={(e) => setRates(prev => ({ ...prev, [c]: parseFloat(e.target.value) || 0 }))}
                className="col-span-3"
                min="0.0001"
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSaveCurrencyRates}>{t('saveCurrencyRates')}</Button>
        </div>
      </div>

      {/* Payment Categories */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300">{t('paymentCategories')}</h2>
          <Button onClick={handleAddCategory}>
            <PlusCircle className="w-4 h-4 mr-2" />
            {t('addCategory')}
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100 dark:bg-slate-700">
                <TableHead className="p-3">{t('categoryName')}</TableHead>
                <TableHead className="p-3 text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(settings.paymentCategories || []).length > 0 ? (
                (settings.paymentCategories || []).map(category => (
                  <TableRow key={category.id} className="border-b dark:border-slate-700 text-gray-800 dark:text-slate-300">
                    <TableCell className="p-3">{category.name}</TableCell>
                    <TableCell className="p-3 text-right">
                      <Button variant="link" onClick={() => handleEditCategory(category)} className="mr-2 p-0 h-auto">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="link" onClick={() => handleDeleteCategory(category.id)} className="text-red-500 p-0 h-auto">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="p-4 text-center text-gray-500 dark:text-slate-400">
                    {t('noPaymentCategoriesFound')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Erase All Data */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4">{t('eraseAllData')}</h2>
        <p className="text-gray-600 dark:text-slate-400 mb-4">
          {t('eraseAllDataDescription')}
        </p>
        <div className="flex justify-end">
          <Button variant="destructive" onClick={handleEraseAllData}>
            {t('eraseAllData')}
          </Button>
        </div>
      </div>

      <CodeConfirmationModal
        isOpen={isCodeConfirmationModalOpen}
        onClose={() => setIsCodeConfirmationModalOpen(false)}
        onConfirm={handleCodeConfirmation}
        codeToEnter={generatedCode}
      />

      <FormModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategory ? t('editCategory') : t('addCategory')}
      >
        <PaymentCategoryForm
          category={editingCategory}
          onSuccess={handleSaveCategory}
          onCancel={() => setIsCategoryModalOpen(false)}
        />
      </FormModal>
    </div>
  );
};

export default SettingsPage;