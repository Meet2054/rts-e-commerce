
import { ApprovalGuard } from '@/components/auth/approval-guard';
import ProductListWithCart from './components/product-list';

export default function ProductPage() {
  return (
    <ApprovalGuard>
      <div className='space-y-3'>
        <ProductListWithCart />
      </div>
    </ApprovalGuard>
  );
}
