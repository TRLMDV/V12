"use client";

import React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { t } from '@/utils/i18n';

interface PaginationControlsProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) {
    return null; // Don't show pagination if there's only one page or no items
  }

  const getPageNumbers = () => {
    const pageNumbers: (number | 'ellipsis')[] = [];
    const maxPagesToShow = 5; // Number of page links to show directly

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);

      // Determine start and end of the window around the current page
      let startPage = Math.max(2, currentPage - Math.floor((maxPagesToShow - 3) / 2));
      let endPage = Math.min(totalPages - 1, currentPage + Math.ceil((maxPagesToShow - 3) / 2));

      // Adjust window if it's too close to the start or end
      if (currentPage <= Math.ceil(maxPagesToShow / 2) && totalPages > maxPagesToShow) {
        endPage = maxPagesToShow - 1;
      }
      if (currentPage > totalPages - Math.ceil(maxPagesToShow / 2) && totalPages > maxPagesToShow) {
        startPage = totalPages - maxPagesToShow + 2;
      }

      if (startPage > 2) {
        pageNumbers.push('ellipsis');
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      if (endPage < totalPages - 1) {
        pageNumbers.push('ellipsis');
      }

      // Always show last page if not already included
      if (!pageNumbers.includes(totalPages)) {
        pageNumbers.push(totalPages);
      }
    }
    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

  return (
    <Pagination className="mt-6">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            aria-disabled={currentPage === 1}
            className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>
        {pageNumbers.map((page, index) => (
          <PaginationItem key={index}>
            {page === 'ellipsis' ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                onClick={() => onPageChange(page as number)}
                isActive={currentPage === page}
              >
                {page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            aria-disabled={currentPage === totalPages}
            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default PaginationControls;