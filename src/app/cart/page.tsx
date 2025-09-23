
import { ApprovalGuard } from '@/components/auth/approval-guard';
import Cart from "./components/Cart";
import RecommendedProducts from "./components/RecommendedProducts";

export default function CartPage() {
	return (
		<ApprovalGuard>
			<div className="space-y-3">
				<Cart />
				<RecommendedProducts />
			</div>
		</ApprovalGuard>
	);
}

