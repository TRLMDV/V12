"use client";

import { useCallback } from 'react';
import { Product, PurchaseOrder, SellOrder, ProductMovement } from '@/types'; // Import necessary types from types file

interface UseInventoryManagementProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

export function useInventoryManagement({ products, setProducts }: UseInventoryManagementProps) {

  const updateStockFromOrder = useCallback((newOrder: PurchaseOrder | SellOrder | null, oldOrder: PurchaseOrder | SellOrder | null) => {
    setProducts(prevProducts => {
      const updatedProducts = JSON.parse(JSON.stringify(prevProducts)); // Deep copy
      if (!newOrder && !oldOrder) return prevProducts;

      const isSell = newOrder ? 'vatPercent' in newOrder : (oldOrder ? 'vatPercent' in oldOrder : false);
      const statusCompleted = isSell ? 'Shipped' : 'Received';

      // --- 1. Reverse old stock change if the status was previously completed ---
      if (oldOrder && oldOrder.status === statusCompleted) {
        (oldOrder.items || []).forEach(item => {
          const p = updatedProducts.find((prod: Product) => prod.id === item.productId);
          if (p) {
            if (!p.stock) p.stock = {};
            p.stock[oldOrder.warehouseId] = (p.stock[oldOrder.warehouseId] || 0) + (isSell ? (item.qty as number) : -(item.qty as number));
            if (p.stock[oldOrder.warehouseId] < 0) p.stock[oldOrder.warehouseId] = 0;
          }
        });
      }

      // --- 2. Apply new stock change if status is now completed ---
      if (newOrder && newOrder.status === statusCompleted) {
        (newOrder.items || []).forEach(item => {
          const p = updatedProducts.find((prod: Product) => prod.id === item.productId);
          if (p) {
            if (!p.stock) p.stock = {};
            p.stock[newOrder.warehouseId] = (p.stock[newOrder.warehouseId] || 0) - (isSell ? (item.qty as number) : -(item.qty as number));
            if (p.stock[newOrder.warehouseId] < 0) p.stock[newOrder.warehouseId] = 0;
          }
        });
      }
      return updatedProducts;
    });
  }, [setProducts]);

  const updateAverageCosts = useCallback((purchaseOrder: PurchaseOrder) => {
    setProducts(prevProducts => {
      const updatedProducts = JSON.parse(JSON.stringify(prevProducts));
      (purchaseOrder.items || []).forEach(item => {
        const product = updatedProducts.find((p: Product) => p.id === item.productId);
        if (product) {
          const landedCostInAZN = item.landedCostPerUnit || 0;
          if (landedCostInAZN <= 0) return;

          const totalStock = Object.values(product.stock || {}).reduce((a: number, b: number) => a + b, 0) as number;
          const stockBeforeThisOrder = totalStock - (item.qty as number);

          if (stockBeforeThisOrder > 0 && (product.averageLandedCost || 0) > 0) {
            const oldTotalValue = stockBeforeThisOrder * (product.averageLandedCost as number);
            const newItemsValue = (item.qty as number) * landedCostInAZN;
            if (totalStock > 0) {
              product.averageLandedCost = parseFloat(((oldTotalValue + newItemsValue) / totalStock).toFixed(4));
            } else {
              product.averageLandedCost = landedCostInAZN;
            }
          } else {
            product.averageLandedCost = landedCostInAZN;
          }
        }
      });
      return updatedProducts;
    });
  }, [setProducts]);

  const updateStockForProductMovement = useCallback((newMovement: ProductMovement | null, oldMovement: ProductMovement | null) => {
    setProducts(prevProducts => {
      const updatedProducts = JSON.parse(JSON.stringify(prevProducts));

      // Reverse old movement's stock changes if it exists
      if (oldMovement) {
        (oldMovement.items || []).forEach(item => {
          const p = updatedProducts.find((prod: Product) => prod.id === item.productId);
          if (p && p.stock) {
            p.stock[oldMovement.sourceWarehouseId] = (p.stock[oldMovement.sourceWarehouseId] || 0) + item.quantity; // Add back to source
            p.stock[oldMovement.destWarehouseId] = (p.stock[oldMovement.destWarehouseId] || 0) - item.quantity; // Remove from destination
          }
        });
      }

      // Apply new movement's stock changes if it exists
      if (newMovement) {
        (newMovement.items || []).forEach(item => {
          const p = updatedProducts.find((prod: Product) => prod.id === item.productId);
          if (p) {
            if (!p.stock) p.stock = {};
            p.stock[newMovement.sourceWarehouseId] = (p.stock[newMovement.sourceWarehouseId] || 0) - item.quantity; // Remove from source
            p.stock[newMovement.destWarehouseId] = (p.stock[newMovement.destWarehouseId] || 0) + item.quantity; // Add to destination
            if (p.stock[newMovement.sourceWarehouseId] < 0) p.stock[newMovement.sourceWarehouseId] = 0; // Prevent negative stock
          }
        });
      }
      return updatedProducts;
    });
  }, [setProducts]);

  return {
    updateStockFromOrder,
    updateAverageCosts,
    updateStockForProductMovement,
  };
}