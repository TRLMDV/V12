"use client";

import { useMemo } from 'react';
import { PackingUnit, Warehouse } from '@/types';

interface UseDataMapsProps {
  packingUnits: PackingUnit[];
  warehouses: Warehouse[];
}

export function useDataMaps({ packingUnits, warehouses }: UseDataMapsProps) {
  const packingUnitMap = useMemo(() => {
    return packingUnits.reduce((acc, pu) => ({ ...acc, [pu.id]: pu }), {} as { [key: number]: PackingUnit });
  }, [packingUnits]);

  const warehouseMap = useMemo(() => {
    return warehouses.reduce((acc, w) => ({ ...acc, [w.id]: w }), {} as { [key: number]: Warehouse });
  }, [warehouses]);

  return {
    packingUnitMap,
    warehouseMap,
  };
}