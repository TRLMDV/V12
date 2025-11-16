"use client";

import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { MOCK_CURRENT_DATE } from '@/data/initialData'; // Corrected import
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import ImageUpload from '@/components/ImageUpload';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select components
import { t } from '@/utils/i18n';
import { Product } from '@/types'; // Import types from types file

interface ProductFormProps {
  productId?: number;
  onSuccess: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ productId, onSuccess }) => {
  const { products, packingUnits, saveItem } = useData();
  const isEdit = productId !== undefined;
  const [product, setProduct] = useState<Partial<Product>>({});
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [defaultPackingUnitId, setDefaultPackingUnitId] = useState<number | undefined>(undefined);

  useEffect(() => {
    console.log("ProductForm.tsx: useEffect triggered. productId prop:", productId, "isEdit:", isEdit);
    // Find the 'Piece' packing unit
    const piecePackingUnit = packingUnits.find(pu => pu.name === 'Piece');

    if (isEdit) {
      const existingProduct = products.find(p => p.id === productId);
      if (existingProduct) {
        console.log("ProductForm.tsx: Editing existing product:", existingProduct);
        setProduct(existingProduct);
        setImageUrl(existingProduct.imageUrl || null);
        setDefaultPackingUnitId(existingProduct.defaultPackingUnitId);
      } else {
        console.warn("ProductForm.tsx: Editing mode but product not found with ID:", productId);
        // Fallback to new product form if ID is not found in edit mode
        setProduct({});
        setImageUrl(null);
        setDefaultPackingUnitId(piecePackingUnit ? piecePackingUnit.id : undefined);
      }
    } else {
      console.log("ProductForm.tsx: Creating new product. Resetting form.");
      setProduct({});
      setImageUrl(null);
      // Set default to 'Piece' packing unit for new products
      setDefaultPackingUnitId(piecePackingUnit ? piecePackingUnit.id : undefined);
    }
  }, [productId, isEdit, products, packingUnits]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setProduct(prev => ({ ...prev, [id]: id === 'minStock' ? parseInt(value) || 0 : value }));
  };

  const handleImageChange = (base64Image: string | null) => {
    setImageUrl(base64Image);
  };

  const handleDefaultPackingUnitChange = (value: string) => {
    setDefaultPackingUnitId(value === 'none-selected' ? undefined : parseInt(value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product.name || !product.sku) {
      alert('Product Name and SKU are required.');
      return;
    }

    const productToSave: Product = {
      ...product,
      id: product.id || 0, // Will be overwritten by saveItem if new
      name: product.name,
      sku: product.sku,
      category: product.category || '', // Keep category as empty string if not provided
      description: product.description || '',
      minStock: product.minStock || 0,
      imageUrl: imageUrl || '',
      stock: product.stock || {}, // Preserve existing stock or initialize empty
      averageLandedCost: product.averageLandedCost || 0, // Preserve existing or initialize
      defaultPackingUnitId: defaultPackingUnitId, // Save default packing unit
    };

    console.log("ProductForm.tsx: handleSubmit. Product object to save:", productToSave);
    saveItem('products', productToSave);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">
            {t('productName')}
          </Label>
          <Input
            id="name"
            value={product.name || ''}
            onChange={handleChange}
            className="col-span-3"
            required
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="sku" className="text-right">
            {t('sku')}
          </Label>
          <Input
            id="sku"
            value={product.sku || ''}
            onChange={handleChange}
            className="col-span-3"
            required
          />
        </div>
        {/* Removed Category Input Field */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="description" className="text-right">
            {t('description')}
          </Label>
          <Textarea
            id="description"
            value={product.description || ''}
            onChange={handleChange}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="minStock" className="text-right">
            {t('minimumStockLevel')}
          </Label>
          <Input
            id="minStock"
            type="number"
            value={product.minStock || 0}
            onChange={handleChange}
            className="col-span-3"
            min="0"
            required
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="defaultPackingUnit" className="text-right">
            {t('defaultPacking')}
          </Label>
          <Select onValueChange={handleDefaultPackingUnitChange} value={defaultPackingUnitId === undefined ? 'none-selected' : String(defaultPackingUnitId)}>
            <SelectTrigger id="defaultPackingUnit" className="col-span-3">
              <SelectValue placeholder={t('selectPackingUnit')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none-selected">{t('none')}</SelectItem>
              {packingUnits.map(pu => (
                <SelectItem key={pu.id} value={String(pu.id)}>
                  {pu.name} ({pu.conversionFactor} {t(pu.baseUnit)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-start gap-4">
          <Label className="text-right">
            {t('productImage')}
          </Label>
          <div className="col-span-3">
            <ImageUpload
              label="" // Label is handled by parent grid
              initialImageUrl={imageUrl || undefined}
              onImageChange={handleImageChange}
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit">{t('saveProduct')}</Button>
      </div>
    </form>
  );
};

export default ProductForm;