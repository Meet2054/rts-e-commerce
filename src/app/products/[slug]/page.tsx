
"use client";

import ProductDetails from "../components/ProductDetail";
import SimilarProducts from "../components/SimilarProducts";
import { notFound } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { useState, useEffect } from 'react';

// Define the Product interface to match our API response
interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  brand: string;
  price: number;
  image: string;
  rating: number;
  reviews: number;
  category: string;
  oem: string;
  oemPN: string;
  katunPN: string;
  comments: string;
  forUseIn: string;
}

interface RelatedProduct {
  id: string;
  sku: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  rating: number;
  reviews: number;
  category: string;
}

async function fetchProduct(sku: string, token?: string): Promise<Product | null> {
  try {
    console.log(`🔍 [Page] Fetching product: ${sku}`);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/products/${sku}`, {
      headers,
      cache: 'no-store' // Always fetch fresh data for product details
    });
    
    if (!response.ok) {
      console.error(`❌ [Page] Product ${sku} not found: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.success && data.product) {
      console.log(`✅ [Page] Product ${sku} fetched from ${data.source}`);
      return data.product;
    }
    
    return null;
  } catch (error) {
    console.error(`❌ [Page] Error fetching product ${sku}:`, error);
    return null;
  }
}

async function fetchRelatedProducts(brand: string, excludeSku: string, token?: string): Promise<RelatedProduct[]> {
  try {
    console.log(`🔍 [Page] Fetching related products for brand: ${brand}`);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/products/related/${encodeURIComponent(brand)}?exclude=${excludeSku}&limit=6`,
      { headers }
    );
    
    if (!response.ok) {
      console.error(`❌ [Page] Failed to fetch related products for ${brand}: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    
    if (data.success && data.products) {
      console.log(`✅ [Page] Related products for ${brand} fetched from ${data.source}: ${data.products.length} products`);
      return data.products;
    }
    
    return [];
  } catch (error) {
    console.error(`❌ [Page] Error fetching related products for ${brand}:`, error);
    return [];
  }
}

export default function ProductDescriptionPage({ params }: { params: { slug: string } }) {
  const { token } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProductData = async () => {
      try {
        setLoading(true);
        const awaitedParams = await params;
        const { slug } = awaitedParams;
        
        console.log(`🔍 [Page] Loading product detail page for SKU: ${slug}`);
        
        // Fetch the main product with user authentication
        const fetchedProduct = await fetchProduct(slug, token || undefined);
        
        if (!fetchedProduct) {
          console.log(`❌ [Page] Product ${slug} not found`);
          setError('Product not found');
          return;
        }
        
        setProduct(fetchedProduct);
        
        // Fetch related products
        const related = await fetchRelatedProducts(fetchedProduct.brand, fetchedProduct.sku, token || undefined);
        setRelatedProducts(related);
        
      } catch (error) {
        console.error('Error loading product:', error);
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    loadProductData();
  }, [params, token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    notFound();
  }

  console.log(`✅ [Page] Product detail page loaded for ${product.name} with ${relatedProducts.length} related products`);

  return (
    <div className="space-y-3 bg-[#F1F2F4]">
      <ProductDetails product={product} related={relatedProducts} />
      <SimilarProducts product={product} products={relatedProducts} />
    </div>
  );
}
