// src/components/ui/product-image.tsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ImageOff, Package } from 'lucide-react';
import { getProductImageUrlQuick, handleImageError } from '@/lib/product-image-utils';

interface ProductImageProps {
  sku: string | undefined | null;
  katunPn?: string | number | null;
  name: string;
  width: number;
  height: number;
  className?: string;
  showMessage?: boolean;
  priority?: boolean;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  sku,
  katunPn,
  name,
  width,
  height,
  className = '',
  showMessage = true,
  priority = false
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');

  // Initialize image URL with SKU and Katun PN fallback
  React.useEffect(() => {
    const initialUrl = getProductImageUrlQuick(sku, katunPn);
    setCurrentImageUrl(initialUrl);
    // If no URL is generated, set image error to show fallback UI
    if (!initialUrl || initialUrl === '') {
      setImageError(true);
      setIsLoading(false);
    }
  }, [sku, katunPn]);

  // Handle invalid SKU at component level
  if (!sku || typeof sku !== 'string' || !sku.trim()) {
    return (
      <div 
        className={`flex flex-col items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg ${className}`}
        style={{ width, height }}
      >
        <ImageOff className="w-8 h-8 text-gray-400 mb-2" />
        {showMessage && (
          <div className="text-center px-2">
            <p className="text-xs text-gray-500 font-medium">Invalid product</p>
            <p className="text-xs text-gray-400 mt-1">No OEM PN provided</p>
          </div>
        )}
      </div>
    );
  }

  const handleImageErrorWithFallback = () => {
    setIsLoading(false);
    // Try fallback with different extensions and Katun PN
    handleImageError(sku, (newUrl: string) => {
      if (newUrl && newUrl !== '') {
        setCurrentImageUrl(newUrl);
        setImageError(false);
      } else {
        setImageError(true);
      }
    }, katunPn);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  // If image failed to load, show the not found message
  if (imageError) {
    return (
      <div 
        className={`flex flex-col items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg w-full h-full ${className}`}
        style={{ width, height }}
      >
        <ImageOff className="w-8 h-8 text-gray-400 mb-2" />
        {showMessage && (
          <div className="text-center px-2">
            <p className="text-xs text-gray-500 font-medium">Image not available</p>
            <p className="text-xs text-gray-400 mt-1">OEM PN: {sku}</p>
            {katunPn && (
              <p className="text-xs text-gray-400">Katun PN: {katunPn}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  // Don't render image if no URL is set yet and we're still loading
  if (!currentImageUrl && isLoading) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
        style={{ width, height }}
      >
        <Package className="w-6 h-6 text-gray-400 animate-pulse" />
      </div>
    );
  }
  
  // If no image URL is available, treat as error and don't try to render Image component
  if (!currentImageUrl || currentImageUrl === '') {
    return (
      <div 
        className={`flex flex-col items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg w-full h-full ${className}`}
        style={{ width, height }}
      >
        <ImageOff className="w-8 h-8 text-gray-400 mb-2" />
        {showMessage && (
          <div className="text-center px-2">
            <p className="text-xs text-gray-500 font-medium">Image not available</p>
            <p className="text-xs text-gray-400 mt-1">OEM PN: {sku}</p>
            {katunPn && (
              <p className="text-xs text-gray-400">Katun PN: {katunPn}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div 
          className={`absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
        >
          <Package className="w-6 h-6 text-gray-400 animate-pulse" />
        </div>
      )}
      <Image
        src={currentImageUrl}
        alt={name}
        width={width}
        height={height}
        className={className}
        priority={priority}
        onError={handleImageErrorWithFallback}
        onLoad={handleImageLoad}
        style={{
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out'
        }}
      />
    </div>
  );
};

export default ProductImage;