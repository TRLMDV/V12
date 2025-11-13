"use client";

import { useCallback, useMemo } from 'react'; // Add useMemo to the import
import { useData, MOCK_CURRENT_DATE } from '@/context/DataContext';
import { toast } from 'sonner';
import { SellOrder, Product, OrderItem, ProductMovement, Payment, Currency, PackingUnit } from '@/types';
import { t } from '@/utils/i18n';

// ... (rest of the file remains the same) ...