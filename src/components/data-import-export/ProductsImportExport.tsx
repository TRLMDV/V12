"use client";

import React from 'react';
import ExcelImportButton from '@/components/ExcelImportButton';
import ExcelExportButton from '@/components/ExcelExportButton';
import { toast } from 'sonner';
import { Product } from '@/types';

interface ProductsImportExportProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  getNextId: (key: 'products') => number;
  setNextIdForCollection: (key: 'products', nextId: number) => void;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

const ProductsImportExport: React.FC<ProductsImportExportProps> = ({
  products, setProducts, getNextId, setNextIdForCollection, t
}) => {
  const handleImportProducts = (data: any[]) => {
    const newProducts: Product[] = data.map((row: any) => ({
      id: getNextId('products'),
      name: String(row['Product Name'] || ''),
      sku: String(row['SKU'] || ''),
      category: String(row['Category'] || ''),
      description: String(row['Description'] || ''),
      stock: {},
      minStock: parseInt(row['Min. Stock'] || '0'),
      averageLandedCost: parseFloat(row['Avg. Landed Cost'] || '0'),
      imageUrl: String(row['Image URL'] || ''),
    }));

    setProducts(prev => {
      const existingSkus = new Set(prev.map(p => p.sku.toLowerCase()));
      const uniqueNewProducts = newProducts.filter(p => !existingSkus.has(p.sku.toLowerCase()));

      if (uniqueNewProducts.length < newProducts.length) {
        toast.info(t('excelImportInfo'), { description: t('duplicateProductsSkipped') });
      }

      const allProducts = [...prev, ...uniqueNewProducts];
      const maxId = allProducts.reduce((max, p) => Math.max(max, p.id), 0);
      setNextIdForCollection('products', maxId + 1);
      return allProducts;
    });
  };

  return (
    <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-4">{t('products')}</h2>
      <p className="text-gray-600 dark:text-slate-400 mb-4">
        {t('productsImportExportDescription')}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ExcelImportButton
          buttonLabel={t('importExcelFile')}
          description={t('importProductsDescription')}
          onImport={handleImportProducts}
          requiredColumns={['Product Name', 'SKU', 'Category', 'Description', 'Min. Stock', 'Avg. Landed Cost', 'Image URL']}
        />
        <ExcelExportButton
          buttonLabel={t('exportExcelFile')}
          data={products.map(p => ({
            ...p,
            totalStock: Object.values(p.stock || {}).reduce((a, b) => a + b, 0),
          }))}
          fileName="products_export"
          sheetName="Products"
          columns={[
            { header: 'ID', accessor: 'id' },
            { header: 'Product Name', accessor: 'name' },
            { header: 'SKU', accessor: 'sku' },
            { header: 'Category', accessor: 'category' },
            { header: 'Description', accessor: 'description' },
            { header: 'Min. Stock', accessor: 'minStock' },
            { header: 'Avg. Landed Cost', accessor: 'averageLandedCost' },
            { header: 'Image URL', accessor: 'imageUrl' },
            { header: 'Total Stock', accessor: 'totalStock' },
          ]}
        />
      </div>
    </div>
  );
};

export default ProductsImportExport;