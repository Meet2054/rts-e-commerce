import Navigation from '@/components/coustom-ui/navigation';
import ProductList from '@/components/products/product-list';

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Our Products</h1>
          <p className="text-gray-600">
            Browse our complete catalog with special pricing for business customers
          </p>
        </div>
        
        <ProductList />
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Products - B2B Store',
  description: 'Browse our complete product catalog with special pricing for business customers.'
}; 