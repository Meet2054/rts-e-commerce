
import ProductDetails from "../components/ProductDetail";
import SimilarProducts from "../components/SimilarProducts";
import { notFound } from 'next/navigation';

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

async function fetchProduct(sku: string): Promise<Product | null> {
  try {
    console.log(`🔍 [Page] Fetching product: ${sku}`);
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/products/${sku}`, {
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

async function fetchRelatedProducts(brand: string, excludeSku: string): Promise<RelatedProduct[]> {
  try {
    console.log(`🔍 [Page] Fetching related products for brand: ${brand}`);
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/products/related/${encodeURIComponent(brand)}?exclude=${excludeSku}&limit=6`,
      { cache: 'no-store' }
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

export default async function ProductDescriptionPage({ params }: { params: { slug: string } }) {
  const awaitedParams = await params;
  const { slug } = awaitedParams;
  
  console.log(`🔍 [Page] Loading product detail page for SKU: ${slug}`);
  
  // Fetch the main product
  const product = await fetchProduct(slug);
  
  if (!product) {
    console.log(`❌ [Page] Product ${slug} not found, showing 404`);
    notFound();
  }
  
  // Fetch related products
  const related = await fetchRelatedProducts(product.brand, product.sku);
  
  console.log(`✅ [Page] Product detail page loaded for ${product.name} with ${related.length} related products`);

  return (
    <div className="space-y-3 bg-[#F1F2F4]">
      <ProductDetails product={product} related={related} />
      <SimilarProducts product={product} products={related} />
    </div>
  );
}
