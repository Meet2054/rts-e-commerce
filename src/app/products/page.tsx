
import { ApprovalGuard } from '@/components/auth/approval-guard';
import ProductListWithCart from './components/product-list';

export default function ProductPage() {
  return (
    <ApprovalGuard>
      <div className='space-y-3 bg-[#F1F2F4]'>
        <ProductListWithCart />
      </div>
    </ApprovalGuard>
  );
}
