"use client";

import React from 'react';
import FormModal from '@/components/FormModal';
import { t } from '@/utils/i18n';

interface ImageEnlargerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  productName: string;
}

const ImageEnlargerModal: React.FC<ImageEnlargerModalProps> = ({ isOpen, onClose, imageUrl, productName }) => {
  const defaultImage = 'https://placehold.co/600x600/e2e8f0/e2e8f0?text=No-Image';
  const finalImageUrl = imageUrl && imageUrl.startsWith('data:image') ? imageUrl : defaultImage;

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t('productImage')}: ${productName}`}
      description={t('clickOutsideToClose')}
    >
      <div className="flex justify-center items-center p-4">
        <img
          src={finalImageUrl}
          className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-lg"
          alt={productName}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = defaultImage;
          }}
        />
      </div>
    </FormModal>
  );
};

export default ImageEnlargerModal;