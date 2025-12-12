"use client";

import React, { useState, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { MOCK_CURRENT_DATE } from '@/data/initialData'; // Corrected import
import { t } from '@/utils/i18n';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import FormModal from '@/components/FormModal';
import ProductForm from '@/forms/ProductForm';
import { ArrowUpDown, PlusCircle, Eye } from 'lucide-react'; // Import Eye icon
import { toast } from 'sonner';
import { Input } from '@/components/ui/input'; // Import Input component
import { Label } from '@/components/ui/label'; // Import Label component
import PaginationControls from '@/components/PaginationControls'; // Import PaginationControls
import ImageEnlargerModal from '@/components/ImageEnlargerModal'; // New import
import ProductTransactionsModal from '@/components/ProductTransactionsModal'; // Updated import for product details modal
import { Product } from '@/types'; // Import types from types file
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'; // Import useBarcodeScanner

type SortConfig = {
  key: keyof Product | 'totalStock' | 'priceWithMarkupCalc' | 'priceWithMarkupAndVatCalc' | 'defaultPackingUnitName';
  direction: 'ascending' | 'descending';
};

const Products: React.FC = () => {
  const { products, packingUnits, deleteItem, settings } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | undefined>(undefined);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'sku', direction: 'ascending' });
  const [searchSku, setSearchSku] = useState<string>(''); // New state for SKU search

  // States for image enlarger modal
  const [isImageEnlargerModalOpen, setIsImageEnlargerModalOpen] = useState(false);
  const [enlargedImageUrl, setEnlargedImageUrl] = useState('');
  const [enlargedProductName, setEnlargedProductName] = useState('');

  // States for product purchase orders modal
  const [isProductTransactionsModalOpen, setIsProductTransactionsModalOpen] = useState(false);
  const [selectedProductIdForDetails, setSelectedProductIdForDetails] = useState<number | undefined>(undefined);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100; // User requested 100 items per page

  const defaultMarkup = settings.defaultMarkup / 100;
  const defaultVat = settings.defaultVat / 100;

  const packingUnitMap = useMemo(() => {
    return packingUnits.reduce((acc, pu) => ({ ...acc, [pu.id]: pu }), {} as { [key: number]: typeof packingUnits[0] });
  }, [packingUnits]);

  const filteredAndSortedProducts = useMemo(() => {
    let filteredItems = products;

    // Apply SKU search filter
    if (searchSku) {
      const lowercasedSearchSku = searchSku.trim().toLowerCase();
      filteredItems = filteredItems.filter(p =>
        String(p.sku).trim().toLowerCase().includes(lowercasedSearchSku) ||
        String(p.barcode || '').trim().toLowerCase().includes(lowercasedSearchSku) // Search by barcode too
      );
    }

    const sortableItems = filteredItems.map(p => {
      // Find the 'Piece' packing unit for default display
      const piecePackingUnit = packingUnits.find(pu => pu.name === 'Piece');
      const defaultPackingUnitDisplay = p.defaultPackingUnitId
        ? `${packingUnitMap[p.defaultPackingUnitId]?.name || t('none')} (${packingUnitMap[p.defaultPackingUnitId]?.conversionFactor || 1} ${t(packingUnitMap[p.defaultPackingUnitId]?.baseUnit || 'piece')})`
        : (piecePackingUnit ? `${piecePackingUnit.name} (${piecePackingUnit.conversionFactor} ${t(piecePackingUnit.baseUnit)})` : t('none'));

      return {
        ...p,
        totalStock: Object.values(p.stock || {}).reduce((a, b) => a + b, 0),
        priceWithMarkupCalc: (p.averageLandedCost || 0) * (1 + defaultMarkup),
        priceWithMarkupAndVatCalc: (p.averageLandedCost || 0) * (1 + defaultMarkup) * (1 + defaultVat),
        defaultPackingUnitName: defaultPackingUnitDisplay,
      };
    });

    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const key = sortConfig.key;
        const valA = a[key] === undefined ? '' : a[key];
        const valB = b[key] === undefined ? '' : b[key];

        let comparison = 0;
        if (typeof valA === 'string' || typeof valB === 'string') {
          comparison = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
        } else {
          if (valA < valB) comparison = -1;
          if (valA > valB) comparison = 1;
        }
        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }
    return sortableItems;
  }, [products, sortConfig, defaultMarkup, defaultVat, searchSku, packingUnitMap, packingUnits, t]);

  // Apply pagination to the filtered and sorted products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedProducts.slice(startIndex, endIndex);
  }, [filteredAndSortedProducts, currentPage, itemsPerPage]);

  const requestSort = (key: SortConfig['key']) => {
    let direction: SortConfig['direction'] = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleAddProduct = () => {
    setEditingProductId(undefined);
    setIsModalOpen(true);
  };

  const handleEditProduct = (id: number) => {
    setEditingProductId(id);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = (id: number) => {
    deleteItem('products', id);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingProductId(undefined);
  };

  const showImageEnlargerModal = (imageUrl: string, productName: string) => {
    setEnlargedImageUrl(imageUrl);
    setEnlargedProductName(productName);
    setIsImageEnlargerModalOpen(true);
  };

  const handleViewProductDetails = (productId: number) => {
    setSelectedProductIdForDetails(productId);
    setIsProductTransactionsModalOpen(true);
  };

  // Barcode scanner integration
  const handleBarcodeScanned = (barcode: string) => {
    setSearchSku(barcode); // Set the scanned barcode as the search SKU
    setCurrentPage(1); // Reset to first page on search
    toast.success(t('barcodeScanned'), { description: `${t('product')} ${t('found')}.` }); // Generic success, actual product found will be in the table
  };

  useBarcodeScanner({ onBarcodeScanned: handleBarcodeScanned });

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-200">{t('products')}</h1>
        <Button onClick={handleAddProduct}>
          <PlusCircle className="w-4 h-4 mr-2" />
          {t('addProduct')}
        </Button>
      </div>

      <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <Label htmlFor="search-sku" className="text-sm font-medium text-gray-700 dark:text-slate-300">
              {t('searchBySku')} / {t('barcode')}
            </Label>
            <Input
              id="search-sku"
              type="text"
              placeholder={t('enterSku')}
              value={searchSku}
              onChange={(e) => {
                setSearchSku(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              className="mt-1 w-full p-2 border rounded-md shadow-sm bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100 dark:bg-slate-700">
              <TableHead className="p-3">{t('noDot')}</TableHead>
              <TableHead className="p-3">{t('image')}</TableHead>
              <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={() => requestSort('name')}>
                {t('name')} {sortConfig.key === 'name' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
              </TableHead>
              <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={() => requestSort('sku')}>
                {t('sku')} {sortConfig.key === 'sku' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
              </TableHead>
              <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={() => requestSort('barcode')}>
                {t('barcode')} {sortConfig.key === 'barcode' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
              </TableHead>
              <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={() => requestSort('hssCode')}>
                {t('hssCode')} {sortConfig.key === 'hssCode' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
              </TableHead>
              {/* Removed Category TableHead */}
              <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={() => requestSort('defaultPackingUnitName')}>
                {t('defaultPacking')} {sortConfig.key === 'defaultPackingUnitName' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
              </TableHead>
              <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={() => requestSort('totalStock')}>
                {t('totalStock')} {sortConfig.key === 'totalStock' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
              </TableHead>
              <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={() => requestSort('averageLandedCost')}>
                {t('avgLandedCost')} {sortConfig.key === 'averageLandedCost' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
              </TableHead>
              <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={() => requestSort('priceWithMarkupCalc')}>
                {t('landedCostPlusMarkup')} {sortConfig.key === 'priceWithMarkupCalc' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
              </TableHead>
              <TableHead className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600" onClick={() => requestSort('priceWithMarkupAndVatCalc')}>
                {t('landedCostPlusMarkupPlusVat')} {sortConfig.key === 'priceWithMarkupAndVatCalc' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
              </TableHead>
              <TableHead className="p-3">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProducts.length > 0 ? (
              paginatedProducts.map((p, index) => {
                const stockIsLow = p.totalStock < p.minStock;
                const landedCostDisplay = p.averageLandedCost > 0 ? `${p.averageLandedCost.toFixed(2)} AZN` : t('na');
                const priceWithMarkupDisplay = p.priceWithMarkupCalc > 0 ? `${p.priceWithMarkupCalc.toFixed(2)} AZN` : t('na');
                const priceWithMarkupPlusVatDisplay = p.priceWithMarkupAndVatCalc > 0 ? `${p.priceWithMarkupAndVatCalc.toFixed(2)} AZN` : t('na');
                const defaultImage = 'https://placehold.co/100x100/e2e8f0/e2e8f0?text=No-Image';

                return (
                  <TableRow key={p.id} className="border-b dark:border-slate-700 text-gray-800 dark:text-slate-300">
                    <TableCell className="p-3 font-semibold">{(currentPage - 1) * itemsPerPage + index + 1}.</TableCell>
                    <TableCell className="p-3">
                      <img
                        src={p.imageUrl || defaultImage}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = defaultImage;
                        }}
                        className="w-16 h-16 rounded-md object-cover cursor-pointer"
                        onClick={() => showImageEnlargerModal(p.imageUrl, p.name)}
                        alt={p.name}
                      />
                    </TableCell>
                    <TableCell className="p-3">{p.name}</TableCell>
                    <TableCell className="p-3">{p.sku}</TableCell>
                    <TableCell className="p-3">{p.barcode || t('na')}</TableCell>
                    <TableCell className="p-3">{p.hssCode || t('na')}</TableCell>
                    {/* Removed Category TableCell */}
                    <TableCell className="p-3">{p.defaultPackingUnitName}</TableCell>
                    <TableCell className={`p-3 font-semibold ${stockIsLow ? 'text-red-500' : ''}`}>
                      {p.totalStock}
                    </TableCell>
                    <TableCell className="p-3">{landedCostDisplay}</TableCell>
                    <TableCell className="p-3 font-semibold text-gray-700 dark:text-slate-300">
                      {priceWithMarkupDisplay}
                    </TableCell>
                    <TableCell className="p-3 font-semibold text-sky-600 dark:text-sky-400">
                      {priceWithMarkupPlusVatDisplay}
                    </TableCell>
                    <TableCell className="p-3">
                      <Button variant="link" onClick={() => handleViewProductDetails(p.id)} className="mr-2 p-0 h-auto">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="link" onClick={() => handleEditProduct(p.id)} className="mr-2 p-0 h-auto">
                        {t('edit')}
                      </Button>
                      <Button variant="link" onClick={() => handleDeleteProduct(p.id)} className="text-red-500 p-0 h-auto">
                        {t('delete')}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={12} className="p-4 text-center text-gray-500 dark:text-slate-400">
                  {t('noItemsFound')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <PaginationControls
        totalItems={filteredAndSortedProducts.length}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      <FormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={editingProductId ? t('editProduct') : t('createProduct')}
      >
        <ProductForm productId={editingProductId} onSuccess={handleModalClose} />
      </FormModal>

      <ImageEnlargerModal
        isOpen={isImageEnlargerModalOpen}
        onClose={() => setIsImageEnlargerModalOpen(false)}
        imageUrl={enlargedImageUrl}
        productName={enlargedProductName}
      />

      {selectedProductIdForDetails !== undefined && (
        <ProductTransactionsModal
          isOpen={isProductTransactionsModalOpen}
          onClose={() => setIsProductTransactionsModalOpen(false)}
          productId={selectedProductIdForDetails}
        />
      )}
    </div>
  );
};

export default Products;